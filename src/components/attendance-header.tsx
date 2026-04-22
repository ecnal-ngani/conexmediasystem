'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { 
  Clock, 
  Calendar, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AttendanceHeaderProps {
  user: any;
  verifications: any[];
}

export function AttendanceHeader({ user, verifications }: AttendanceHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate stats
  const leaveBalance = user?.leaveBalance ?? 8; // Default to 8 if not set
  
  const weeklyHours = useMemo(() => {
    if (!verifications) return '0h 0m';
    
    const now = new Date();
    const start = startOfWeek(now);
    const end = endOfWeek(now);
    
    const weekLogs = verifications.filter(log => {
      if (!log.timestamp?.toDate) return false;
      const logDate = log.timestamp.toDate();
      return isWithinInterval(logDate, { start, end }) && log.userId === user.id && log.status !== 'Clocked Out';
    });

    const totalMinutes = weekLogs.length * 8 * 60; 
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    return `${hours}h ${mins}m`;
  }, [verifications, user.id]);

  const todayStatus = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const logsToday = verifications?.filter(log => {
      if (!log.timestamp?.toDate) return false;
      return format(log.timestamp.toDate(), 'yyyy-MM-dd') === today && log.userId === user.id;
    }).sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
    
    if (!logsToday || logsToday.length === 0) return 'Not Clocked In';
    return logsToday[0].status === 'Clocked Out' ? 'Not Clocked In' : 'Clocked In';
  }, [verifications, user.id]);

  return (
    <div className="space-y-6">
      {/* Red Banner Header */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#EB3C47] to-[#C0242D] p-8 text-white shadow-2xl shadow-red-100">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/80 uppercase tracking-widest">Good morning</p>
            <h1 className="text-5xl font-black tracking-tighter">{user.name?.split(' ')[0] || 'Member'}</h1>
            <p className="text-xs font-bold text-white/60 uppercase tracking-[0.2em]">{user.role?.replace('_', ' ') || 'Employee'}</p>
          </div>
          
          <div className="text-right space-y-1">
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
              {format(currentTime, 'EEEE, MMMM dd, yyyy')}
            </p>
            <div className="text-4xl font-black tabular-nums tracking-tighter">
              {format(currentTime, 'hh:mm:ss a')}
            </div>
            <p className="text-[10px] font-bold text-white/40 uppercase">Asia/Manila (GMT+8)</p>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-black/5 rounded-full blur-2xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
              <Calendar className="w-6 h-6 text-red-500 group-hover:text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leave Balance</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{leaveBalance} days</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
              <Clock className="w-6 h-6 text-green-500 group-hover:text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hours This Week</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{weeklyHours}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
              todayStatus === 'Clocked In' ? "bg-green-50 text-green-500 group-hover:bg-green-500 group-hover:text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-500 group-hover:text-white"
            )}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Status</p>
              <h3 className={cn(
                "text-2xl font-black tracking-tight",
                todayStatus === 'Clocked In' ? "text-green-600" : "text-slate-900"
              )}>{todayStatus}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
