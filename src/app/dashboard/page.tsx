
'use client';

import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Award,
  Edit3,
  ListTodo,
  Calendar,
  MoreVertical,
  CheckCircle,
  AlertCircle
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

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
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string>('');

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

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (user.role === 'INTERN') {
      return query(
        collection(firestore, 'tasks'), 
        where('assignedToId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
    }
    return query(collection(firestore, 'tasks'), limit(10));
  }, [firestore, user]);

  const { data: staff, loading: sLoading } = useCollection<any>(usersQuery);
  const { data: projects } = useCollection<any>(projectsQuery);
  const { data: tasks, loading: tLoading } = useCollection<any>(tasksQuery);

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
          subtitle: "Mission control and skill development tracking.",
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

  const handleOpenTaskUpdate = (task: any) => {
    setSelectedTask(task);
    setUpdatingStatus(task.status || 'pending');
    setIsUpdateSheetOpen(true);
  };

  const handleUpdateTaskStatus = async () => {
    if (!firestore || !selectedTask) return;

    const taskRef = doc(firestore, 'tasks', selectedTask.id);
    const updateData = {
      status: updatingStatus,
      updatedAt: serverTimestamp()
    };

    try {
      await updateDoc(taskRef, updateData);
      toast({
        title: "Mission Updated",
        description: `Task status synchronized as "${updatingStatus.toUpperCase()}".`
      });
      setIsUpdateSheetOpen(false);
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: taskRef.path,
        operation: 'update',
        requestResourceData: updateData
      }));
    }
  };

  if (!isMounted || !user) return null;

  const isIntern = user.role === 'INTERN';

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
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isIntern ? 'Active Mission Ledger' : 'Mission Performance Trend'}
          </h3>
          
          <Card className="border shadow-none rounded-none bg-white overflow-hidden">
            {isIntern ? (
              <CardContent className="p-0">
                <ScrollArea className="h-[450px]">
                  <div className="divide-y divide-slate-100">
                    {tLoading ? (
                      <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
                    ) : !tasks || tasks.length === 0 ? (
                      <div className="py-20 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                          <CheckCircle className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No missions currently assigned.</p>
                      </div>
                    ) : (
                      tasks.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                          <div className="flex gap-4 min-w-0">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                              task.status === 'completed' ? "bg-green-50 border-green-100 text-green-600" :
                              task.status === 'in-progress' ? "bg-blue-50 border-blue-100 text-blue-600" :
                              "bg-slate-50 border-slate-100 text-slate-400"
                            )}>
                              <ListTodo className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-primary transition-colors">{task.title}</h4>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-bold text-slate-400">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {task.dueDate}</span>
                                <span className="uppercase tracking-widest text-primary font-black">/ {task.category || 'Operations'}</span>
                                <Badge variant="outline" className={cn(
                                  "text-[8px] font-black uppercase px-2 h-4",
                                  task.priority === 'URGENT' ? "border-red-200 text-red-600 bg-red-50" : "border-slate-200 text-slate-500"
                                )}>
                                  {task.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase tracking-tighter px-2",
                              task.status === 'completed' ? "bg-green-600 text-white" :
                              task.status === 'in-progress' ? "bg-blue-600 text-white" :
                              "bg-slate-200 text-slate-600"
                            )}>
                              {task.status?.replace('-', ' ') || 'PENDING'}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-9 h-9 rounded-xl hover:bg-white hover:shadow-sm"
                              onClick={() => handleOpenTaskUpdate(task)}
                            >
                              <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            ) : (
              <CardContent className="p-6">
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
              </CardContent>
            )}
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

      {/* Slide-over Update Sheet */}
      <Sheet open={isUpdateSheetOpen} onOpenChange={setIsUpdateSheetOpen}>
        <SheetContent className="sm:max-w-md border-l-0 shadow-2xl rounded-l-3xl p-0 overflow-hidden">
          <div className="flex flex-col h-full bg-white">
            <SheetHeader className="p-8 border-b bg-slate-50/50">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-red-100">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">Mission Update</SheetTitle>
                  <SheetDescription className="font-medium text-slate-400">Synchronize directive status.</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8">
                {selectedTask && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mission Objective</Label>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="font-black text-slate-900">{selectedTask.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedTask.category || 'Standard'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operational Status</Label>
                      <Select value={updatingStatus} onValueChange={setUpdatingStatus}>
                        <SelectTrigger className="h-14 border-slate-200 rounded-2xl focus:ring-primary shadow-none">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="pending">PENDING</SelectItem>
                          <SelectItem value="in-progress">IN PROGRESS</SelectItem>
                          <SelectItem value="completed">COMPLETED</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          Updating status will instantly notify the assigning Brand Manager or Administrator.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                        <p className={cn("text-xs font-black", selectedTask.priority === 'URGENT' ? 'text-red-600' : 'text-slate-900')}>
                          {selectedTask.priority}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                        <p className="text-xs font-black text-slate-900">{selectedTask.dueDate}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            <div className="p-8 border-t bg-slate-50/30">
              <Button 
                onClick={handleUpdateTaskStatus}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-[0.98]"
              >
                SYNCHRONIZE STATUS
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsUpdateSheetOpen(false)}
                className="w-full mt-2 h-10 text-[10px] font-black uppercase tracking-widest text-slate-400"
              >
                Close Panel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
