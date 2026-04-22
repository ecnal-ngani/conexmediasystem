'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShieldCheck, 
  Mail, 
  Fingerprint, 
  Edit3, 
  Save, 
  X, 
  Trophy, 
  GraduationCap, 
  Calendar,
  Zap,
  Star,
  Building2,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { format, differenceInMinutes, startOfDay } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [mounted, setMounted] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    setMounted(true);
    if (user) {
      setEditName(user.name || '');
      setEditAvatar(user.avatarUrl || '');
    }
  }, [user]);

  // Fetch recent logs for this specific user
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'verifications'), 
      where('userId', '==', user.id),
      orderBy('timestamp', 'desc'), 
      limit(50)
    );
  }, [firestore, user?.id]);
  
  const { data: verifications, isLoading: historyLoading } = useCollection<any>(historyQuery);

  const attendanceData = useMemo(() => {
    if (!verifications) return [];

    const grouped: Record<string, any> = {};

    verifications.forEach((log: any) => {
      if (!log.timestamp?.toDate) return;
      const date = log.timestamp.toDate();
      const dateStr = format(date, 'yyyy-MM-dd');

      if (!grouped[dateStr]) {
        grouped[dateStr] = {
          date: date,
          dateLabel: format(date, 'MMM dd, yyyy'),
          clockIn: null,
          clockOut: null,
          type: log.status?.includes('WFH') ? 'WFH' : 'Office',
          logs: []
        };
      }
      grouped[dateStr].logs.push(log);
    });

    return Object.values(grouped).map((day: any) => {
      const dayLogs = day.logs.sort((a: any, b: any) => a.timestamp.toMillis() - b.timestamp.toMillis());
      
      // Clock In is the first 'Logged (Office/WFH)' record
      const inLog = dayLogs.find((l: any) => l.status?.includes('Logged (Office)') || l.status?.includes('Logged (WFH)'));
      // Clock Out is the latest 'Logged (Offline)' record
      const outLog = [...dayLogs].reverse().find((l: any) => l.status === 'Logged (Offline)');

      const clockInTime = inLog?.timestamp.toDate();
      const clockOutTime = outLog?.timestamp.toDate();

      let duration = '—';
      if (clockInTime && clockOutTime) {
        const diff = differenceInMinutes(clockOutTime, clockInTime);
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        duration = `${hours}h ${mins}m`;
      }

      return {
        ...day,
        clockIn: clockInTime ? format(clockInTime, 'hh:mm a') : '—',
        clockOut: clockOutTime ? format(clockOutTime, 'hh:mm a') : '—',
        duration
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [verifications]);

  if (!mounted || !user) return null;

  const handleSave = () => {
    updateUser({
      name: editName,
      avatarUrl: editAvatar
    });
    setIsEditing(false);
    toast({
      title: "Identity Synchronized",
      description: "Your staff credentials have been updated successfully."
    });
  };

  const isIntern = user.role === 'INTERN';

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Profile Header */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-[32px] -m-2 opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex flex-col md:flex-row items-center gap-8 p-6 bg-white border rounded-[32px] shadow-sm">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-primary text-white text-4xl font-black">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white shadow-sm",
              user.status === 'Office' ? "bg-green-500" : 
              user.status === 'WFH' ? "bg-orange-500" : "bg-slate-300"
            )} />
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                {user.name}
              </h1>
              <Badge className="w-fit mx-auto md:mx-0 bg-primary text-white font-black uppercase tracking-widest text-[10px] px-3">
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-primary" />
                {user.systemId}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary" />
                {user.status} Status
              </span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-2xl font-bold h-12 px-6 border-slate-200"
          >
            {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Credentials */}
        <div className="lg:col-span-2 space-y-8">
          {isEditing ? (
            <Card className="border shadow-none rounded-[32px] bg-white overflow-hidden">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg font-bold">Edit Credentials</CardTitle>
                <CardDescription>Update your tactical display information.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Display Name</Label>
                  <Input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="h-12 rounded-xl focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avatar Data URI / URL</Label>
                  <Input 
                    value={editAvatar} 
                    onChange={(e) => setEditAvatar(e.target.value)} 
                    placeholder="https://..."
                    className="h-12 rounded-xl focus:ring-primary font-mono text-xs"
                  />
                </div>
                <Button 
                  onClick={handleSave} 
                  className="w-full h-12 bg-primary font-black rounded-xl text-white shadow-lg shadow-red-100"
                >
                  <Save className="w-4 h-4 mr-2" />
                  SYNCHRONIZE IDENTITY
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border shadow-none rounded-[32px] bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Communication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase">Primary Email</p>
                    <p className="font-bold text-slate-700">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase">System Frequency</p>
                    <p className="font-bold text-slate-700">Encrypted AES-256</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-none rounded-[32px] bg-white">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase">Access Level</p>
                    <p className="font-bold text-slate-700">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase">Authentication</p>
                    <Badge variant="outline" className="mt-1 text-green-600 border-green-200 bg-green-50 font-black text-[9px]">SECURE</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Attendance Section */}
          <Card className="border shadow-none rounded-[32px] bg-white overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Attendance
              </CardTitle>
              <CardDescription>Visual history of your session logs and rendered hours.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-slate-400 text-xs pl-8">Date</TableHead>
                    <TableHead className="font-bold text-slate-400 text-xs">Clock In</TableHead>
                    <TableHead className="font-bold text-slate-400 text-xs">Clock Out</TableHead>
                    <TableHead className="font-bold text-slate-400 text-xs">Duration</TableHead>
                    <TableHead className="font-bold text-slate-400 text-xs text-right pr-8">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-200" />
                      </TableCell>
                    </TableRow>
                  ) : attendanceData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-slate-400 font-medium italic">
                        No recent attendance records detected.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceData.map((row: any, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="pl-8 py-5">
                          <span className="font-bold text-slate-700">{row.dateLabel}</span>
                        </TableCell>
                        <TableCell className="py-5">
                          <span className="font-medium text-slate-600">{row.clockIn}</span>
                        </TableCell>
                        <TableCell className="py-5">
                          <span className="font-medium text-slate-600">{row.clockOut}</span>
                        </TableCell>
                        <TableCell className="py-5">
                          <span className="font-black text-slate-900">{row.duration}</span>
                        </TableCell>
                        <TableCell className="text-right pr-8 py-5">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "font-black text-[10px] uppercase px-3 py-1 border-none",
                              row.type === 'WFH' ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                            )}
                          >
                            {row.type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {isIntern && (
            <Card className="border shadow-none rounded-[32px] bg-white overflow-hidden">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Academic Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Source</Label>
                      <p className="text-lg font-bold text-slate-900 mt-1">{user.school || 'Unspecified'}</p>
                    </div>
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Focus</Label>
                      <p className="text-sm font-medium text-slate-600 mt-1">{user.course || 'Multimedia Production'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Program End Date</p>
                        <p className="text-sm font-bold text-slate-900">{user.expectedCompletionDate || 'Not Set'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tactical Metrics (Intern Only) */}
        {isIntern && (
          <div className="space-y-6">
            <Card className="border shadow-none rounded-[32px] bg-slate-900 text-white overflow-hidden">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center justify-between">
                  Mission Rank
                  <Zap className="w-4 h-4 text-primary animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Current XP</p>
                  <h2 className="text-5xl font-black">{user.xp || 0}</h2>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Rank: Junior Media Analyst</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span>Progress to Level 2</span>
                    <span className="text-primary">{Math.min(100, (user.xp || 0) / 10)}%</span>
                  </div>
                  <Progress value={Math.min(100, (user.xp || 0) / 10)} className="h-2 bg-slate-800" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border shadow-none rounded-[32px] bg-white text-center p-6">
                <Star className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase text-slate-400">Tactical Points</p>
                <p className="text-2xl font-black text-slate-900">{user.points || 0}</p>
              </Card>
              <Card className="border shadow-none rounded-[32px] bg-white text-center p-6">
                <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase text-slate-400">Merit Badges</p>
                <p className="text-2xl font-black text-slate-900">{user.badges?.length || 0}</p>
              </Card>
            </div>

            <Card className="border shadow-none rounded-[32px] bg-white p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Rendered Service
              </CardTitle>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Hours Registered</span>
                  <span className="text-xs font-black text-slate-900">140 / 300</span>
                </div>
                <Progress value={47} className="h-1.5" />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
