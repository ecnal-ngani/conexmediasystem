
'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Award,
  Search,
  Download,
  UserPlus,
  Trophy,
  Zap,
  Wallet,
  Loader2,
  Clock,
  ArrowRight,
  Filter
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
import { collection, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'deadline'>('priority');
  const firestore = useFirestore();
  const router = useRouter();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('systemId', 'asc'));
  }, [firestore]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: staff, loading: sLoading } = useCollection<any>(usersQuery);
  const { data: projects, loading: pLoading } = useCollection<any>(projectsQuery);

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    return staff.filter(emp => 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.systemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staff, searchQuery]);

  const creativeStats = useMemo(() => {
    if (!projects) return { rushCount: 0, activeCount: 0, avgProgress: 0 };
    
    const active = projects.filter((p: any) => p.status !== 'Approved');
    const rush = active.filter((p: any) => p.priority === 'RUSH');
    const totalProgress = active.reduce((acc: number, p: any) => acc + (p.progress || 0), 0);
    
    return {
      rushCount: rush.length,
      activeCount: active.length,
      avgProgress: active.length > 0 ? Math.round(totalProgress / active.length) : 0
    };
  }, [projects]);

  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    const active = projects.filter((p: any) => p.status !== 'Approved');
    
    if (sortBy === 'priority') {
      return [...active].sort((a, b) => {
        if (a.priority === 'RUSH' && b.priority !== 'RUSH') return -1;
        if (a.priority !== 'RUSH' && b.priority === 'RUSH') return 1;
        return 0;
      });
    } else {
      return [...active].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    }
  }, [projects, sortBy]);

  // ADMIN-ONLY DASHBOARD VIEW
  if (user?.role === 'ADMIN') {
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Admin Personnel Dashboard</h1>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by name, ID, or role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 shadow-sm focus-visible:ring-primary w-full"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-11 border-primary/20 text-primary hover:bg-primary/5 font-bold">
              <Download className="w-4 h-4 mr-2" />
              Export Personnel
            </Button>
            <Button onClick={() => router.push('/dashboard/admin')} className="w-full sm:w-auto h-11 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-red-100 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Manage Personnel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Total Staff', value: staff?.length || 0, icon: Users, color: 'text-slate-900' },
            { label: 'Active Personnel', value: staff?.filter((s: any) => s.status !== 'Offline').length || 0, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Personnel XP', value: (staff?.reduce((acc: number, s: any) => acc + (s.xp || 0), 0) || 0).toLocaleString(), icon: Trophy, color: 'text-primary' },
            { label: 'Monthly Payroll', value: '₱533K', icon: Wallet, color: 'text-slate-900' },
          ].map((kpi, i) => (
            <Card key={i} className="border shadow-none rounded-xl bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</span>
                  <kpi.icon className={`w-4 h-4 ${kpi.color} opacity-40`} />
                </div>
                <h3 className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 pl-6 whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Name</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Role</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap text-center">XP Level</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell>
                  </TableRow>
                ) : filteredStaff.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors border-0">
                    <TableCell className="py-4 pl-6 font-mono text-[10px] font-bold text-slate-500 whitespace-nowrap">{emp.systemId}</TableCell>
                    <TableCell className="py-4 font-bold text-slate-900 whitespace-nowrap">{emp.name}</TableCell>
                    <TableCell className="py-4 text-xs text-slate-500 whitespace-nowrap">{emp.role.replace('_', ' ')}</TableCell>
                    <TableCell className="py-4 text-center whitespace-nowrap">
                      <Badge className={cn(
                        "text-[9px] font-bold px-2 py-0.5 border-none",
                        emp.status === 'Office' ? "bg-green-50 text-green-600" :
                        emp.status === 'WFH' ? "bg-orange-50 text-orange-600" :
                        "bg-slate-50 text-slate-400"
                      )}>
                        {emp.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-center font-bold text-primary text-xs whitespace-nowrap">{(emp.xp || 0).toLocaleString()}</TableCell>
                    <TableCell className="py-4 text-xs font-medium text-slate-700 whitespace-nowrap">{emp.salary || '₱0'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  // CREATIVE DASHBOARD VIEW (EMPLOYEE / EDITOR)
  return (
    <div className="space-y-6 md:space-y-8 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Creative Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rush Items Hero */}
        <Card className="lg:col-span-2 border-2 border-primary/20 bg-white shadow-sm overflow-hidden relative">
          <CardContent className="p-8 md:p-10 flex items-center gap-8">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl md:text-5xl font-black shadow-xl shadow-red-100 shrink-0">
              {creativeStats.rushCount}
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight">Rush Items</h2>
              <p className="text-slate-500 font-medium">Requires immediate attention • Due today</p>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap className="w-32 h-32 text-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="border border-slate-100 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900">{creativeStats.activeCount}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Active Tasks</p>
                </div>
                <Briefcase className="w-8 h-8 text-slate-100" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-100 shadow-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-green-600">{creativeStats.avgProgress}%</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Progress</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Queue Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-slate-800">Task Queue</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Sort by:</span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setSortBy('priority')}
                className={cn("px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all", sortBy === 'priority' ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
              >
                Priority
              </button>
              <button 
                onClick={() => setSortBy('deadline')}
                className={cn("px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all", sortBy === 'deadline' ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
              >
                Deadline
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {pLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : sortedProjects.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-slate-50/50">
              <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No Active Tasks in Matrix</p>
            </div>
          ) : sortedProjects.map((project: any) => (
            <Card 
              key={project.id} 
              className={cn(
                "border-2 transition-all hover:shadow-md cursor-pointer",
                project.priority === 'RUSH' ? "border-primary/20" : "border-slate-100"
              )}
              onClick={() => router.push('/dashboard/production')}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge className={cn(
                        "text-[9px] font-black px-1.5 py-0.5 border-none",
                        project.priority === 'RUSH' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      )}>
                        [{project.priority}]
                      </Badge>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.type}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-slate-900 tracking-tight">{project.contentIdea || 'Untitled Production'} - {project.brand}</h4>
                      <p className="text-xs text-slate-500 font-medium">Client: {project.brand}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Progress</span>
                        <span className={cn(
                          project.progress >= 80 ? "text-green-600" :
                          project.progress >= 40 ? "text-orange-500" :
                          "text-primary"
                        )}>{project.progress || 0}%</span>
                      </div>
                      <Progress 
                        value={project.progress || 0} 
                        className="h-1.5 bg-slate-100" 
                        indicatorClassName={cn(
                          project.priority === 'RUSH' ? "bg-primary" :
                          project.progress >= 80 ? "bg-green-500" :
                          "bg-orange-500"
                        )}
                      />
                    </div>
                  </div>

                  <div className="md:w-32 flex flex-col justify-between items-end shrink-0">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</p>
                      <p className="text-lg font-black text-slate-900">{project.dueDate || 'TBA'}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400 group-hover:text-primary p-0 h-auto">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

