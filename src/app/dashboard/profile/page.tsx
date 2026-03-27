'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Award,
  Zap,
  Palette,
  Dumbbell,
  Edit2,
  Save,
  X,
  GraduationCap,
  BookOpen,
  History,
  Camera,
  Loader2,
  ShieldCheck,
  TrendingUp,
  Activity,
  Star
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isEditing, setIsEditing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [course, setCourse] = useState('');

  useEffect(() => {
    setIsMounted(true);
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setSchool(user.school || '');
      setCourse(user.course || '');
    }
  }, [user]);

  const personalAttendanceQuery = useMemoFirebase(() => {
    if (!firestore || !user?.id) return null;
    return query(
      collection(firestore, 'verifications'),
      where('userId', '==', user.id),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
  }, [firestore, user?.id]);

  const { data: attendance, loading: aLoading } = useCollection<any>(personalAttendanceQuery);

  if (!isMounted || !user) return null;

  const handleSave = () => {
    const isIntern = user.role === 'INTERN';
    const updates: any = { name, email };

    if (isIntern) {
      updates.school = school;
      updates.course = course;
    }

    updateUser(updates);
    setIsEditing(false);
    toast({
      title: "Identity Re-synchronized",
      description: "Profile metadata has been updated in the master registry.",
    });
  };

  const isIntern = user.role === 'INTERN';
  const xpProgress = ((user.xp || 0) % 1000) / 10; // Simple level calc
  const currentLevel = Math.floor((user.xp || 0) / 1000) + 1;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Personnel Identity</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Sector: {user.role}</p>
        </div>
        
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)} 
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 h-11 px-6 rounded-xl shadow-lg"
          >
            <Edit2 className="w-4 h-4" />
            Modify Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsEditing(false)} 
              variant="outline" 
              className="border-slate-200 text-slate-500 font-bold h-11 px-6 rounded-xl"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-primary hover:bg-primary/90 font-bold gap-2 h-11 px-6 rounded-xl shadow-lg shadow-red-100"
            >
              <Save className="w-4 h-4" />
              Commit Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Main Profile */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
            <div className="h-40 bg-gradient-to-r from-[#722F37] to-[#E11D48] relative">
              <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/pattern/800/400')] bg-cover mix-blend-overlay" />
              <div className="absolute top-4 right-6">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black text-[10px] tracking-widest px-3 py-1">
                  SECURITY LEVEL 4
                </Badge>
              </div>
            </div>
            <CardContent className="relative px-8 pb-10">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-8 -mt-16">
                <div className="relative group">
                  <Avatar className="w-32 h-32 md:w-40 md:h-40 border-[6px] border-white shadow-2xl text-3xl font-black shrink-0 transition-transform group-hover:scale-[1.02]">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-slate-900 text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-green-500 border-4 border-white flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <div className="text-center md:text-left space-y-2 pb-2 flex-1">
                  {isEditing ? (
                    <div className="space-y-2 max-w-md mx-auto md:mx-0">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Callsign</Label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="h-12 text-xl font-bold rounded-xl bg-slate-50 border-slate-200"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">{user.name}</h2>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] px-3 py-1">
                          {user.role.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-mono text-[10px] font-bold px-3 py-1">
                          {user.systemId}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase tracking-widest">
                          <Activity className="w-3 h-3" />
                          {user.status || 'Active'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 border-t border-slate-50 pt-10">
                <div className="flex items-start gap-5">
                  <div className="p-3.5 bg-red-50 rounded-2xl text-primary shadow-sm">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Corporate Node</p>
                    {isEditing ? (
                      <Input 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className="h-10 text-sm rounded-xl"
                      />
                    ) : (
                      <p className="text-sm font-bold text-slate-800 truncate">{user.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="p-3.5 bg-orange-50 rounded-2xl text-orange-500 shadow-sm">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Enlistment Date</p>
                    <p className="text-sm font-bold text-slate-800">January 15, 2024</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="p-3.5 bg-blue-50 rounded-2xl text-blue-600 shadow-sm">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Deployment Hub</p>
                    <p className="text-sm font-bold text-slate-800">Manila Command Center</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="p-3.5 bg-indigo-50 rounded-2xl text-indigo-600 shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Network Permissions</p>
                    <p className="text-sm font-bold text-slate-800">Authorized Personnel</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimized Attendance Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Operational Log</h3>
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-400">Last 10 Syncs</Badge>
            </div>
            <Card className="border-none shadow-lg rounded-2xl overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-400 py-4 pl-6">Synchronization</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-400 py-4">Protocol</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-400 py-4 text-center">Status</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-wider text-slate-400 py-4 pr-6 text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aLoading ? (
                    <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : !attendance || attendance.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">No sync records found</TableCell></TableRow>
                  ) : (
                    attendance.map((log) => (
                      <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 pl-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">
                              {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPP') : 'Recent'}
                            </span>
                            <span className="text-[9px] font-medium text-slate-400">
                              {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'p') : 'Just now'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            <Camera className="w-3.5 h-3.5 text-slate-400" />
                            Biometric
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Badge className="bg-green-500/10 text-green-600 border-none font-black text-[9px] uppercase tracking-tighter">Verified</Badge>
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6">
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-xs font-black text-slate-900">{(log.confidence * 100).toFixed(1)}%</span>
                            <div className="w-12 h-1 bg-slate-100 rounded-full mt-1">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${log.confidence * 100}%` }} />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>

        {/* RIGHT COLUMN: Stats & Academic */}
        <div className="space-y-8">
          {/* Operational Progress Card */}
          <Card className="border-none shadow-xl rounded-3xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Command Metrics</p>
                <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
              </div>
              <CardTitle className="text-2xl font-black">Level {currentLevel}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Experience Points (XP)</span>
                  <span className="text-white">{user.xp || 0} / {currentLevel * 1000}</span>
                </div>
                <Progress value={xpProgress} className="h-2.5 bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Points</span>
                  </div>
                  <p className="text-xl font-black">{user.points || 0}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Growth</span>
                  </div>
                  <p className="text-xl font-black">+12%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Records (Intern Only) */}
          {isIntern && (
            <Card className="border-none shadow-lg rounded-3xl bg-white overflow-hidden">
              <CardHeader className="py-5 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">Academic Hub</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" />
                      Institution
                    </p>
                    {isEditing ? (
                      <Input value={school} onChange={(e) => setSchool(e.target.value)} className="h-10 text-sm rounded-xl" />
                    ) : (
                      <p className="text-sm font-bold text-slate-900">{user.school || 'Unspecified University'}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Palette className="w-3 h-3" />
                      Specialization
                    </p>
                    {isEditing ? (
                      <Input value={course} onChange={(e) => setCourse(e.target.value)} className="h-10 text-sm rounded-xl" />
                    ) : (
                      <p className="text-sm font-bold text-slate-900">{user.course || 'Multimedia Arts'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Achievements */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Command Medals</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Strategic Lead', desc: 'Campaign Management', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Creative Vision', desc: 'Asset Excellence', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50' },
                { label: 'Performance Max', desc: 'Operational Speed', icon: Dumbbell, color: 'text-blue-500', bg: 'bg-blue-50' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 transition-all group">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300", item.bg)}>
                    <item.icon className={cn("w-6 h-6", item.color)} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 tracking-tight">{item.label}</p>
                    <p className="text-[10px] font-medium text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
