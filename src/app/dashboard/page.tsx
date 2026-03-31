'use client';

import { useAuth } from '@/components/auth-context';
import { Card, CardContent } from '@/components/ui/card';
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
  CheckCircle2,
  Clock,
  HardDrive,
  BookOpen,
  Award
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const performanceData = [
  { subject: 'Jan', A: 82, B: 45, fullMark: 100 },
  { subject: 'Feb', A: 85, B: 52, fullMark: 100 },
  { subject: 'Mar', A: 88, B: 58, fullMark: 100 },
  { subject: 'Apr', A: 91, B: 64, fullMark: 100 },
  { subject: 'May', A: 94, B: 71, fullMark: 100 },
  { subject: 'Jun', A: 92, B: 68, fullMark: 100 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Gated queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'projects'));
  }, [firestore, user]);

  const { data: staff, loading: sLoading } = useCollection<any>(usersQuery);
  const { data: projects } = useCollection<any>(projectsQuery);

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
      case 'BRAND_MANAGER':
        return {
          title: 'Brand Strategy Hub',
          subtitle: "Manage client portfolios and campaign health.",
          stats: [
            { label: 'Active Campaigns', value: activeProjectsCount, sub: 'Strategic oversight', icon: Lightbulb, color: 'text-purple-500', bg: 'bg-purple-50', subColor: 'text-purple-600' },
            { label: 'Client Health', value: '92%', sub: 'Avg Sentiment', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50', subColor: 'text-yellow-600' },
            { label: 'Retention Rate', value: '98%', sub: '+2% annual', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', subColor: 'text-green-600' },
            { label: 'Revenue Growth', value: '14%', sub: 'Target: 15%', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', subColor: 'text-blue-600' },
          ]
        };
      case 'VIDEOGRAPHER':
        return {
          title: 'Field Operations Command',
          subtitle: "Gear status and upcoming shoot readiness.",
          stats: [
            { label: 'Upcoming Shoots', value: '12', sub: 'Next 7 days', icon: Camera, color: 'text-red-500', bg: 'bg-red-50', subColor: 'text-red-600' },
            { label: 'Equipment Ready', value: '94%', sub: 'Check-in pending', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', subColor: 'text-orange-600' },
            { label: 'Raw Footage (GB)', value: '840', sub: 'Internal NAS', icon: HardDrive, color: 'text-blue-600', bg: 'bg-blue-50', subColor: 'text-blue-600' },
            { label: 'Team Sync', value: staffOnlineCount, sub: 'Members on-site', icon: Users, color: 'text-green-600', bg: 'bg-green-50', subColor: 'text-green-600' },
          ]
        };
      case 'EDITOR':
        return {
          title: 'Post-Production Suite',
          subtitle: "Mastering creative assets and render cycles.",
          stats: [
            { label: 'Pending Edits', value: activeProjectsCount, sub: 'Rush priority: 4', icon: Scissors, color: 'text-primary', bg: 'bg-red-50', subColor: 'text-primary' },
            { label: 'Render Efficiency', value: '91%', sub: 'Average speed', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50', subColor: 'text-orange-600' },
            { label: 'Approved Assets', value: '142', sub: 'Lifetime count', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', subColor: 'text-green-600' },
            { label: 'Revision Rate', value: '8%', sub: 'Industry standard: 15%', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', subColor: 'text-blue-600' },
          ]
        };
      case 'INTERN':
        return {
          title: 'Multimedia Intern Dashboard',
          subtitle: "Skill development and operational assistance.",
          stats: [
            { label: 'Hours Required', value: '300', sub: 'Standard Program', icon: Clock, color: 'text-red-500', bg: 'bg-red-50', subColor: 'text-slate-400' },
            { label: 'Hours Rendered', value: '140', sub: '47% of target', icon: TrendingUp, color: 'text-primary', bg: 'bg-red-50', subColor: 'text-primary' },
            { label: 'Tasks Completed', value: '28', sub: 'Across 12 brands', icon: Award, color: 'text-orange-500', bg: 'bg-orange-50', subColor: 'text-orange-600' },
            { label: 'Current XP', value: '245', sub: 'Junior Level', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', subColor: 'text-blue-600' },
          ]
        };
      default:
        return {
          title: 'Secure Command Node',
          subtitle: "Authenticated network access.",
          stats: []
        };
    }
  }, [user, staff, projects]);

  if (!isMounted || !user) return null;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-2 px-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{roleConfig.title}</h1>
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>

      <Card className="border shadow-sm rounded-none bg-orange-50/30 overflow-hidden">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back, {user?.name || 'Authorized User'}</h2>
          <p className="text-sm text-slate-500 font-medium">{roleConfig.subtitle}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Metrics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleConfig.stats.map((stat, i) => (
            <Card key={i} className="border shadow-none rounded-none bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className={cn("p-2.5 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
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
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission Performance Trend</h3>
          <Card className="border shadow-none rounded-none bg-white p-6">
            <div className="h-[400px] w-full mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
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
                    name="Efficiency %"
                    dataKey="A"
                    stroke="#E11D48"
                    strokeWidth={2}
                    fill="#E11D48"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Active Load"
                    dataKey="B"
                    stroke="#0f172a"
                    strokeWidth={2}
                    fill="#0f172a"
                    fillOpacity={0.3}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center" 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '30px', fontSize: '12px', fontWeight: 600 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Active Personnel ({staff?.filter(e => e.status !== 'Offline').length || 0}/{staff?.length || 0} Online)
            </h3>
          </div>
          <Card className="border shadow-none rounded-none bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {sLoading ? (
                  <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></div>
                ) : (
                  staff?.map((emp, i) => (
                    <div key={emp.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 rounded-full border-2 border-white shadow-sm">
                          <AvatarImage src={emp.avatarUrl} />
                          <AvatarFallback className="bg-primary text-white text-[10px] font-bold">
                            {emp.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{emp.name}</span>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-tighter">{emp.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          emp.status === 'Office' ? "bg-green-500" : 
                          emp.status === 'WFH' ? "bg-orange-500" : "bg-slate-300"
                        )} />
                        <span className="text-[10px] font-bold text-slate-400">{emp.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
