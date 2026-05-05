'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval, differenceInMinutes } from 'date-fns';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  LogOut,
  Timer,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { ClockOutCamera } from '@/components/clock-out-camera';

interface AttendanceHeaderProps {
  user: any;
  verifications: any[];
}

export function AttendanceHeader({ user, verifications }: AttendanceHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'in' | 'out'>('out');
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate stats
  const leaveBalance = user?.leaveBalance ?? 8;
  
  const weeklyHours = useMemo(() => {
    if (!verifications) return '0h 0m';
    
    const now = new Date();
    const start = startOfWeek(now);
    const end = endOfWeek(now);
    
    // Calculate actual hours from clock-in/clock-out pairs
    const weekLogs = verifications.filter(log => {
      if (!log.timestamp?.toDate) return false;
      const logDate = log.timestamp.toDate();
      return isWithinInterval(logDate, { start, end }) && log.userId === user.id;
    });

    // Group by date
    const grouped: Record<string, any[]> = {};
    weekLogs.forEach(log => {
      const dateStr = format(log.timestamp.toDate(), 'yyyy-MM-dd');
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(log);
    });

    let totalMinutes = 0;
    Object.values(grouped).forEach(dayLogs => {
      const sorted = dayLogs.sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      const inLog = sorted.find((l: any) => l.status?.includes('Logged (Office)') || l.status?.includes('Logged (WFH)'));
      const outLog = [...sorted].reverse().find((l: any) => l.status === 'Logged (Offline)');
      if (inLog && outLog) {
        totalMinutes += differenceInMinutes(outLog.timestamp.toDate(), inLog.timestamp.toDate());
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  }, [verifications, user.id]);

  // Today's clock-in status and time
  const todayData = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const logsToday = verifications?.filter(log => {
      if (!log.timestamp?.toDate) return false;
      return format(log.timestamp.toDate(), 'yyyy-MM-dd') === today && log.userId === user.id;
    }).sort((a: any, b: any) => a.timestamp.toMillis() - b.timestamp.toMillis()) || [];
    
    if (logsToday.length === 0) {
      return { status: 'Not Clocked In', clockInTime: null, isClockedOut: false, clockInLog: null, clockOutLog: null };
    }

    const inLog = logsToday.find((l: any) => l.status?.includes('Logged (Office)') || l.status?.includes('Logged (WFH)'));
    const lastLog = [...logsToday].reverse()[0];
    const isClockedOut = lastLog?.status === 'Logged (Offline)';
    
    return {
      status: isClockedOut ? 'Clocked Out' : (inLog ? 'Clocked In' : 'Not Clocked In'),
      clockInTime: inLog?.timestamp?.toDate() || null,
      isClockedOut,
      clockInLog: inLog || null,
      clockOutLog: isClockedOut ? lastLog : null
    };
  }, [verifications, user.id, currentTime]);

  // Live elapsed time since clock-in
  const elapsedData = useMemo(() => {
    if (!todayData.clockInTime || todayData.isClockedOut) return null;
    const mins = differenceInMinutes(currentTime, todayData.clockInTime);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const isOT = mins > 480; // 8 hours = 480 minutes
    return { hours: h, minutes: m, totalMinutes: mins, isOT, display: `${h}h ${m}m` };
  }, [todayData, currentTime]);

  // Handle clock out
  const handleClockInCapture = useCallback(async (photoData: string) => {
    if (!firestore || !user) return;
    
    const verificationsRef = collection(firestore, 'verifications');
    const clockInData = {
      userId: user.id,
      userName: user.name,
      userSystemId: user.systemId,
      email: user.email || '',
      timestamp: serverTimestamp(),
      isVerified: true,
      method: 'Camera Clock In',
      status: 'Logged (WFH)',
      photoData,
      devicePlatform: navigator.userAgent
    };

    try {
      await addDoc(verificationsRef, clockInData);
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: verificationsRef.path,
        operation: 'create',
        requestResourceData: clockInData
      }));
    }

    try {
      const userRef = doc(firestore, 'users', user.id);
      await setDoc(userRef, { 
        status: 'WFH',
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (e) {
      console.warn('Status sync failed', e);
    }

    setIsCameraOpen(false);
    
    toast({
      title: "⏱ Clocked In Successfully",
      description: "Your session has started with photo verification.",
    });
  }, [firestore, user, toast]);

  const handleClockOutCapture = useCallback(async (photoData: string) => {
    if (!firestore || !user) return;
    
    const verificationsRef = collection(firestore, 'verifications');
    const clockOutData = {
      userId: user.id,
      userName: user.name,
      userSystemId: user.systemId,
      email: user.email || '',
      timestamp: serverTimestamp(),
      isVerified: true,
      method: 'Clock Out Camera',
      status: 'Logged (Offline)',
      photoData,
      devicePlatform: navigator.userAgent
    };

    try {
      await addDoc(verificationsRef, clockOutData);
    } catch (err) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: verificationsRef.path,
        operation: 'create',
        requestResourceData: clockOutData
      }));
    }

    // Update user status to Offline
    try {
      const userRef = doc(firestore, 'users', user.id);
      await setDoc(userRef, { 
        status: 'Offline',
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (e) {
      console.warn('Status sync failed', e);
    }

    setIsCameraOpen(false);
    
    toast({
      title: "⏱ Clocked Out Successfully",
      description: `Your session has been logged with photo verification.${elapsedData?.isOT ? ` (${elapsedData.display} — includes OT)` : ''}`,
    });
  }, [firestore, user, toast, elapsedData]);

  const isClockedIn = todayData.status === 'Clocked In';

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
          
          <div className="flex flex-col items-end gap-3">
            <div className="text-right space-y-1">
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
                {format(currentTime, 'EEEE, MMMM dd, yyyy')}
              </p>
              <div className="text-4xl font-black tabular-nums tracking-tighter">
                {format(currentTime, 'hh:mm:ss a')}
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase">Asia/Manila (GMT+8)</p>
            </div>

            {/* Clock Buttons */}
            {isClockedIn ? (
              <Button
                onClick={() => { setCameraMode('out'); setIsCameraOpen(true); }}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-black h-12 px-6 rounded-2xl border border-white/20 shadow-lg gap-2 transition-all hover:scale-[1.02]"
              >
                <LogOut className="w-5 h-5" />
                Clock Out
              </Button>
            ) : (
              <Button
                onClick={() => { setCameraMode('in'); setIsCameraOpen(true); }}
                className="bg-green-500 hover:bg-green-400 text-white font-black h-12 px-6 rounded-2xl border border-white/20 shadow-lg gap-2 transition-all hover:scale-[1.02]"
              >
                <Camera className="w-5 h-5" />
                Clock In
              </Button>
            )}
          </div>
        </div>
        
        {/* Today's Logs & Live Shift Timer */}
        {(todayData.clockInLog || todayData.clockOutLog || (isClockedIn && elapsedData)) && (
          <div className="relative z-10 mt-6 flex flex-col md:flex-row md:items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
            
            {/* Clock In Info */}
            {todayData.clockInLog && (
              <div className="flex items-center gap-4">
                {(todayData.clockInLog.photoData || todayData.clockInLog.photoUrl) ? (
                  <img 
                    src={todayData.clockInLog.photoData || todayData.clockInLog.photoUrl} 
                    alt="Clock In" 
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/20 shadow-sm" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                    <Clock className="w-5 h-5 text-white/50" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Clocked In</p>
                  <p className="text-xl font-black tabular-nums tracking-tight text-white">
                    {format(todayData.clockInLog.timestamp.toDate(), 'hh:mm a')}
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            {(todayData.clockInLog && (todayData.clockOutLog || isClockedIn)) && (
              <div className="hidden md:block w-px h-10 bg-white/20 mx-2" />
            )}

            {/* Clock Out Info */}
            {todayData.clockOutLog && (
              <div className="flex items-center gap-4">
                {(todayData.clockOutLog.photoData || todayData.clockOutLog.photoUrl) ? (
                  <img 
                    src={todayData.clockOutLog.photoData || todayData.clockOutLog.photoUrl} 
                    alt="Clock Out" 
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/20 shadow-sm" 
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                    <Clock className="w-5 h-5 text-white/50" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Clocked Out</p>
                  <p className="text-xl font-black tabular-nums tracking-tight text-white">
                    {format(todayData.clockOutLog.timestamp.toDate(), 'hh:mm a')}
                  </p>
                </div>
              </div>
            )}

            {/* Shift Timer */}
            {isClockedIn && elapsedData && (
              <div className="flex-1 flex items-center justify-end gap-4 mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/10 md:border-t-0">
                <Timer className="w-5 h-5 text-white/80 hidden md:block" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Active Shift</p>
                  <p className="text-2xl font-black tabular-nums tracking-tight">{elapsedData.display}</p>
                </div>
                {elapsedData.isOT ? (
                  <Badge className="bg-orange-500 text-white font-black text-[10px] px-3 py-1 rounded-full border-none animate-pulse gap-1.5 ml-2">
                    <AlertTriangle className="w-3 h-3" />
                    OVERTIME
                  </Badge>
                ) : (
                  <div className="text-right ml-4 pl-4 border-l border-white/20">
                    <p className="text-[9px] font-black text-white/40 uppercase">Remaining</p>
                    <p className="text-sm font-black tabular-nums text-white/80">{Math.max(0, 8 - elapsedData.hours)}h {Math.max(0, 60 - elapsedData.minutes) % 60}m</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
              isClockedIn ? "bg-green-50 text-green-500 group-hover:bg-green-500 group-hover:text-white" : 
              todayData.isClockedOut ? "bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white" :
              "bg-slate-50 text-slate-400 group-hover:bg-slate-500 group-hover:text-white"
            )}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Status</p>
              <h3 className={cn(
                "text-2xl font-black tracking-tight",
                isClockedIn ? "text-green-600" : 
                todayData.isClockedOut ? "text-orange-600" :
                "text-slate-900"
              )}>{todayData.status}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera Modal */}
      <ClockOutCamera 
        open={isCameraOpen} 
        onOpenChange={setIsCameraOpen}
        onCaptureComplete={cameraMode === 'in' ? handleClockInCapture : handleClockOutCapture}
        mode={cameraMode}
      />
    </div>
  );
}
