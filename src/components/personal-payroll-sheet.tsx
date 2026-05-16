'use client';

import { useState, useMemo } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Wallet, Calculator, X, Minus, Plus, Equal } from "lucide-react";
import { format, getDaysInMonth, isWeekend, differenceInMinutes, startOfMonth, endOfMonth, setDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, Timestamp } from 'firebase/firestore';
import staffRegistry from '@/app/lib/initial-staff.json';

const DEFAULT_RATES: Record<string, number> = staffRegistry.roles.reduce((acc, role) => {
  acc[role.id] = role.rate;
  return acc;
}, {} as Record<string, number>);

interface PersonalPayrollSheetProps {
  user: any;
  verifications: any[];
}

export function PersonalPayrollSheet({ user, verifications }: PersonalPayrollSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState<'1-15' | '16-30' | 'Full'>('Full');
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const firestore = useFirestore();

  const globalSettingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'global_settings'));
  }, [firestore, user]);
  const { data: globalSettings } = useCollection<any>(globalSettingsQuery);

  const taxConfig = useMemo(() => {
    const defaultTaxConfig = {
      sssRate: 5, sssCeiling: 35000,
      philHealthRate: 5, philHealthCap: 100000,
      pagIbigShare: 200
    };
    if (!globalSettings) return defaultTaxConfig;
    const dbConfig = globalSettings.find((doc: any) => doc.id === 'payroll_tax_config');
    return dbConfig ? { ...defaultTaxConfig, ...dbConfig } : defaultTaxConfig;
  }, [globalSettings]);

  const payrollData = useMemo(() => {
    if (!user) return null;

    const monthIdx = parseInt(selectedMonth);
    const year = parseInt(selectedYear);
    
    // Determine date range for the period
    let startDate = new Date(year, monthIdx, 1);
    let endDate = new Date(year, monthIdx, getDaysInMonth(startDate));

    if (period === '1-15') {
      endDate = new Date(year, monthIdx, 15);
    } else if (period === '16-30') {
      startDate = new Date(year, monthIdx, 16);
    }

    // Filter logs strictly within the selected period
    const userLogs = verifications.filter(log => {
      if (!log.timestamp?.toDate || log.userId !== user.id) return false;
      const logDate = log.timestamp.toDate();
      return logDate >= startDate && logDate <= new Date(endDate.setHours(23, 59, 59, 999));
    });

    const grouped: Record<string, any[]> = {};
    userLogs.forEach(log => {
      const dateStr = format(log.timestamp.toDate(), 'yyyy-MM-dd');
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(log);
    });

    // Calculate working days (Mon-Fri) in the period
    let totalWorkingDays = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (!isWeekend(d)) {
        totalWorkingDays++;
      }
    }

    let totalMinutesWorked = 0;
    let regularMinutes = 0;
    let overtimeMinutes = 0;
    let lateMinutesTotal = 0;
    let daysPresent = 0;

    Object.values(grouped).forEach(dayLogs => {
      const sorted = dayLogs.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      const inLog = sorted.find(l => l.status?.includes('Logged (Office)') || l.status?.includes('Logged (WFH)'));
      const outLog = [...sorted].reverse().find(l => l.status === 'Logged (Offline)');
      
      if (inLog) {
        // Check if it's a weekday
        if (!isWeekend(inLog.timestamp.toDate())) {
          daysPresent++;
        }

        // Late calculation (past 9:15 AM)
        const clockInTime = inLog.timestamp.toDate();
        const hour = clockInTime.getHours();
        const min = clockInTime.getMinutes();
        const totalMins = hour * 60 + min;
        const targetMins = 9 * 60; // 9:00 AM
        
        if (totalMins > targetMins + 15) {
          lateMinutesTotal += (totalMins - targetMins);
        }

        if (outLog) {
          const dayMinutes = differenceInMinutes(outLog.timestamp.toDate(), clockInTime);
          totalMinutesWorked += dayMinutes;
          regularMinutes += Math.min(dayMinutes, 480); // 8 hours cap
          overtimeMinutes += Math.max(0, dayMinutes - 480);
        }
      }
    });

    const hourlyRate = user.hourlyRate || DEFAULT_RATES[user.role] || 0;
    const dailyRate = hourlyRate * 8;

    // Base Pay = Expected Pay for 100% attendance
    const baseGrossPay = totalWorkingDays * dailyRate;

    const otHours = overtimeMinutes / 60;
    const overtimePay = otHours * hourlyRate;
    const lateDeductions = (hourlyRate / 60) * lateMinutesTotal;

    // Absent Calculation
    const missingDays = Math.max(0, totalWorkingDays - daysPresent);
    const absentDeductions = missingDays * dailyRate;

    // Admin-Equivalent Gross Salary
    // This perfectly matches what the Admin sees as "Gross Salary" because Admin uses `totalHours * rate`.
    const totalHours = Math.round((totalMinutesWorked / 60) * 100) / 100;
    const adminGrossSalary = totalHours * hourlyRate;

    // Statutory Deductions
    const isIntern = user.role === 'INTERN';
    const sssDeduction = isIntern ? 0 : Math.min(adminGrossSalary, taxConfig.sssCeiling) * (taxConfig.sssRate / 100);
    const philHealthDeduction = isIntern ? 0 : Math.min(adminGrossSalary, taxConfig.philHealthCap) * (taxConfig.philHealthRate / 100) / 2;
    const pagIbigDeduction = (adminGrossSalary > 0 && !isIntern) ? taxConfig.pagIbigShare : 0;
    const totalStatutory = adminGrossSalary > 0 ? (sssDeduction + philHealthDeduction + pagIbigDeduction) : 0;

    // Taxable Income & TRAIN Law Withholding Tax
    const taxableIncome = Math.max(0, adminGrossSalary - totalStatutory);
    let withholdingTax = 0;
    if (!isIntern && taxableIncome > 0) {
      const annualTaxableIncome = taxableIncome * 12;
      let annualTax = 0;
      if (annualTaxableIncome <= 250000) {
        annualTax = 0;
      } else if (annualTaxableIncome <= 400000) {
        annualTax = (annualTaxableIncome - 250000) * 0.15;
      } else if (annualTaxableIncome <= 800000) {
        annualTax = 22500 + (annualTaxableIncome - 400000) * 0.20;
      } else if (annualTaxableIncome <= 2000000) {
        annualTax = 102500 + (annualTaxableIncome - 800000) * 0.25;
      } else if (annualTaxableIncome <= 8000000) {
        annualTax = 402500 + (annualTaxableIncome - 2000000) * 0.30;
      } else {
        annualTax = 2202500 + (annualTaxableIncome - 8000000) * 0.35;
      }
      withholdingTax = annualTax / 12;
    }

    // Manual Adjustments
    const periodKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    const periodAdjustments = user.manualAdjustments?.[periodKey] || [];
    const totalAdjustments = periodAdjustments.reduce((acc: number, adj: any) => {
      return adj.type === 'ADDITION' ? acc + adj.amount : acc - adj.amount;
    }, 0);

    const taxesAndStatutory = totalStatutory + withholdingTax;
    const netPay = Math.max(0, adminGrossSalary - taxesAndStatutory + totalAdjustments);

    return {
      grossPay: baseGrossPay,
      overtimePay,
      lateDeductions,
      absentDeductions,
      taxesAndStatutory,
      totalAdjustments,
      netPay,
      dailyRate,
      hourlyRate,
      periodLabel: `${format(new Date(year, monthIdx), 'MMM')} ${period === 'Full' ? 'Full Month' : period}, ${year}`
    };
  }, [user, verifications, period, selectedMonth, selectedYear]);



  if (!user || user.role === 'INTERN') return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 rounded-2xl h-12 px-4 md:px-6 border-slate-200 shadow-sm font-black bg-white text-slate-700 hover:text-primary transition-all hover:scale-[1.02]">
          <Wallet className="w-5 h-5 text-primary" />
          <span className="hidden sm:inline">My Payroll</span>
          <span className="sm:hidden text-xs">Payroll</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-slate-50 border-none shadow-2xl flex flex-col h-full rounded-l-[32px] overflow-hidden">
        <div className="p-6 md:p-8 bg-white border-b">
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-black tracking-tight text-slate-900">
                Deductions & Overtime
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full bg-slate-100 hover:bg-slate-200">
                <X className="w-4 h-4 text-slate-500" />
              </Button>
            </div>
            <SheetDescription className="text-xs text-slate-500 font-medium leading-relaxed">
              Schedule: Mon-Fri · 09:00-18:00 · 15-min grace · Absent = hourly × 8
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 p-6 md:p-8">
          <div className="space-y-8 pb-10">
            {/* Controls */}
            <div className="space-y-4">
              <div className="inline-flex bg-slate-200/50 p-1 rounded-xl w-fit">
                {(['1-15', '16-30', 'Full'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                      period === p 
                        ? "bg-red-700 text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200 font-bold text-slate-700 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}).map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>{format(new Date(2000, i), 'MMMM')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200 font-bold text-slate-700 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 5}).map((_, i) => {
                      const y = (currentDate.getFullYear() - i).toString();
                      return <SelectItem key={y} value={y}>{y}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs font-medium text-slate-500 pt-2">
                Period: <span className="font-bold text-slate-700">{payrollData?.periodLabel}</span> · 
                Daily Rate: <span className="font-bold text-slate-700">₱{payrollData?.dailyRate.toFixed(2)}</span> · 
                Hourly: <span className="font-bold text-slate-700">₱{payrollData?.hourlyRate.toFixed(2)}</span>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Gross Pay */}
              <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border-t-4 border-t-emerald-500 border-x border-b border-x-slate-100 border-b-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-slate-700 text-sm">₱</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight text-emerald-500">₱{payrollData?.grossPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Gross Pay</p>
              </div>

              {/* Late Deductions */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-t-amber-500 border-x border-b border-x-slate-100 border-b-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <Minus className="w-3 h-3 text-slate-700" strokeWidth={4} />
                </div>
                <h3 className="text-xl font-black tracking-tight text-amber-500">₱{payrollData?.lateDeductions.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-tight">Late<br/>Deductions</p>
              </div>

              {/* Absent Deductions */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-t-red-500 border-x border-b border-x-slate-100 border-b-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <Minus className="w-3 h-3 text-slate-700" strokeWidth={4} />
                </div>
                <h3 className="text-xl font-black tracking-tight text-red-500">₱{payrollData?.absentDeductions.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-tight">Absent<br/>Deductions</p>
              </div>

              {/* Overtime Pay */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-t-violet-500 border-x border-b border-x-slate-100 border-b-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <Plus className="w-3 h-3 text-slate-700" strokeWidth={4} />
                </div>
                <h3 className="text-xl font-black tracking-tight text-violet-500">₱{payrollData?.overtimePay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-tight">Overtime<br/>Pay</p>
              </div>

              {/* Taxes & Statutory */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-t-slate-800 border-x border-b border-x-slate-100 border-b-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <Minus className="w-3 h-3 text-slate-700" strokeWidth={4} />
                </div>
                <h3 className="text-xl font-black tracking-tight text-slate-800">₱{payrollData?.taxesAndStatutory.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-tight">Taxes &<br/>Statutory</p>
              </div>

              {/* Net Pay */}
              <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border-t-4 border-t-red-600 border-x border-b border-x-slate-100 border-b-slate-100 flex flex-col justify-center mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Equal className="w-3 h-3 text-slate-700" strokeWidth={4} />
                  </div>
                  {(payrollData?.totalAdjustments || 0) !== 0 && (
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-md",
                      (payrollData?.totalAdjustments || 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {(payrollData?.totalAdjustments || 0) > 0 ? "+" : ""}₱{payrollData?.totalAdjustments.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} Adj
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black tracking-tight text-red-600">₱{payrollData?.netPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Net Pay</p>
              </div>


            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
