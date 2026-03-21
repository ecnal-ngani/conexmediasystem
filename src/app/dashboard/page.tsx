'use client';

import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Activity,
  Zap,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  // Fetch a snapshot of the matrix nodes with proper memoization
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(5));
  }, [firestore]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'), limit(5));
  }, [firestore]);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'), orderBy('createdAt', 'desc'), limit(5));
  }, [firestore]);

  const { data: staff, loading: sLoading } = useCollection<any>(usersQuery);
  const { data: projects, loading: pLoading } = useCollection<any>(projectsQuery);
  const { data: tasks, loading: tLoading } = useCollection<any>(tasksQuery);

  const stats = useMemo(() => {
    return [
      { label: 'Personnel', value: staff?.length || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Active Projects', value: projects?.filter(p => p.status !== 'Approved').length || 0, icon: Briefcase, color: 'text-primary', bg: 'bg-red-50' },
      { label: 'Pending Tasks', value: tasks?.filter(t => t.status !== 'completed').length || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'System Health', value: '100%', icon: ShieldAlert, color: 'text-green-600', bg: 'bg-green-50' },
    ];
  }, [staff, projects, tasks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Command Center</h1>
          <p className="text-sm text-slate-500 font-medium">Network Overview & Tactical Intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-4 font-bold border-slate-200 bg-white">
            NODE: {user?.systemId || 'AUTH-00'}
          </Badge>
          <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Active Sync
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-lg shadow-slate-100 rounded-3xl overflow-hidden bg-white hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <TrendingUp className="w-4 h-4 text-slate-200" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <Card className="xl:col-span-2 border-none shadow-lg shadow-slate-100 rounded-3xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4 px-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <CardTitle className="text-lg font-black uppercase tracking-tight">Recent Production Matrix</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/production')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-red-50">
              View Matrix
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : projects && projects.length > 0 ? (
                projects.map((project: any) => (
                  <div key={project.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {project.fileCode?.split('-')[0] || 'PR'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-tight">{project.brand}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{project.type} • {project.artist || 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <Badge className={cn(
                        "text-[8px] font-black px-2 py-0.5 border-none text-white",
                        project.priority === 'RUSH' ? "bg-red-600" : "bg-blue-600"
                      )}>
                        {project.priority}
                      </Badge>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{project.dueDate}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-slate-400 font-medium text-sm px-6">No recent production items found in the database.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg shadow-slate-100 rounded-3xl bg-white overflow-hidden flex flex-col h-full">
          <CardHeader className="bg-slate-900 text-white p-8">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-black uppercase tracking-tight">Rapid Response Queue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6 flex-1">
            <div className="space-y-4">
              {tLoading ? (
                <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-200" /></div>
              ) : tasks && tasks.length > 0 ? (
                tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary/20 transition-all cursor-pointer">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      task.priority === 'URGENT' ? "bg-red-500 animate-pulse" : "bg-blue-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{task.title}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.category}</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{task.dueDate}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400 uppercase">Queue Clear</p>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-8 pt-0 mt-auto">
            <Button onClick={() => router.push('/dashboard/calendar')} className="w-full bg-primary hover:bg-primary/90 font-black h-12 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-100 text-white">
              Operations Control
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
