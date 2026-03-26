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
  Camera,
  Scissors,
  Lightbulb,
  CheckCircle2,
  Clock,
  HardDrive,
  BookOpen,
  Award,
  Calendar,
  User as UserIcon,
  Check,
  MoreHorizontal
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'));
  }, [firestore]);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (user.role === 'INTERN') {
      return query(
        collection(firestore, 'tasks'), 
        where('assignedToId', '==', user.id), 
        limit(10)
      );
    }
    return query(collection(firestore, 'tasks'), orderBy('createdAt', 'desc'), limit(10));
  }, [firestore, user]);

  const { data: staff, loading: sLoading } = useCollection<any>(usersQuery);
  const { data: projects, loading: pLoading } = useCollection<any>(projectsQuery);
  const { data: tasks, loading: tLoading } = useCollection<any>(tasksQuery);

  const handleCompleteTask = (taskId: string, title: string) => {
    if (!firestore) return;
    const taskRef = doc(firestore, 'tasks', taskId);
    const updateData = { 
      status: 'completed', 
      updatedAt: serverTimestamp() 
    };

    updateDoc(taskRef, updateData)
      .then(() => {
        toast({
          title: "Directive Completed",
          description: `"${title}" has been successfully synchronized as completed.`,
        });
      })
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: taskRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

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

  if (user?.role === 'INTERN') {
    return (
      <div className="space-y-8 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-700">
        <div className="flex items-center gap-2 px-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Multimedia Intern Dashboard</h1>
          <ChevronRight className="w-4 h-4 text-primary" />
        </div>

        <Card className="border shadow-none rounded-xl bg-white overflow-hidden">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="transparent"
                  className="text-slate-100"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="16"
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - 140/300)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-slate-900">140</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">of 300 hours</span>
                <span className="text-xl font-black text-primary mt-1">47%</span>
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Internship Progress</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">160 hours remaining</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleConfig.stats.map((stat, i) => (
            <Card key={i} className="border shadow-none rounded-xl bg-white hover:border-primary/20 transition-all group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className={cn("p-2.5 rounded-lg", stat.bg)}>
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                  <p className={cn("text-[10px] font-bold", stat.subColor)}>{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-1">Recent Assignments</h3>
          <Card className="border shadow-none rounded-xl bg-white overflow-hidden">
             <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 pl-6">Directive</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4">Hours</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4">Command Node</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4">Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : tasks?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                        No tactical directives assigned yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks?.map((t: any, idx: number) => (
                      <TableRow key={t.id || idx} className="border-slate-50 hover:bg-slate-50/30 transition-colors group">
                        <TableCell className="py-4 pl-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{t.title}</span>
                            <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{t.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-slate-500 text-sm font-medium">{t.hours || '0h'}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserIcon className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{t.assignedByName || 'System'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={cn(
                            "text-[9px] font-bold px-2 py-0.5 border-none",
                            t.status === 'completed' || t.status === 'Approved' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                          )}>
                            {t.status?.toUpperCase() || 'PENDING'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-slate-400 text-xs font-medium">
                          {t.createdAt?.toDate ? format(t.createdAt.toDate(), 'MMM d') : 'Recent'}
                        </TableCell>
                        <TableCell className="py-4 pr-6 text-right">
                          {t.status !== 'completed' ? (
                            <Button 
                              onClick={() => handleCompleteTask(t.id, t.title)}
                              size="sm" 
                              className="bg-primary hover:bg-primary/90 text-white font-bold h-8 px-3 rounded-lg shadow-lg shadow-red-100 group-hover:scale-105 transition-transform"
                            >
                              <Check className="w-3 h-3 mr-1.5" />
                              DONE
                            </Button>
                          ) : (
                            <div className="flex items-center justify-end text-green-600 gap-1.5 font-bold text-[10px] uppercase tracking-widest">
                              <CheckCircle2 className="w-4 h-4" />
                              Synchronized
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
             </Table>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border shadow-none rounded-xl bg-white p-6 hover:border-primary/20 transition-all cursor-pointer group">
            <h4 className="font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">Request Day Off</h4>
            <p className="text-xs text-slate-400 font-medium">Submit a leave request</p>
          </Card>
          <Card className="border shadow-none rounded-xl bg-white p-6 hover:border-primary/20 transition-all cursor-pointer group">
            <h4 className="font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">View Certificate Progress</h4>
            <p className="text-xs text-slate-400 font-medium">Check completion requirements</p>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internship Details</h3>
          <Card className="border shadow-none rounded-xl bg-white overflow-hidden">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">School</p>
                    <p className="text-sm font-bold text-slate-900">{user.school || 'University of Santo Tomas'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</p>
                    <p className="text-sm font-bold text-slate-900">{user.startDate || 'November 1, 2025'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course</p>
                    <p className="text-sm font-bold text-slate-900">{user.course || 'BS Multimedia Arts'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expected Completion</p>
                    <p className="text-sm font-bold text-slate-900">{user.expectedCompletionDate || 'March 15, 2026'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
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
                    name="Active Load" 
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Active Personnel ({EMPLOYEES.filter(e => e.status !== 'Offline').length}/{EMPLOYEES.length} Online)
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