'use client';

/**
 * Admin Hub: Staff Management, Tasking & Payroll
 * 
 * Allows Administrators to:
 * 1. Enroll new staff members and generate system IDs.
 * 2. Manage high-security internal Security Tokens.
 * 3. Assign tasks (directives) to personnel.
 * 4. View attendance and biometric logs with Visual ID.
 * 5. Compute Payroll based on real-time attendance data and custom hourly rates.
 */

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  Loader2, 
  Users, 
  UserMinus, 
  ClipboardList, 
  RefreshCcw,
  Key,
  Eye,
  Camera,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Banknote,
  Clock,
  TrendingUp,
  Mail,
  ShieldAlert,
  Smartphone,
  Wifi,
  Edit2,
  Settings,
  Printer,
  FileText,
  User,
  Plus,
  Calculator
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc, setDoc, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth-context';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import staffRegistry from '@/app/lib/initial-staff.json';

// Default Hourly rates configuration derived from registry file
const DEFAULT_RATES: Record<string, number> = staffRegistry.roles.reduce((acc, role) => {
  acc[role.id] = role.rate;
  return acc;
}, {} as Record<string, number>);

// Role code mappings for system ID generation
const ROLE_CODE_MAPPINGS: Record<string, string> = staffRegistry.roles.reduce((acc, role) => {
  acc[role.id] = role.code;
  return acc;
}, {} as Record<string, string>);

const generateSecurityToken = () => {
  const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CX-${segment()}-${segment()}`;
};

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('EDITOR');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newSecurityToken, setNewSecurityToken] = useState('');
  const [newHourlyRate, setNewHourlyRate] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [visibleTokenIds, setVisibleTokenIds] = useState<Set<string>>(new Set());
  
  // Rate Edit State
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateEditingUser, setRateEditingUser] = useState<any>(null);
  const [editingRateValue, setEditingRateValue] = useState<string>('');

  // Task state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTargetUser, setTaskTargetUser] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [taskCategory, setTaskCategory] = useState('Operations');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Payroll System State
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [payrollSearchQuery, setPayrollSearchQuery] = useState('');
  const [selectedPayrolls, setSelectedPayrolls] = useState<Set<string>>(new Set());
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState<any>(null);
  const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);

  // Tax Configuration State
  const [isTaxConfigModalOpen, setIsTaxConfigModalOpen] = useState(false);
  const [editingTaxConfig, setEditingTaxConfig] = useState<any>({
    sssRate: '5', sssCeiling: '35000', philHealthRate: '5', philHealthCap: '100000', pagIbigShare: '200', withholdingTaxRate: '15'
  });

  // Manual Adjustments State
  const [isManualAdjModalOpen, setIsManualAdjModalOpen] = useState(false);
  const [manualAdjTarget, setManualAdjTarget] = useState<any>(null);
  const [manualAdjAmount, setManualAdjAmount] = useState('');
  const [manualAdjReason, setManualAdjReason] = useState('');
  const [manualAdjType, setManualAdjType] = useState<'DEDUCTION' | 'ADDITION'>('DEDUCTION');

  // Biometric Logs State
  const [selectedLogPhoto, setSelectedLogPhoto] = useState<string | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logDateFilter, setLogDateFilter] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('ALL');
  const [logsLimit, setLogsLimit] = useState(20);

  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isEnrollModalOpen) {
      setNewSecurityToken(generateSecurityToken());
      setNewHourlyRate(DEFAULT_RATES[selectedRole]?.toString() || '0');
    }
  }, [isEnrollModalOpen, selectedRole]);

  // MEMOIZED QUERIES for performance stability
  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'users'), orderBy('systemId', 'asc'));
  }, [firestore, currentUser]);
  const { data: staff, isLoading: staffLoading } = useCollection<any>(staffQuery);

  // Note: historyQuery is used for both Biometric Logs UI and Payroll Calculation. 
  // To satisfy pagination for the UI without breaking payroll (which needs all logs for the month), 
  // we will fetch logs with the limit applied. 
  // (In a true production app, payroll calculation should be a server function, not client-side.)
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'verifications'), orderBy('timestamp', 'desc'), limit(logsLimit));
  }, [firestore, currentUser, logsLimit]);
  const { data: verifications, isLoading: historyLoading } = useCollection<any>(historyQuery);

  const filteredLogs = useMemo(() => {
    if (!verifications) return [];
    return verifications.filter(log => {
       const q = logSearchQuery.toLowerCase();
       const matchesSearch = log.userName?.toLowerCase().includes(q) || log.email?.toLowerCase().includes(q) || log.userSystemId?.toLowerCase().includes(q);
       const matchesStatus = logStatusFilter === 'ALL' || log.status === logStatusFilter;
       const dateStr = log.timestamp?.toDate ? format(log.timestamp.toDate(), 'yyyy-MM-dd') : '';
       const matchesDate = !logDateFilter || dateStr === logDateFilter;
       return matchesSearch && matchesStatus && matchesDate;
    });
  }, [verifications, logSearchQuery, logStatusFilter, logDateFilter]);

  const globalSettingsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'global_settings'));
  }, [firestore, currentUser]);
  const { data: globalSettings } = useCollection<any>(globalSettingsQuery);

  const payrollTransactionsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'payroll_transactions'), orderBy('generatedAt', 'desc'));
  }, [firestore, currentUser]);
  const { data: payrollTransactions, isLoading: payrollLoading } = useCollection<any>(payrollTransactionsQuery);

  const taxConfig = useMemo(() => {
    const defaultTaxConfig = {
      sssRate: 5, sssCeiling: 35000,
      philHealthRate: 5, philHealthCap: 100000,
      pagIbigShare: 200,
      withholdingTaxRate: 15
    };
    if (!globalSettings) return defaultTaxConfig;
    const dbConfig = globalSettings.find((doc: any) => doc.id === 'payroll_tax_config');
    return dbConfig ? { ...defaultTaxConfig, ...dbConfig } : defaultTaxConfig;
  }, [globalSettings]);

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    const q = searchQuery.toLowerCase();
    return staff.filter(emp => 
      emp.name.toLowerCase().includes(q) ||
      emp.systemId.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q) ||
      (emp.email && emp.email.toLowerCase().includes(q))
    );
  }, [staff, searchQuery]);

  // Payroll Calculation Logic (Memoized)
  const payrollData = useMemo(() => {
    if (!staff || !verifications) return [];

    return staff.map(emp => {
      const empLogs = verifications.filter(log => log.userId === emp.id);
      
      const uniqueDays = new Set();
      empLogs.forEach(log => {
        if (log.timestamp?.toDate) {
          uniqueDays.add(format(log.timestamp.toDate(), 'yyyy-MM-dd'));
        }
      });

      const daysActive = uniqueDays.size;
      const hoursPerDay = 8;
      const totalHours = daysActive * hoursPerDay;
      const rate = emp.hourlyRate || DEFAULT_RATES[emp.role] || 0;
      
      const grossSalary = totalHours * rate;
      
      // Statutory Deductions
      const sssDeduction = Math.min(grossSalary, taxConfig.sssCeiling) * (taxConfig.sssRate / 100);
      const philHealthDeduction = Math.min(grossSalary, taxConfig.philHealthCap) * (taxConfig.philHealthRate / 100) / 2; // Employee share is half
      const pagIbigDeduction = grossSalary > 0 ? taxConfig.pagIbigShare : 0;
      
      const totalStatutory = grossSalary > 0 ? (sssDeduction + philHealthDeduction + pagIbigDeduction) : 0;
      
      // Taxable Income & Withholding Tax
      const taxableIncome = Math.max(0, grossSalary - totalStatutory);
      const withholdingTax = taxableIncome * (taxConfig.withholdingTaxRate / 100);

      // Manual Adjustments filtering (specific to the selected period)
      const periodAdjustments = emp.manualAdjustments?.[selectedPayrollPeriod] || [];
      const totalAdjustments = periodAdjustments.reduce((acc: number, adj: any) => {
         return adj.type === 'ADDITION' ? acc + adj.amount : acc - adj.amount;
      }, 0);
      
      const netSalary = Math.max(0, taxableIncome - withholdingTax + totalAdjustments);

      return {
        ...emp,
        daysActive,
        totalHours,
        rate,
        grossSalary,
        sssDeduction,
        philHealthDeduction,
        pagIbigDeduction,
        totalStatutory,
        taxableIncome,
        withholdingTax,
        periodAdjustments,
        totalAdjustments,
        netSalary
      };
    });
  }, [staff, verifications, taxConfig, selectedPayrollPeriod]);

  const nextSystemId = useMemo(() => {
    if (!staff) return "CX-LOAD-00";
    const code = ROLE_CODE_MAPPINGS[selectedRole] || "ST";
    const roleCount = staff.filter((emp: any) => emp.role === selectedRole).length;
    const sequenceNum = (roleCount + 1).toString().padStart(2, '0');
    return `CX-${code}-${sequenceNum}`;
  }, [selectedRole, staff]);

  const handleEnrollStaff = () => {
    if (!firestore || !newUserName || !newUserEmail || !newSecurityToken) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name, Email, and Security Token are required." });
      return;
    }

    const avatar = PlaceHolderImages.find(img => img.id === 'avatar-user')?.imageUrl || '';

    const usersRef = collection(firestore, 'users');
    const newUserData = {
      systemId: nextSystemId,
      name: newUserName,
      email: newUserEmail.toLowerCase(),
      securityToken: newSecurityToken,
      role: selectedRole,
      hourlyRate: parseFloat(newHourlyRate) || 0,
      status: 'Offline',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      avatarUrl: avatar
    };

    addDoc(usersRef, newUserData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: usersRef.path,
        operation: 'create',
        requestResourceData: newUserData
      } satisfies SecurityRuleContext));
    });

    toast({
      title: "Staff Enrolled",
      description: `${newUserName} has been added with ID ${nextSystemId}.`,
    });
    
    setIsEnrollModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewSecurityToken('');
  };

  const handleSaveTaxConfig = async () => {
    if (!firestore) return;
    const configRef = doc(firestore, 'global_settings', 'payroll_tax_config');
    try {
      await setDoc(configRef, {
        sssRate: parseFloat(editingTaxConfig.sssRate),
        sssCeiling: parseFloat(editingTaxConfig.sssCeiling),
        philHealthRate: parseFloat(editingTaxConfig.philHealthRate),
        philHealthCap: parseFloat(editingTaxConfig.philHealthCap),
        pagIbigShare: parseFloat(editingTaxConfig.pagIbigShare),
        withholdingTaxRate: parseFloat(editingTaxConfig.withholdingTaxRate),
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Tax Configuration Saved", description: "Global payroll tax rules updated." });
      setIsTaxConfigModalOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save tax config." });
    }
  };

  const handleSaveManualAdjustment = async () => {
    if (!firestore || !manualAdjTarget) return;
    const userRef = doc(firestore, 'users', manualAdjTarget.id);
    const amount = parseFloat(manualAdjAmount);
    if (isNaN(amount) || amount <= 0 || !manualAdjReason) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Provide a valid amount and reason." });
      return;
    }

    const currentAdjustments = manualAdjTarget.manualAdjustments || {};
    const periodAdjs = currentAdjustments[selectedPayrollPeriod] || [];
    
    periodAdjs.push({
       id: Math.random().toString(36).substring(2, 9),
       amount,
       reason: manualAdjReason,
       type: manualAdjType,
       dateAdded: new Date().toISOString()
    });

    try {
      await setDoc(userRef, {
        manualAdjustments: {
          ...currentAdjustments,
          [selectedPayrollPeriod]: periodAdjs
        }
      }, { merge: true });
      toast({ title: "Adjustment Added", description: `Added ${manualAdjType} of ₱${amount} to ${manualAdjTarget.name}.` });
      setIsManualAdjModalOpen(false);
      setManualAdjAmount('');
      setManualAdjReason('');
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save manual adjustment." });
    }
  };

  const handleGenerateSnapshot = async () => {
    if (!firestore || !payrollData || payrollData.length === 0) return;
    setIsGeneratingPayroll(true);
    try {
      const batch = [];
      for (const emp of payrollData) {
        if (emp.grossSalary === 0) continue; 
        const docId = `${emp.id}_${selectedPayrollPeriod}`;
        const txRef = doc(firestore, 'payroll_transactions', docId);
        batch.push(
          setDoc(txRef, {
            employeeId: emp.id,
            employeeName: emp.name,
            systemId: emp.systemId,
            role: emp.role,
            period: selectedPayrollPeriod,
            historical_rate: emp.rate,
            daysActive: emp.daysActive,
            totalHours: emp.totalHours,
            grossSalary: emp.grossSalary,
            sssDeduction: emp.sssDeduction,
            philHealthDeduction: emp.philHealthDeduction,
            pagIbigDeduction: emp.pagIbigDeduction,
            withholdingTax: emp.withholdingTax,
            taxRateApplied: taxConfig.withholdingTaxRate,
            manualAdjustments: emp.periodAdjustments,
            netSalary: emp.netSalary,
            is_paid: false,
            generatedAt: serverTimestamp(),
          }, { merge: true })
        );
      }
      await Promise.all(batch);
      toast({ title: "Payroll Snapshots Generated", description: `Captured salary versions for ${selectedPayrollPeriod}.` });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Generation Failed", description: "Could not create payroll snapshots." });
    } finally {
      setIsGeneratingPayroll(false);
    }
  };

  const handleTogglePaid = (txId: string, currentStatus: boolean) => {
    if (!firestore) return;
    const txRef = doc(firestore, 'payroll_transactions', txId);
    setDoc(txRef, { is_paid: !currentStatus }, { merge: true }).catch(console.error);
  };

  const handleExportPDF = () => {
    if (selectedPayrolls.size === 0) {
      toast({ variant: "destructive", title: "No Selection", description: "Select at least one payroll record to export." });
      return;
    }
    window.print();
  };

  const handleUpdateRate = () => {
    if (!firestore || !rateEditingUser) return;

    const userRef = doc(firestore, 'users', rateEditingUser.id);
    const updates = { 
      hourlyRate: parseFloat(editingRateValue) || 0,
      updatedAt: serverTimestamp() 
    };

    setDoc(userRef, updates, { merge: true })
      .then(() => {
        toast({ title: "Rate Synchronized", description: `Hourly rate for ${rateEditingUser.name} updated to ₱${editingRateValue}.` });
        setIsRateModalOpen(false);
        setRateEditingUser(null);
      })
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updates
        } satisfies SecurityRuleContext));
      });
  };

  const handleCreateTask = () => {
    if (!firestore || !taskTargetUser || !taskTitle || !taskDueDate || !currentUser) return;

    const tasksRef = collection(firestore, 'tasks');
    const taskData = {
      title: taskTitle,
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDueDate,
      status: 'pending',
      assignedToId: taskTargetUser.id,
      assignedToName: taskTargetUser.name,
      assignedById: currentUser.id,
      assignedByName: currentUser.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    addDoc(tasksRef, taskData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tasksRef.path,
        operation: 'create',
        requestResourceData: taskData
      } satisfies SecurityRuleContext));
    });

    toast({
      title: "Task Assigned",
      description: `Objective assigned to ${taskTargetUser.name}.`,
    });

    setIsTaskModalOpen(false);
    setTaskTitle('');
    setTaskTargetUser(null);
  };

  const handleDeleteStaff = (userId: string, userName: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    
    deleteDoc(userRef).then(() => {
      toast({ title: "Personnel Removed", description: `${userName} has been removed from the registry.` });
    }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'delete'
      } satisfies SecurityRuleContext));
    });
  };

  if (!mounted) return null;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Management</h1>
          {staffLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-none font-bold bg-primary text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll New Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Enroll New Personnel</DialogTitle>
                <DialogDescription>Assign system credentials and payroll parameters.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Work Email</Label>
                  <Input placeholder="john@conex.private" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Key className="w-3 h-3 text-primary" />
                      Security Token
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="CX-ABCD-1234" 
                        value={newSecurityToken} 
                        onChange={(e) => setNewSecurityToken(e.target.value)} 
                        className="font-mono text-sm uppercase"
                      />
                      <Button variant="outline" size="icon" onClick={() => setNewSecurityToken(generateSecurityToken())} className="shrink-0"><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Banknote className="w-3 h-3 text-primary" />
                      Hourly Rate (PHP)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₱</span>
                      <Input type="number" placeholder="500" value={newHourlyRate} onChange={(e) => setNewHourlyRate(e.target.value)} className="pl-8" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {staffRegistry.roles.map(r => <SelectItem key={r.id} value={r.id}>{r.id.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-slate-50 p-2 rounded flex flex-col justify-center border">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">System ID</span>
                    <span className="font-bold text-primary">{nextSystemId}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleEnrollStaff} className="bg-primary text-white font-bold">Enroll</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="bg-white border rounded-xl p-1">
          <TabsTrigger value="staff">Staff Directory</TabsTrigger>
          <TabsTrigger value="attendance">Biometric Logs</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Node</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search directory..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500">System ID</TableHead>
                  <TableHead className="font-bold text-slate-500">Name</TableHead>
                  <TableHead className="font-bold text-slate-500">Security Token</TableHead>
                  <TableHead className="font-bold text-slate-500">Role / Rate</TableHead>
                  <TableHead className="font-bold text-slate-500">Status</TableHead>
                  <TableHead className="text-right font-bold text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No personnel found.</TableCell></TableRow>
                ) : (
                  filteredStaff.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs font-bold">{emp.systemId}</TableCell>
                      <TableCell className="font-bold text-slate-900">{emp.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded select-all">
                            {visibleTokenIds.has(emp.id) ? (emp.securityToken || '—') : '••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => {
                              setVisibleTokenIds(prev => {
                                const next = new Set(prev);
                                if (next.has(emp.id)) next.delete(emp.id);
                                else next.add(emp.id);
                                return next;
                              });
                            }}
                            title={visibleTokenIds.has(emp.id) ? 'Hide token' : 'Reveal token'}
                          >
                            {visibleTokenIds.has(emp.id) ? <Eye className="w-3.5 h-3.5 text-primary" /> : <Key className="w-3.5 h-3.5 text-slate-400" />}
                          </Button>
                          {visibleTokenIds.has(emp.id) && emp.securityToken && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(emp.securityToken);
                                setCopiedTokenId(emp.id);
                                setTimeout(() => setCopiedTokenId(null), 2000);
                                toast({ title: 'Copied', description: `Token for ${emp.name} copied to clipboard.` });
                              }}
                              title="Copy token"
                            >
                              {copiedTokenId === emp.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                            {emp.role.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-500 font-mono mt-0.5">
                            ₱{emp.hourlyRate || DEFAULT_RATES[emp.role]}/hr
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            emp.status === 'Office' ? "bg-green-500" : 
                            emp.status === 'WFH' ? "bg-orange-500" : "bg-slate-300"
                          )} />
                          <Badge variant="outline" className="text-[9px] font-bold uppercase">{emp.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedEmployeeProfile(emp)} title="View Profile">
                            <User className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setManualAdjTarget(emp); setIsManualAdjModalOpen(true); }} title="Add Manual Adjustment">
                            <Plus className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setRateEditingUser(emp); setEditingRateValue((emp.hourlyRate || DEFAULT_RATES[emp.role]).toString()); setIsRateModalOpen(true); }} title="Edit Hourly Rate">
                            <Banknote className="w-4 h-4 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setTaskTargetUser(emp); setIsTaskModalOpen(true); }}>
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600">
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
                                <AlertDialogDescription>Are you sure you want to remove {emp.name} from the registry?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteStaff(emp.id, emp.name)} className="bg-red-600 text-white">Remove</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
           {/* Control Bar */}
           <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search Email or ID..." 
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Label className="text-xs font-bold whitespace-nowrap">Date:</Label>
                  <Input type="date" value={logDateFilter} onChange={(e) => setLogDateFilter(e.target.value)} className="w-full sm:w-auto" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Label className="text-xs font-bold whitespace-nowrap">Status:</Label>
                  <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Outcomes</SelectItem>
                      <SelectItem value="Success">Success</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                      <SelectItem value="System Error">System Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
           </div>

           <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500">Timestamp</TableHead>
                  <TableHead className="font-bold text-slate-500">User Details</TableHead>
                  <TableHead className="font-bold text-slate-500">Biometric Method</TableHead>
                  <TableHead className="font-bold text-slate-500">Device/Platform</TableHead>
                  <TableHead className="font-bold text-slate-500 text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-slate-500">Visual ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : !filteredLogs || filteredLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No logs match the criteria.</TableCell></TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell className="text-xs font-bold text-slate-700 whitespace-nowrap">
                        {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPP p') : 'Pending...'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{log.userName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.email || log.userSystemId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {log.method || 'Facial Recognition'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] text-slate-500 max-w-[150px] truncate block" title={log.devicePlatform || 'Unknown Web'}>
                          {log.devicePlatform || 'Unknown Web'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                         <Badge className={cn(
                           "text-[10px] font-black uppercase shadow-none",
                           (log.status || 'Success') === 'Success' ? "bg-green-100 text-green-700 border-green-200" :
                           (log.status || 'Success') === 'Failed' ? "bg-red-100 text-red-700 border-red-200" :
                           "bg-orange-100 text-orange-700 border-orange-200"
                         )} variant="outline">
                           {log.status || 'Success'}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <button 
                          onClick={() => log.photoUrl && setSelectedLogPhoto(log.photoUrl)}
                          className="group relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-primary transition-colors inline-block"
                        >
                          {log.photoUrl ? (
                            <img src={log.photoUrl} alt="Visual ID" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                              <ShieldCheck className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                          {log.photoUrl && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {(!filteredLogs || filteredLogs.length >= logsLimit) && (
              <div className="p-4 border-t bg-slate-50 flex justify-center">
                 <Button variant="outline" onClick={() => setLogsLimit(prev => prev + 20)} className="font-bold text-slate-600">
                    Load More Logs
                 </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border shadow-none bg-primary text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Banknote className="w-5 h-5 opacity-80" />
                  <TrendingUp className="w-4 h-4 opacity-60" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Estimated Payroll</p>
                <h3 className="text-2xl font-black mt-1">
                  ₱{payrollData.reduce((acc, curr) => acc + curr.netSalary, 0).toLocaleString()}
                </h3>
              </CardContent>
            </Card>
            <Card className="border shadow-none bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <Badge variant="outline" className="text-[9px] font-black uppercase text-green-600 bg-green-50 border-green-200">Active Node</Badge>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Hours Rendered</p>
                <h3 className="text-2xl font-black mt-1 text-slate-900">
                  {payrollData.reduce((acc, curr) => acc + curr.totalHours, 0).toLocaleString()} hrs
                </h3>
              </CardContent>
            </Card>
            <Card className="border shadow-none bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Staff Count</p>
                <h3 className="text-2xl font-black mt-1 text-slate-900">
                  {payrollData.length} Personnel
                </h3>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <Label className="font-bold">Period:</Label>
              <Input 
                type="month" 
                value={selectedPayrollPeriod} 
                onChange={(e) => setSelectedPayrollPeriod(e.target.value)} 
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => { setEditingTaxConfig(taxConfig); setIsTaxConfigModalOpen(true); }} variant="outline" className="font-bold text-slate-700">
                <Settings className="w-4 h-4 mr-2" /> Tax Rules
              </Button>
              <Button onClick={handleGenerateSnapshot} disabled={isGeneratingPayroll} className="bg-primary text-white font-bold">
                {isGeneratingPayroll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                Generate Snapshots
              </Button>
            </div>
          </div>

          <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500">Personnel</TableHead>
                  <TableHead className="font-bold text-slate-500 text-center">Gross Pay</TableHead>
                  <TableHead className="font-bold text-slate-500 text-center">Statutory Ded.</TableHead>
                  <TableHead className="font-bold text-slate-500 text-center">Taxable Income</TableHead>
                  <TableHead className="font-bold text-slate-500 text-center">WHT & Adj</TableHead>
                  <TableHead className="text-right font-bold text-slate-500">Net Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No payroll data available.</TableCell></TableRow>
                ) : (
                  payrollData.map((data) => (
                    <TableRow key={data.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{data.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{data.role.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700">₱{data.grossSalary?.toLocaleString()}</TableCell>
                      <TableCell className="text-center font-bold text-red-500">-₱{data.totalStatutory?.toLocaleString()}</TableCell>
                      <TableCell className="text-center font-bold text-slate-700">₱{data.taxableIncome?.toLocaleString()}</TableCell>
                      <TableCell className="text-center font-bold">
                        <span className="text-red-500">-₱{data.withholdingTax?.toLocaleString()}</span>
                        {data.totalAdjustments !== 0 && (
                           <span className={cn("ml-2 text-[10px]", data.totalAdjustments > 0 ? "text-green-500" : "text-red-500")}>
                             {data.totalAdjustments > 0 ? '+' : ''}₱{data.totalAdjustments.toLocaleString()}
                           </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-black text-primary">₱{data.netSalary?.toLocaleString()}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-[10px] text-slate-400 font-medium italic text-right">*Calculations based on 8-hour shifts per verified logs. WHT and statutory deds applied via tax settings.</p>

          <h3 className="text-xl font-bold mt-10 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" /> Generated Payroll History
          </h3>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
             <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search NAME, DATE, TIMESTAMP..." 
                    value={payrollSearchQuery}
                    onChange={(e) => setPayrollSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="text-sm text-slate-500 whitespace-nowrap">{selectedPayrolls.size} record(s) selected</div>
             </div>
             <Button variant="outline" onClick={handleExportPDF} disabled={selectedPayrolls.size === 0} className="font-bold border-primary text-primary hover:bg-primary/5 w-full md:w-auto">
                <Printer className="w-4 h-4 mr-2" /> Export Payslips (PDF)
             </Button>
          </div>

          <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12"><Checkbox onCheckedChange={(c) => {
                     const filteredTxs = (payrollTransactions || []).filter((tx: any) => {
                        if (!payrollSearchQuery) return true;
                        const q = payrollSearchQuery.toLowerCase();
                        const dateStr = tx.generatedAt?.toDate ? format(tx.generatedAt.toDate(), 'PPP p').toLowerCase() : '';
                        return (tx.employeeName?.toLowerCase().includes(q) || tx.period?.toLowerCase().includes(q) || dateStr.includes(q));
                     });
                     if (c) setSelectedPayrolls(new Set(filteredTxs.map((tx: any) => tx.id)));
                     else setSelectedPayrolls(new Set());
                  }} checked={!!payrollTransactions && payrollTransactions.length > 0 && selectedPayrolls.size > 0} /></TableHead>
                  <TableHead className="font-bold text-slate-500">Period</TableHead>
                  <TableHead className="font-bold text-slate-500">Personnel</TableHead>
                  <TableHead className="font-bold text-slate-500 text-right">Net Salary</TableHead>
                  <TableHead className="font-bold text-slate-500 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : !payrollTransactions || payrollTransactions.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">No transactions found.</TableCell></TableRow>
                ) : (
                  (payrollTransactions.filter((tx: any) => {
                    if (!payrollSearchQuery) return true;
                    const q = payrollSearchQuery.toLowerCase();
                    const dateStr = tx.generatedAt?.toDate ? format(tx.generatedAt.toDate(), 'PPP p').toLowerCase() : '';
                    return (
                       tx.employeeName?.toLowerCase().includes(q) || 
                       tx.period?.toLowerCase().includes(q) || 
                       dateStr.includes(q)
                    );
                  })).map((tx: any) => (
                    <TableRow key={tx.id} className="hover:bg-slate-50">
                      <TableCell>
                         <Checkbox 
                           checked={selectedPayrolls.has(tx.id)} 
                           onCheckedChange={(c) => {
                             const next = new Set(selectedPayrolls);
                             if (c) next.add(tx.id); else next.delete(tx.id);
                             setSelectedPayrolls(next);
                           }} 
                         />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{tx.period}</span>
                          <span className="text-[10px] text-slate-400">
                             {tx.generatedAt?.toDate ? format(tx.generatedAt.toDate(), 'PP p') : 'Pending...'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{tx.employeeName}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{tx.systemId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-black text-primary">₱{tx.netSalary?.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                           <span className={cn("text-xs font-bold uppercase", tx.is_paid ? "text-green-600" : "text-orange-500")}>
                             {tx.is_paid ? "Paid" : "Pending"}
                           </span>
                           <Switch checked={tx.is_paid} onCheckedChange={() => handleTogglePaid(tx.id, tx.is_paid)} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Hourly Rate Dialog */}
      <Dialog open={isRateModalOpen} onOpenChange={setIsRateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Hourly Rate</DialogTitle>
            <DialogDescription>Adjust tactical compensation for {rateEditingUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hourly Rate (PHP)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₱</span>
                <input 
                  type="number" 
                  value={editingRateValue} 
                  onChange={(e) => setEditingRateValue(e.target.value)} 
                  className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 text-lg font-bold" 
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsRateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRate} className="bg-primary text-white font-bold">Synchronize Rate</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Biometric Asset Viewer */}
      <Dialog open={!!selectedLogPhoto} onOpenChange={(open) => !open && setSelectedLogPhoto(null)}>
        <DialogContent className="max-w-[480px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <div className="p-6 md:p-8 space-y-6">
            <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-red-100">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Biometric Asset</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">Visual identity confirm for secure login.</DialogDescription>
              </div>
            </DialogHeader>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden border-4 border-slate-50 relative">
               {selectedLogPhoto && (
                 <img src={selectedLogPhoto} alt="Capture" className="w-full h-full object-cover" />
               )}
               <div className="absolute bottom-4 left-4">
                  <Badge className="bg-green-600 text-white font-black text-[10px] px-3 gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    AUTHORIZED CAPTURE
                  </Badge>
               </div>
            </div>

            <Button onClick={() => setSelectedLogPhoto(null)} className="w-full h-12 rounded-xl font-bold bg-slate-900 text-white">
              Close Visual ID
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Assignment Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to {taskTargetUser?.name}</DialogTitle>
            <DialogDescription>Define the mission objective and priority level.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objective Title</Label>
              <Input placeholder="Client Video Edit" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={taskPriority} onValueChange={(v: any) => setTaskPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENT">URGENT</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                    <SelectItem value="NORMAL">NORMAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} className="bg-primary text-white font-bold">Assign Mission</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Tax Rules Modal */}
      <Dialog open={isTaxConfigModalOpen} onOpenChange={setIsTaxConfigModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Global Tax & Deductions</DialogTitle>
            <DialogDescription>Apply global configuration for statutory rates and withholding.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-1">
              <Label>SSS Rate (%)</Label>
              <Input type="number" value={editingTaxConfig.sssRate} onChange={(e) => setEditingTaxConfig({ ...editingTaxConfig, sssRate: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>SSS Ceiling (PHP)</Label>
              <Input type="number" value={editingTaxConfig.sssCeiling} onChange={(e) => setEditingTaxConfig({ ...editingTaxConfig, sssCeiling: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>PhilHealth Rate (%)</Label>
              <Input type="number" value={editingTaxConfig.philHealthRate} onChange={(e) => setEditingTaxConfig({ ...editingTaxConfig, philHealthRate: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>PhilHealth Cap (PHP)</Label>
              <Input type="number" value={editingTaxConfig.philHealthCap} onChange={(e) => setEditingTaxConfig({ ...editingTaxConfig, philHealthCap: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Pag-IBIG Share (PHP)</Label>
              <Input type="number" value={editingTaxConfig.pagIbigShare} onChange={(e) => setEditingTaxConfig({ ...editingTaxConfig, pagIbigShare: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Withholding Tax (%)</Label>
              <Input type="number" value={editingTaxConfig.withholdingTaxRate} onChange={(e) => setEditingTaxConfig({ ...editingTaxConfig, withholdingTaxRate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsTaxConfigModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTaxConfig} className="bg-primary text-white font-bold">Apply Rules</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Adjustments Modal */}
      <Dialog open={isManualAdjModalOpen} onOpenChange={setIsManualAdjModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Adjustment ({selectedPayrollPeriod})</DialogTitle>
            <DialogDescription>Add a one-time adjustment to {manualAdjTarget?.name}'s net pay.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={manualAdjType} onValueChange={(v: any) => setManualAdjType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEDUCTION">Deduction (Decrease Net Pay)</SelectItem>
                  <SelectItem value="ADDITION">Addition (Increase Net Pay)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (PHP)</Label>
              <Input type="number" placeholder="500" value={manualAdjAmount} onChange={(e) => setManualAdjAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input placeholder="Late Penalty, Bonus..." value={manualAdjReason} onChange={(e) => setManualAdjReason(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsManualAdjModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveManualAdjustment} className="bg-primary text-white font-bold">Add Adjustment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Profile View Modal */}
      <Dialog open={!!selectedEmployeeProfile} onOpenChange={(open) => !open && setSelectedEmployeeProfile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
            <DialogDescription>{selectedEmployeeProfile?.systemId} | {selectedEmployeeProfile?.role?.replace('_', ' ')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
             <div className="flex items-center gap-4">
                <img src={selectedEmployeeProfile?.avatarUrl || PlaceHolderImages[0].imageUrl} alt="Avatar" className="w-16 h-16 rounded-full border bg-slate-50" />
                <div>
                   <h2 className="text-xl font-bold">{selectedEmployeeProfile?.name}</h2>
                   <p className="text-sm text-slate-500">{selectedEmployeeProfile?.email}</p>
                   <p className="text-sm font-mono mt-1 text-primary font-bold">₱{selectedEmployeeProfile?.hourlyRate || DEFAULT_RATES[selectedEmployeeProfile?.role || 'EDITOR']}/hr</p>
                </div>
             </div>
             <div className="border rounded-xl p-4 bg-slate-50">
               <h4 className="font-bold text-sm mb-2 text-slate-700">Manual Adjustments ({selectedPayrollPeriod})</h4>
               {(!selectedEmployeeProfile?.manualAdjustments?.[selectedPayrollPeriod] || selectedEmployeeProfile.manualAdjustments[selectedPayrollPeriod].length === 0) ? (
                 <p className="text-xs text-slate-400 italic">No adjustments for this period.</p>
               ) : (
                 <div className="space-y-2">
                   {selectedEmployeeProfile.manualAdjustments[selectedPayrollPeriod].map((adj: any, i: number) => (
                     <div key={i} className="flex justify-between items-center bg-white p-2 border rounded text-xs font-bold">
                        <span>{adj.reason}</span>
                        <span className={adj.type === 'ADDITION' ? 'text-green-500' : 'text-red-500'}>
                          {adj.type === 'ADDITION' ? '+' : '-'}₱{adj.amount.toLocaleString()}
                        </span>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedEmployeeProfile(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
