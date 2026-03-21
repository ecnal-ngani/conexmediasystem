
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  MapPin,
  Users,
  FileText,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  getDay, 
  getDaysInMonth,
  isToday as isTodayFn
} from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const schedulesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('date', 'asc'));
  }, [firestore]);
  const { data: schedules, loading: sLoading } = useCollection<any>(schedulesQuery);

  const projectsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy('dueDate', 'asc'));
  }, [firestore]);
  const { data: projects, loading: pLoading } = useCollection<any>(projectsQuery);

  const tasksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'), orderBy('dueDate', 'asc'));
  }, [firestore]);
  const { data: tasks, loading: tLoading } = useCollection<any>(tasksQuery);

  const nextMonth = () => setViewDate(prev => addMonths(prev, 1));
  const prevMonth = () => setViewDate(prev => subMonths(prev, 1));

  const matrixData = useMemo(() => {
    const activeProjects = projects?.filter(p => p.status !== 'Approved') || [];
    const activeTasks = tasks?.filter(t => t.status !== 'completed') || [];
    const urgent = (schedules?.filter(s => s.priority === 'URGENT').length || 0) + 
                   (activeTasks.filter(t => t.priority === 'URGENT').length) + 
                   (activeProjects.filter(p => p.priority === 'RUSH').length);
    const high = (schedules?.filter(s => s.priority === 'HIGH').length || 0) + 
                 (activeTasks.filter(t => t.priority === 'HIGH').length);
    const normal = (schedules?.filter(s => s.priority === 'NORMAL').length || 0) + 
                   (activeTasks.filter(t => t.priority === 'NORMAL').length) +
                   (activeProjects.filter(p => p.priority === 'REGULAR').length);
    
    return { urgent, high, normal, total: (schedules?.length || 0) + activeProjects.length + activeTasks.length };
  }, [schedules, projects, tasks]);

  const renderCalendarDays = () => {
    if (!mounted) return null;
    const days = [];
    const daysCount = getDaysInMonth(viewDate);
    const startOffset = getDay(startOfMonth(viewDate));
    
    for (let i = 0; i < startOffset; i++) days.push(<div key={`b-${i}`} className="aspect-square bg-slate-50/50 rounded-lg border border-transparent" />);
    
    for (let i = 1; i <= daysCount; i++) {
      const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const dayScheds = schedules?.filter(s => s.date === dateStr) || [];
      const dayProjs = projects?.filter(p => p.dueDate === dateStr) || [];
      const dayTasks = tasks?.filter(t => t.dueDate === dateStr) || [];
      const isToday = isTodayFn(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

      days.push(
        <div key={i} className={cn("aspect-square p-2 bg-white border rounded-lg flex flex-col group relative overflow-hidden", isToday ? "border-primary border-2 shadow-sm" : "border-slate-100")}>
          <span className={cn("text-[10px] font-bold mb-1", isToday ? "text-primary" : "text-slate-400")}>{i}</span>
          <div className="w-full space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {dayScheds.map((s, idx) => (
              <button key={`s-${idx}`} onClick={() => setSelectedEvent({...s, source: 'schedule'})} className={cn("w-full text-left truncate text-[9px] font-bold py-0.5 px-1.5 rounded text-white", s.priority === 'URGENT' ? 'bg-red-600' : s.priority === 'HIGH' ? 'bg-orange-500' : 'bg-primary')}>{s.title}</button>
            ))}
            {dayProjs.map((p, idx) => (
              <button key={`p-${idx}`} onClick={() => setSelectedEvent({...p, source: 'production'})} className="w-full text-left truncate text-[9px] font-bold py-0.5 px-1.5 rounded bg-blue-600 text-white">PROD: {p.brand}</button>
            ))}
            {dayTasks.map((t, idx) => (
              <button key={`t-${idx}`} onClick={() => setSelectedEvent({...t, source: 'task'})} className={cn("w-full text-left truncate text-[9px] font-bold py-0.5 px-1.5 rounded text-white", t.priority === 'URGENT' ? 'bg-red-600' : 'bg-slate-700')}>TASK: {t.title}</button>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
      <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 px-1">Operations Command</h1>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <Card className="xl:col-span-3 border-none shadow-none bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between bg-white border rounded-t-xl py-4 px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-bold">{mounted ? format(viewDate, 'MMMM yyyy') : 'Loading...'}</CardTitle>
              {(sLoading || pLoading || tLoading) && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="bg-white border-x border-b rounded-b-xl p-6 shadow-sm">
            <div className="grid grid-cols-7 gap-4 text-center mb-6">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-4">{renderCalendarDays()}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-none rounded-xl bg-white overflow-hidden flex flex-col h-fit">
          <CardHeader className="border-b bg-slate-50/30"><CardTitle className="text-base font-bold text-slate-800">Command-Wide Matrix</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-6">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-red-50 p-2 rounded-lg text-center"><p className="text-xl font-bold text-red-600">{matrixData.urgent}</p><p className="text-[9px] font-medium text-red-400 uppercase">Urgent</p></div>
              <div className="bg-orange-50 p-2 rounded-lg text-center"><p className="text-xl font-bold text-orange-600">{matrixData.high}</p><p className="text-[9px] font-medium text-orange-400 uppercase">High</p></div>
              <div className="bg-blue-50 p-2 rounded-lg text-center"><p className="text-xl font-bold text-blue-600">{matrixData.normal}</p><p className="text-[9px] font-medium text-blue-400 uppercase">Normal</p></div>
            </div>
            <ScrollArea className="h-[450px] pr-2">
              <div className="space-y-3">
                {tasks?.map((task: any) => (
                  <div key={task.id} onClick={() => setSelectedEvent({...task, source: 'task'})} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-primary/20 cursor-pointer group">
                    <div className="flex justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-primary truncate max-w-[70%]">{task.title}</h4>
                      <Badge variant="outline" className={cn("text-[8px]", task.priority === 'URGENT' ? "text-red-600" : "text-blue-600")}>{task.priority}</Badge>
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-slate-400"><span>TASK</span><span>{task.dueDate}</span></div>
                  </div>
                ))}
                {projects?.filter(p => p.status !== 'Approved').map((p: any) => (
                  <div key={p.id} onClick={() => setSelectedEvent({...p, source: 'production'})} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 cursor-pointer group">
                    <div className="flex justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate max-w-[70%]">{p.brand}</h4>
                      <Badge variant="outline" className="text-[8px] text-blue-600">{p.priority}</Badge>
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-slate-400"><span>PRODUCTION</span><span>{p.dueDate}</span></div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={() => setIsSyncing(true)} disabled={isSyncing} className="w-full bg-primary font-bold h-11 rounded-xl shadow-lg shadow-red-100">
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Synchronize Matrix'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-[480px] p-8 rounded-3xl border-none shadow-2xl">
          {selectedEvent && (
            <div className="space-y-6">
              <DialogHeader className="flex flex-row items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", selectedEvent.source === 'production' ? 'bg-blue-600' : 'bg-primary')}>
                  {selectedEvent.source === 'production' ? <Layers className="w-6 h-6 text-white" /> : <CalendarIcon className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900">{selectedEvent.title || selectedEvent.brand}</DialogTitle>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedEvent.source} Briefing</p>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-1"><p className="text-[10px] uppercase font-black text-slate-400">Priority</p><Badge variant="outline" className="font-bold">{selectedEvent.priority || 'NORMAL'}</Badge></div>
                <div className="space-y-1"><p className="text-[10px] uppercase font-black text-slate-400">Date</p><p className="text-xs font-bold text-slate-700">{selectedEvent.date || selectedEvent.dueDate}</p></div>
                {selectedEvent.location && <div className="space-y-1 col-span-2"><p className="text-[10px] uppercase font-black text-slate-400">Location</p><p className="text-xs font-bold text-slate-700">{selectedEvent.location}</p></div>}
              </div>
              <Button onClick={() => setSelectedEvent(null)} className="w-full h-12 bg-primary font-bold rounded-xl mt-4">Close Briefing</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
