'use client';

import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Activity,
  Zap,
  ShieldCheck,
  Trophy,
  Loader2,
  ChevronRight,
  Star,
  Camera,
  Scissors,
  Lightbulb,
  Clock,
  HardDrive,
  BookOpen,
  Award,
  Target,
  Rocket,
  Circle
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AttendanceHeader } from '@/components/attendance-header';

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Tactical Data Queries - Global access for command overview
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'projects'));
  }, [firestore, user]);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'tasks'));
  }, [firestore, user]);

  const verificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'verifications'), orderBy('timestamp', 'desc'));
  }, [firestore, user]);

  const { data: staff, isLoading: sLoading } = useCollection<any>(usersQuery);
  const { data: projects, isLoading: pLoading } = useCollection<any>(projectsQuery);
  const { data: tasks, isLoading: tLoading } = useCollection<any>(tasksQuery);
  const { data: verifications } = useCollection<any>(verificationsQuery);

  // Global project metrics
  const deliveredProjectsCount = useMemo(() => {
    return projects?.filter(p => p.status === 'Approved' || p.status === 'Done').length || 0;
  }, [projects]);

  // Gamified Performance Calculation Logic (Global for Admin, Personal for Others)
  const performanceMatrix = useMemo(() => {
    if (!user || !projects || !tasks) return [];

    const isAdmin = user.role === 'ADMIN';

    const calculateStats = (targetProjects: any[], targetTasks: any[]) => {
      const allItems = [...targetProjects, ...targetTasks];
      const completedItems = allItems.filter(i => i.status === 'Approved' || i.status === 'Done' || i.status === 'completed');

      // 1. SPEED (Volume relative to time)
      const speed = Math.min(100, (completedItems.length * 5) + 40);

      // 2. ACCURACY (Approved without Revisions)
      const revisions = targetProjects.filter(p => p.status === 'Client Revision').length;
      const accuracy = Math.max(0, 100 - (revisions * 15));

      // 3. IMPACT (Total output volume)
      const impact = Math.min(100, (allItems.length * 3) + 30);

      // 4. VOLUME (Raw completed count)
      const volume = Math.min(100, completedItems.length * 8);

      // 5. RELIABILITY (Baseline stability)
      const reliability = 85; 

      return { speed, accuracy, impact, volume, reliability };
    };

    let seriesA;
    let seriesB;
    let labelA = "Your Stats";
    let labelB = "Squad Average";

    if (isAdmin) {
      // Admin sees Company Overall vs Tactical Target
      seriesA = calculateStats(projects, tasks);
      seriesB = { speed: 80, accuracy: 90, impact: 75, volume: 70, reliability: 95 }; // Fixed tactical target
      labelA = "Company Overall";
      labelB = "Tactical Target";
    } else {
      // Others see Personal vs Company Average
      const userProjects = projects.filter(p => p.artist === user.name);
      const userTasks = tasks.filter(t => t.assignedToId === user.id);
      seriesA = calculateStats(userProjects, userTasks);
      seriesB = calculateStats(projects, tasks); // Squad average
    }

    return [
      { subject: 'Speed', A: seriesA.speed, B: seriesB.speed, fullMark: 100 },
      { subject: 'Accuracy', A: seriesA.accuracy, B: seriesB.accuracy, fullMark: 100 },
      { subject: 'Impact', A: seriesA.impact, B: seriesB.impact, fullMark: 100 },
      { subject: 'Volume', A: seriesA.volume, B: seriesB.volume, fullMark: 100 },
      { subject: 'Reliability', A: seriesA.reliability, B: seriesB.reliability, fullMark: 100 },
      { labelA, labelB } // Meta info for legend
    ];
  }, [user, projects, tasks]);

  const roleConfig = useMemo(() => {
    const role = user?.role || 'EDITOR';
    const activeProjectsCount = projects?.filter(p => p.status !== 'Approved' && p.status !== 'Done').length || 0;
    const staffOnlineCount = staff?.filter(s => s.status !== 'Offline').length || 0;
    const totalStaff = staff?.length || 0;
    const userTasks = tasks?.filter(t => t.assignedToId === user?.id) || [];
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;

    switch (role) {
      case 'ADMIN':
        return {
          title: 'Global Command Center',
          subtitle: "Company-wide operational overview.",
          stats: [
            { label: 'Active Projects', value: activeProjectsCount, sub: 'In production pipeline', icon: Briefcase, color: 'text-red-500', bg: 'bg-red-50', subColor: 'text-slate-400' },
            { label: 'Personnel Online', value: staffOnlineCount, sub: `of ${totalStaff} total staff`, icon: Users, color: 'text-green-600', bg: 'bg-green-50', subColor: 'text-slate-400' },
            { label: 'Projects Delivered', value: deliveredProjectsCount, sub: 'Lifetime approved assets', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50', subColor: 'text-green-600' },
            { label: 'Command Accuracy', value: `${performanceMatrix[1]?.A || 0}%`, sub: 'No revision rate', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50', subColor: 'text-orange-600' },
          ]
        };
      case 'INTERN':
        return {
          title: 'Multimedia Intern Dashboard',
          subtitle: "Mission control and gamified performance tracking.",
          stats: [
            { label: 'Hours Required', value: '300', sub: 'Standard Program', icon: Clock, color: 'text-red-500', bg: 'bg-red-50', subColor: 'text-slate-400' },
            { label: 'Hours Rendered', value: '140', sub: '47% of target', icon: TrendingUp, color: 'text-primary', bg: 'bg-red-50', subColor: 'text-primary' },
            { label: 'Tasks Completed', value: completedTasks, sub: 'Assigned mission objectives', icon: Award, color: 'text-orange-500', bg: 'bg-orange-50', subColor: 'text-orange-600' },
            { label: 'Current XP', value: (user as any)?.xp || 120, sub: 'Rank: Specialist', icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50', subColor: 'text-blue-600' },
          ]
        };
      default:
        return {
          title: 'Post-Production Suite',
          subtitle: "Mastering creative assets and render cycles.",
          stats: [
            { label: 'My Active Edits', value: projects?.filter(p => p.artist === user?.name && p.status !== 'Approved').length || 0, sub: 'Assigned to you', icon: Scissors, color: 'text-primary', bg: 'bg-red-50', subColor: 'text-primary' },
            { label: 'Render Efficiency', value: '91%', sub: 'Average speed', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', subColor: 'text-orange-600' },
            { label: 'Approved Assets', value: projects?.filter(p => p.artist === user?.name && p.status === 'Approved').length || 0, sub: 'Your delivery count', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', subColor: 'text-green-600' },
            { label: 'Revision Rate', value: '8%', sub: 'Target: <15%', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', subColor: 'text-blue-600' },
          ]
        };
    }
  }, [user, staff, projects, tasks, performanceMatrix, deliveredProjectsCount]);

  const onlineCount = useMemo(() => staff?.filter((s: any) => s.status !== 'Offline').length || 0, [staff]);
  const totalCount = useMemo(() => staff?.length || 0, [staff]);

  if (!isMounted || !user) return null;

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700 pb-12">
      {/* 0. ATTENDANCE & STATUS HEADER */}
      <AttendanceHeader user={user} verifications={verifications || []} />

      {/* 1. TACTICAL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {roleConfig.stats.map((stat, i) => (
          <Card key={i} className="border-2 shadow-none rounded-2xl bg-white group hover:border-primary transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-xl transition-transform group-hover:rotate-6", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <Badge variant="outline" className="text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity">LIVE FEED</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                  <span className={cn("text-[10px] font-bold", stat.subColor)}>{stat.sub}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. PRIMARY INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CENTER: PERFORMANCE RADAR */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-2 shadow-sm rounded-3xl bg-white overflow-hidden h-full">
            <CardHeader className="border-b bg-slate-50/50 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Performance Matrix
                </CardTitle>
                <Badge variant="secondary" className="text-[9px] font-bold">ALPHA-v2</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[500px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceMatrix.slice(0, 5)}>
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name={performanceMatrix[5]?.labelA || "Subject"}
                      dataKey="A"
                      stroke="#EB3C47"
                      strokeWidth={4}
                      fill="#EB3C47"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name={performanceMatrix[5]?.labelB || "Average"}
                      dataKey="B"
                      stroke="#0f172a"
                      strokeWidth={2}
                      fill="#0f172a"
                      fillOpacity={0.05}
                      strokeDasharray="4 4"
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 800 }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center" 
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '40px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: SQUAD INTEL */}
        <div className="lg:col-span-4 space-y-8">
          {/* SQUAD RANKING */}
          <Card className="border-2 shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="bg-primary/5 border-b p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-orange-500" />
                  Squad Ranking
                </CardTitle>
                <div className="p-1 bg-white rounded-lg shadow-sm border text-[8px] font-black text-primary">TOP 10</div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[320px]">
                <div className="divide-y divide-slate-50">
                  {!staff || staff.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-400">No data available.</div>
                  ) : (
                    staff
                      .sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))
                      .slice(0, 10)
                      .map((emp: any, index: number) => (
                        <div key={emp.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all group">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-xs font-black w-4 text-center",
                              index === 0 ? "text-orange-500" : "text-slate-300"
                            )}>
                              {index + 1}
                            </span>
                            <Avatar className="w-9 h-9 rounded-xl border-2 border-white shadow-sm">
                              <AvatarImage src={emp.avatarUrl} />
                              <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-bold">
                                {emp.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-900 truncate max-w-[100px]">{emp.name}</span>
                              <span className="text-[8px] uppercase font-black text-slate-400 tracking-tighter">LVL {emp.level || 1}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-primary">{emp.xp || 0} XP</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* LIVE PRESENCE */}
          <Card className="border-2 shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Presence
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-slate-500">{onlineCount} LIVE</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[320px]">
                <div className="divide-y divide-slate-50 px-2">
                  {sLoading ? (
                    <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></div>
                  ) : (
                    staff.map((emp: any) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 group">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-8 h-8 rounded-lg">
                              <AvatarImage src={emp.avatarUrl} />
                              <AvatarFallback className="text-[10px] font-bold">{emp.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
                              emp.status !== 'Offline' ? "bg-green-500" : "bg-slate-200"
                            )} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-900">{emp.name}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{emp.role.split('_')[0]}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[7px] font-black px-1.5 py-0 h-4 border-0",
                          emp.status === 'Office' ? "bg-green-50 text-green-600" :
                          emp.status === 'WFH' ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-400"
                        )}>
                          {emp.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
