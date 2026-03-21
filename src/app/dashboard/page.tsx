'use client';

import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Shield,
  Flashlight
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EMPLOYEES } from '@/lib/mock-data';

const performanceData = [
  { name: 'Jan', efficiency: 82, projects: 45 },
  { name: 'Feb', efficiency: 85, projects: 52 },
  { name: 'Mar', efficiency: 88, projects: 58 },
  { name: 'Apr', efficiency: 91, projects: 64 },
  { name: 'May', efficiency: 94, projects: 71 },
  { name: 'Jun', efficiency: 92, projects: 68 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'));
  }, [firestore]);

  const { data: staff, loading: sLoading } = useCollection<any>(usersQuery);
  const { data: projects, loading: pLoading } = useCollection<any>(projectsQuery);

  const stats = useMemo(() => {
    const activeProjectsCount = projects?.filter(p => p.status !== 'Approved').length || 12;
    const staffOnlineCount = staff?.filter(s => s.status !== 'Offline').length || 28;
    const totalStaff = staff?.length || 32;

    return [
      { 
        label: 'Active Projects', 
        value: activeProjectsCount, 
        sub: '+3 this week', 
        icon: Briefcase, 
        color: 'text-red-500', 
        bg: 'bg-red-50',
        subColor: 'text-green-600'
      },
      { 
        label: 'Staff Online', 
        value: `${staffOnlineCount}`, 
        sub: `of ${totalStaff} total`, 
        icon: Users, 
        color: 'text-green-600', 
        bg: 'bg-green-50',
        subColor: 'text-slate-400'
      },
      { 
        label: 'Projects Delivered', 
        value: '47', 
        sub: 'this month', 
        icon: Activity, 
        color: 'text-blue-500', 
        bg: 'bg-blue-50',
        subColor: 'text-green-600'
      },
      { 
        label: 'Client Satisfaction', 
        value: '96%', 
        sub: '+4% vs last month', 
        icon: Trophy, 
        color: 'text-orange-500', 
        bg: 'bg-orange-50',
        subColor: 'text-green-600'
      },
    ];
  }, [staff, projects]);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      {/* Page Header */}
      <div className="flex items-center gap-2 px-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Global Command Center</h1>
        <ChevronRight className="w-4 h-4 text-primary" />
      </div>

      {/* Welcome Hero */}
      <Card className="border shadow-sm rounded-none bg-orange-50/30 overflow-hidden">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back, {user?.name || 'Authorized User'}</h2>
          <p className="text-sm text-slate-500 font-medium">Here&apos;s what&apos;s happening with your agency today.</p>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company Pulse</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
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
        {/* Main Chart Section */}
        <div className="xl:col-span-3 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company Performance</h3>
          <Card className="border shadow-none rounded-none bg-white p-6">
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center" 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '30px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    name="Efficiency %" 
                    stroke="#E11D48" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#E11D48', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projects" 
                    name="Projects" 
                    stroke="#0f172a" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Employee Status Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Employee Status ({EMPLOYEES.filter(e => e.status !== 'Offline').length}/{EMPLOYEES.length} Online)
            </h3>
          </div>
          <Card className="border shadow-none rounded-none bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {EMPLOYEES.map((emp, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-8 h-8 rounded-full">
                          <AvatarFallback className={cn(
                            "text-[10px] font-bold text-white",
                            i % 2 === 0 ? "bg-red-500" : "bg-slate-900"
                          )}>
                            {emp.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{emp.name}</span>
                        {emp.icon === '⭐' && <Star className="w-3 h-3 text-orange-400 fill-orange-400" />}
                        {emp.icon === '🛡️' && <ShieldCheck className="w-3 h-3 text-green-600" />}
                        {emp.icon === '⚡' && <Zap className="w-3 h-3 text-red-500 fill-red-500" />}
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
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
