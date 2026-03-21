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
  CheckCircle2, 
  Search,
  Zap,
  Loader2,
  ArrowRight,
  Clock,
  LayoutDashboard
} from 'lucide-react';
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

  // Specifically fetch active projects for the creative dashboard
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // We fetch all non-approved projects as the "active queue"
    return query(
      collection(firestore, 'projects'), 
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: projects, loading: pLoading } = useCollection<any>(projectsQuery);

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
    // Only show active items in the dashboard queue
    const active = projects.filter((p: any) => 
      p.status !== 'Approved' && 
      (p.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
       p.contentIdea?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    if (sortBy === 'priority') {
      return [...active].sort((a, b) => {
        if (a.priority === 'RUSH' && b.priority !== 'RUSH') return -1;
        if (a.priority !== 'RUSH' && b.priority === 'RUSH') return 1;
        return 0;
      });
    } else {
      return [...active].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    }
  }, [projects, searchQuery, sortBy]);

  return (
    <div className="space-y-6 md:space-y-10 max-w-[1600px] mx-auto pb-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 uppercase">Editor Command Console</h1>
          <p className="text-sm text-slate-500 font-medium">Monitoring active production cycles and critical deliverables.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
           <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold px-3 py-1">
             NODE: {user?.systemId || 'AUTH-00'}
           </Badge>
           <Badge className="bg-green-500 text-white border-none font-bold px-3 py-1">
             ONLINE
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Rush Items Hero */}
        <Card className="lg:col-span-3 border-none bg-primary shadow-2xl shadow-red-200 rounded-[2rem] overflow-hidden relative group">
          <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white flex items-center justify-center text-primary text-5xl md:text-6xl font-black shadow-2xl shrink-0 group-hover:scale-110 transition-transform duration-500">
              {creativeStats.rushCount}
            </div>
            <div className="space-y-3 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Immediate Action Required</h2>
              <p className="text-white/80 font-medium text-lg max-w-md">There are {creativeStats.rushCount} RUSH items in the production matrix that require immediate deployment today.</p>
              <Button onClick={() => router.push('/dashboard/production')} className="bg-white text-primary hover:bg-white/90 font-black px-8 h-12 rounded-xl mt-2">
                Deploy Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap className="w-64 h-64 text-white" />
          </div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-none shadow-lg shadow-slate-100 rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-8 flex flex-col justify-between h-full">
              <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-slate-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black text-slate-900">{creativeStats.activeCount}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Active Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg shadow-slate-100 rounded-3xl bg-white overflow-hidden">
            <CardContent className="p-8 flex flex-col justify-between h-full">
              <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black text-green-600">{creativeStats.avgProgress}%</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Progress</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Queue Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Active Production Queue</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search queue..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white border-slate-200 shadow-sm rounded-xl focus-visible:ring-primary"
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button 
                onClick={() => setSortBy('priority')}
                className={cn("flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all", sortBy === 'priority' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900")}
              >
                Sort: Priority
              </button>
              <button 
                onClick={() => setSortBy('deadline')}
                className={cn("flex-1 sm:flex-none px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all", sortBy === 'deadline' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-900")}
              >
                Sort: Deadline
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pLoading ? (
            <div className="col-span-full flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
          ) : sortedProjects.length === 0 ? (
            <div className="col-span-full text-center py-32 border-4 border-dashed rounded-[3rem] bg-slate-50/50">
              <CheckCircle2 className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-slate-300 uppercase italic">Command Queue Clear</h3>
              <p className="text-slate-400 font-medium">All assigned assets have been successfully deployed.</p>
            </div>
          ) : sortedProjects.map((project: any) => (
            <Card 
              key={project.id} 
              className={cn(
                "border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden transition-all hover:-translate-y-2 cursor-pointer bg-white group",
                project.priority === 'RUSH' ? "ring-2 ring-primary/20" : ""
              )}
              onClick={() => router.push('/dashboard/production')}
            >
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className={cn(
                      "text-[9px] font-black px-2.5 py-1 border-none rounded-lg",
                      project.priority === 'RUSH' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {project.priority}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {project.dueDate || 'TBA'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-900 tracking-tighter leading-none group-hover:text-primary transition-colors line-clamp-1">
                      {project.brand}
                    </h4>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-tight line-clamp-1">{project.contentIdea || 'Untitled Asset'}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Operational Progress</span>
                      <span className={cn(
                        project.progress >= 80 ? "text-green-600" :
                        project.progress >= 40 ? "text-orange-500" :
                        "text-primary"
                      )}>{project.progress || 0}%</span>
                    </div>
                    <Progress 
                      value={project.progress || 0} 
                      className="h-2.5 bg-slate-100 rounded-full" 
                      indicatorClassName={cn(
                        project.priority === 'RUSH' ? "bg-primary" :
                        project.progress >= 80 ? "bg-green-500" :
                        "bg-orange-500"
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {project.artist?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.artist || 'Unassigned'}</span>
                    </div>
                    <span className="text-[9px] font-black text-white bg-slate-900 px-2 py-1 rounded uppercase tracking-tighter">
                      {project.type}
                    </span>
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
