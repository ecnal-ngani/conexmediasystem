
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

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Tactical Data Queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user || !user.id) return null;
    return query(collection(firestore, 'users'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !user.id) return null;
    return query(collection(firestore, 'projects'));
  }, [firestore, user]);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user || !user.id) return null;
    return query(collection(firestore, 'tasks'));
  }, [firestore, user]);

  const { data: staff, loading: sLoading } = useCollection<any>(usersQuery);
  const { data: projects } = useCollection<any>(projectsQuery);
  const { data: tasks } = useCollection<any>(tasksQuery);

  // Gamified Performance Calculation Logic
  const performanceMatrix = useMemo(() => {
    if (!user || !projects || !tasks) return [];

    const calculateStatsForUser = (targetUserId: string, targetUserName?: string) => {
      const userProjects = projects.filter(p => p.artist === (targetUserName || user.name));
      const userTasks = tasks.filter(t => t.assignedToId === targetUserId);
      const allItems = [...userProjects, ...userTasks];
      const completedItems = allItems.filter(i => i.status === 'Approved' || i.status === 'completed');

      // 1. SPEED (Completion time vs Due Date)
      const speed = Math.min(100, (completedItems.length * 15) + 30);

      // 2. ACCURACY (Approved without Revisions)
      const revisions = userProjects.filter(p => p.status === 'Client Revision').length;
      const accuracy = Math.max(0, 100 - (revisions * 20));

      // 3. IMPACT (Based on XP and activity)
      const impact = Math.min(100, (allItems.length * 5) + (completedItems.length * 5));

      // 4. VOLUME (Raw output)
      const volume = Math.min(100, allItems.length * 10);

      // 5. RELIABILITY (Meeting deadlines)
      const reliability = 90; // Default baseline for tactical personnel

      return { speed, accuracy, impact, volume, reliability };
    };

    const userStats = calculateStatsForUser(user.id);
    
    // Calculate Squad Average
    const squadStats = {
      speed: 65,
      accuracy: 78,
      impact: 55,
      volume: 45,
      reliability: 82
    };

    return [
      { subject: 'Speed', A: userStats.speed, B: squadStats.speed, fullMark: 100 },
      { subject: 'Accuracy', A: userStats.accuracy, B: squadStats.accuracy, fullMark: 100 },
      { subject: 'Impact', A: userStats.impact, B: squadStats.impact, fullMark: 100 },
      { subject: 'Volume', A: userStats.volume, B: squadStats.volume, fullMark: 100 },
      { subject: 'Reliability', A: userStats.reliability, B: squadStats.reliability, fullMark: 100 },
    ];
  }, [user, projects, tasks]);

  const roleConfig = useMemo(() => {
    const role = user?.role || 'EDITOR';
    const activeProjectsCount = projects?.filter(p => p.status !== 'Approved').length || 0;
    const staffOnlineCount = staff?.filter(s => s.status !== 'Offline').length || 0;
    const totalStaff = staff?.length || 0;

    switch (role) {
      case 'ADMIN':
        return {
          title: 'Global Command Center',
          subtitle: "Company-wide operational overview.",
          stats: [
            { label: 'Active Projects', value: activeProjectsCount, sub: '+3 this week', icon: Briefcase, color: 'text-red-500', bg: 'bg-red-50', subColor: 'text-green-600' },
            { label: 'Staff Online', value: staffOnlineCount, sub: `of ${totalStaff} total`, icon: Users, color: 'text-green-600', bg: 'bg-green-50', subColor: 'text-slate-400' },
            { label: 'Projects Delivered', value: '47', sub: 'this month', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', subColor: 'text-green-600' },
            { label: 'Client Satisfaction', value: '96%', sub: '+4% vs last month', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-50', subColor: 'text-green-600' },
          ]
        };
      case 'INTERN':
        return {
          title: 'Multimedia Intern Dashboard',
          subtitle: "Mission control and gamified performance tracking.",
          stats: [
            { label: 'Hours Required', value: '300', sub: 'Standard Program', icon: Clock, color: 'text-red-500', bg: 'bg-red-50', subColor: 'text-slate-400' },
            { label: 'Hours Rendered', value: '140', sub: '47% of target', icon: TrendingUp, color: 'text-primary', bg: 'bg-red-50', subColor: 'text-primary' },
            { label: 'Tasks Completed', value: tasks?.filter(t => t.assignedToId === user.id && t.status === 'completed').length || 0, sub: 'Across active brands', icon: Award, color: 'text-orange-500', bg: 'bg-orange-50', subColor: 'text-orange-600' },
            { label: 'Current XP', value: user.xp || 120, sub: 'Rank: Specialist', icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50', subColor: 'text-blue-600' },
          ]
        };
      default:
        return {
          title: 'Post-Production Suite',
          subtitle: "Mastering creative assets and render cycles.",
          stats: [
            { label: 'Pending Edits', value: activeProjectsCount, sub: 'Rush priority: 4', icon: Scissors, color: 'text-primary', bg: 'bg-red-50', subColor: 'text-primary' },
            { label: 'Render Efficiency', value: '91%', sub: 'Average speed', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', subColor: 'text-orange-600' },
            { label: 'Approved Assets', value: '142', sub: 'Lifetime count', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', subColor: 'text-green-600' },
            { label: 'Revision Rate', value: '8%', sub: 'Target: <15%', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', subColor: 'text-blue-600' },
          ]
        };
    }
  }, [user, staff, projects, tasks]);

  const onlineCount = useMemo(() => staff?.filter((s: any) => s.status !== 'Offline').length || 0, [staff]);
  const totalCount = useMemo(() => staff?.length || 0, [staff]);

  if (!isMounted || !user) return null;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex items-center gap-2 px-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{roleConfig.title}</h1>
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>

      <Card className="border shadow-sm rounded-none bg-orange-50/30 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back, {user?.name || 'Authorized User'}</h2>
              <p className="text-sm text-slate-500 font-medium">{roleConfig.subtitle}</p>
            </div>
            {/* Tactical Rank Node decommissioned per user request */}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operational Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleConfig.stats.map((stat, i) => (
            <Card key={i} className="border shadow-none rounded-none bg-white group hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className={cn("p-2.5 rounded-lg transition-transform group-hover:scale-110", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", stat.bg.replace('bg-', 'bg-opacity-50 bg-'))} style={{ width: '70%' }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                  <p className={cn("text-[10px] font-bold", stat.subColor)}>{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Multi-Player Performance Matrix
            </h3>
            <Badge variant="outline" className="text-[9px] font-black uppercase bg-primary/5 text-primary border-primary/20">
              Live Squad Comparison
            </Badge>
          </div>
          
          <Card className="border shadow-none rounded-none bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="h-[450px] w-full mt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceMatrix}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      axisLine={false}
                    />
                    <Radar
                      name="Your Stats"
                      dataKey="A"
                      stroke="#E11D48"
                      strokeWidth={3}
                      fill="#E11D48"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Network Average"
                      dataKey="B"
                      stroke="#0f172a"
                      strokeWidth={2}
                      fill="#0f172a"
                      fillOpacity={0.15}
                      strokeDasharray="4 4"
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center" 
                      iconType="diamond"
                      wrapperStyle={{ paddingTop: '30px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border shadow-none rounded-none bg-white overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-slate-50 border-b p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Live Presence
                </CardTitle>
                <div className="text-[10px] font-black bg-white border px-2 py-0.5 rounded-full text-primary flex items-center gap-1.5 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {onlineCount} / {totalCount} ONLINE
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-slate-50">
                {sLoading ? (
                  <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></div>
                ) : !staff || staff.length === 0 ? (
                  <div className="p-10 text-center text-xs text-slate-400">No personnel found.</div>
                ) : (
                  staff.map((emp: any) => (
                    <div key={emp.id} className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-all group border-l-2 border-transparent hover:border-primary">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 rounded-xl border-2 border-white shadow-sm ring-1 ring-slate-100">
                            <AvatarImage src={emp.avatarUrl} />
                            <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-bold">
                              {emp.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm",
                            emp.status !== 'Offline' ? "bg-green-500 animate-pulse" : "bg-slate-300"
                          )} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors">{emp.name}</span>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-tighter">{emp.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         <Badge variant="outline" className={cn(
                           "text-[8px] font-black uppercase px-1.5 py-0",
                           emp.status === 'Office' ? "text-green-600 bg-green-50 border-green-200" :
                           emp.status === 'WFH' ? "text-orange-600 bg-orange-50 border-orange-200" : "text-slate-400 bg-slate-50 border-slate-200"
                         )}>
                           {emp.status}
                         </Badge>
                         <span className="text-[8px] font-bold text-slate-300 font-mono tracking-tighter">
                           {emp.systemId}
                         </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-none rounded-none bg-slate-900 text-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Mission</p>
                <p className="text-xs font-bold truncate">{tasks?.filter(t => t.assignedToId === user.id && t.status !== 'completed')[0]?.title || 'Awaiting Orders'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] font-black uppercase">
                <span>Mission Progress</span>
                <span className="text-primary">65%</span>
              </div>
              <Progress value={65} className="h-1 bg-slate-800" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
