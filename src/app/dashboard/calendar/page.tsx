
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
  AlertCircle
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

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const firestore = useFirestore();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Real-time schedules
  const schedulesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('date', 'asc'));
  }, [firestore]);
  const { data: schedules, loading: schedulesLoading } = useCollection<any>(schedulesQuery);

  // Real-time projects (Production Matrix)
  const projectsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy('dueDate', 'asc'));
  }, [firestore]);
  const { data: projects, loading: projectsLoading } = useCollection<any>(projectsQuery);

  // Real-time tasks
  const tasksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'), orderBy('dueDate', 'asc'));
  }, [firestore]);
  const { data: tasks, loading: tasksLoading } = useCollection<any>(tasksQuery);

  const nextMonth = () => setViewDate(prev => addMonths(prev, 1));
  const prevMonth = () => setViewDate(prev => subMonths(prev, 1));

  const renderCalendarDays = () => {
    if (!mounted) return null;

    const days = [];
    const daysCount = getDaysInMonth(viewDate);
    const startDayOffset = getDay(startOfMonth(viewDate));
    
    // Fill leading empty cells
    for (let i = 0; i < startDayOffset; i++) {
      days.push(
        <div key={`blank-${i}`} className="aspect-square bg-slate-50/50 rounded-lg border border-transparent" />
      );
    }
    
    // Fill actual days
    for (let i = 1; i <= daysCount; i++) {
      const year = viewDate.getFullYear();
      const month = (viewDate.getMonth() + 1).toString().padStart(2, '0');
      const day = i.toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Filter schedules
      const daySchedules = schedules?.filter(s => s.date === dateStr) || [];
      
      // Filter production projects
      const dayProjects = projects?.filter(p => p.dueDate === dateStr) || [];

      // Filter tasks
      const dayTasks = tasks?.filter(t => t.dueDate === dateStr) || [];

      const isToday = isTodayFn(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

      days.push(
        <div 
          key={i} 
          className={cn(
            "aspect-square p-2 bg-white border rounded-lg flex flex-col items-center justify-between transition-all group hover:border-primary/50 relative overflow-hidden",
            isToday ? "border-primary border-2 shadow-md" : "border-slate-100 shadow-sm"
          )}
        >
          <span className={cn(
            "text-xs font-semibold",
            isToday ? "text-primary font-black" : "text-slate-500"
          )}>{i}</span>
          
          <div className="w-full space-y-1 overflow-y-auto mt-1 flex-1">
            {/* Render Schedules */}
            {daySchedules.map((event, idx) => (
              <button 
                key={`sched-${idx}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent({ ...event, source: 'schedule' });
                }}
                className={cn(
                  "transition-colors text-white text-[10px] font-bold py-1 px-2 rounded-md truncate w-full text-left block shadow-sm border",
                  event.priority === 'URGENT' ? "bg-red-600 border-red-400 hover:bg-red-700" :
                  event.priority === 'HIGH' ? "bg-orange-50 border-orange-300 hover:bg-orange-600" :
                  "bg-primary border-primary-foreground/10 hover:bg-primary/90"
                )}
                title={event.title}
              >
                {event.title}
              </button>
            ))}

            {/* Render Production Projects */}
            {dayProjects.map((project, idx) => (
              <button 
                key={`prod-${idx}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent({ ...project, source: 'production' });
                }}
                className="bg-blue-600 hover:bg-blue-700 transition-colors text-white text-[10px] font-bold py-1 px-2 rounded-md truncate w-full text-left block shadow-sm border border-blue-400"
                title={`PROD: ${project.brand}`}
              >
                PROD: {project.brand}
              </button>
            ))}

            {/* Render Tasks */}
            {dayTasks.map((task, idx) => (
              <button 
                key={`task-${idx}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent({ ...task, source: 'task' });
                }}
                className={cn(
                  "text-white text-[10px] font-bold py-1 px-2 rounded-md truncate w-full text-left block shadow-sm border",
                  task.priority === 'URGENT' ? "bg-red-600 border-red-400 hover:bg-red-700" :
                  task.priority === 'HIGH' ? "bg-orange-50 border-orange-300 hover:bg-orange-600" :
                  "bg-blue-500 border-blue-300 hover:bg-blue-600"
                )}
                title={`TASK: ${task.title}`}
              >
                TASK: {task.title}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  // Logic to merge prioritized schedules into "Pending Tasks"
  const prioritizedSchedules = schedules?.filter(s => s.priority === 'URGENT' || s.priority === 'HIGH' || s.priority === 'NORMAL') || [];
  
  const urgentTasksCount = (tasks?.filter(t => t.priority === 'URGENT').length || 0) + (prioritizedSchedules.filter(s => s.priority === 'URGENT').length);
  const highTasksCount = (tasks?.filter(t => t.priority === 'HIGH').length || 0) + (prioritizedSchedules.filter(s => s.priority === 'HIGH').length);
  const normalTasksCount = (tasks?.filter(t => t.priority === 'NORMAL').length || 0) + (prioritizedSchedules.filter(s => s.priority === 'NORMAL').length);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Operations Calendar</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Calendar Grid */}
        <Card className="xl:col-span-3 border-none shadow-none bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between bg-white border rounded-t-xl py-4 px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-bold">
                {mounted ? format(viewDate, 'MMMM yyyy') : 'Loading...'}
              </CardTitle>
              {(schedulesLoading || projectsLoading || tasksLoading) && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="bg-white border-x border-b rounded-b-xl p-6 shadow-sm">
            <div className="grid grid-cols-7 gap-4 text-center mb-6">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <span key={day} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{day}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-4">
              {renderCalendarDays()}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks Sidebar */}
        <Card className="border shadow-none rounded-xl bg-white overflow-hidden flex flex-col h-fit">
          <CardHeader className="border-b bg-slate-50/30">
            <CardTitle className="text-base font-bold text-slate-800">Command-Wide Pending Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {/* Priority Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-center">
                <p className="text-xl font-bold text-red-600">{urgentTasksCount}</p>
                <p className="text-[9px] font-medium text-red-400 uppercase tracking-wider">Urgent</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-center">
                <p className="text-xl font-bold text-orange-600">{highTasksCount}</p>
                <p className="text-[9px] font-medium text-orange-400 uppercase tracking-wider">High</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                <p className="text-xl font-bold text-blue-600">{normalTasksCount}</p>
                <p className="text-[9px] font-medium text-blue-400 uppercase tracking-wider">Normal</p>
              </div>
            </div>

            {/* Task & Prioritized Schedule List */}
            <div className="space-y-3">
              {tasksLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (tasks?.length === 0 && prioritizedSchedules.length === 0) ? (
                <p className="text-xs text-center text-slate-400 py-8">No pending operations found.</p>
              ) : (
                <div className="space-y-3">
                  {/* Real Tasks */}
                  {tasks?.map((task: any) => (
                    <div key={task.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-primary/20 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors leading-snug max-w-[70%]">{task.title}</h4>
                        <Badge className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded",
                          task.priority === 'URGENT' ? "bg-red-50 text-red-500 border-red-100" :
                          task.priority === 'HIGH' ? "bg-orange-50 text-orange-500 border-orange-100" :
                          "bg-blue-50 text-blue-500 border-blue-100"
                        )} variant="outline">
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] text-slate-400 font-medium">{task.category}</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Prioritized Schedules displayed as tasks */}
                  {prioritizedSchedules.map((schedule: any) => (
                    <div key={schedule.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-primary/20 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3 h-3 text-primary" />
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors leading-snug truncate max-w-[120px]">{schedule.title}</h4>
                        </div>
                        <Badge className={cn(
                          "text-[8px] font-black px-1.5 py-0.5 rounded",
                          schedule.priority === 'URGENT' ? "bg-red-50 text-red-500 border-red-100" :
                          schedule.priority === 'HIGH' ? "bg-orange-50 text-orange-500 border-orange-100" :
                          "bg-blue-50 text-blue-500 border-blue-100"
                        )} variant="outline">
                          {schedule.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Operation: {schedule.type}</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{schedule.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 font-bold h-11 rounded-xl shadow-lg shadow-red-100 mt-2 text-white">
              Synchronize Matrix
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-[500px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          {!selectedEvent ? null : (
            <div className="p-6 md:p-8 space-y-6">
              <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg",
                  selectedEvent?.source === 'production' ? "bg-blue-600 shadow-blue-100" : 
                  selectedEvent?.source === 'task' ? "bg-green-600 shadow-green-100" :
                  selectedEvent?.priority === 'URGENT' ? "bg-red-600 shadow-red-100" :
                  selectedEvent?.priority === 'HIGH' ? "bg-orange-600 shadow-orange-100" :
                  "bg-primary shadow-red-100"
                )}>
                  {selectedEvent?.source === 'production' ? <Layers className="w-6 h-6 text-white" /> : 
                  selectedEvent?.source === 'task' ? <CheckCircle2 className="w-6 h-6 text-white" /> :
                  <CalendarIcon className="w-6 h-6 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight truncate">
                    {selectedEvent?.source === 'production' ? `Project: ${selectedEvent?.brand}` : 
                    selectedEvent?.source === 'task' ? `Task: ${selectedEvent?.title}` :
                    selectedEvent?.title}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 font-medium uppercase text-[10px] tracking-widest">
                    {selectedEvent?.source === 'production' ? 'Production Asset' : 
                    selectedEvent?.source === 'task' ? 'Internal Task' :
                    selectedEvent?.type} Briefing
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {selectedEvent?.source === 'task' ? (
                  // Task Details
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</p>
                        <Badge className={cn(
                          "text-[10px] font-black px-2 py-1 rounded",
                          selectedEvent.priority === 'URGENT' ? "bg-red-50 text-red-500 border-red-100" :
                          selectedEvent.priority === 'HIGH' ? "bg-orange-50 text-orange-500 border-orange-100" :
                          "bg-blue-50 text-blue-500 border-blue-100"
                        )} variant="outline">
                          {selectedEvent.priority}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <CalendarIcon className="w-4 h-4 text-slate-400" />
                          {selectedEvent?.dueDate}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</p>
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        {selectedEvent?.category}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                      <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100">
                        {selectedEvent?.status?.toUpperCase() || 'PENDING'}
                      </Badge>
                    </div>
                  </div>
                ) : selectedEvent?.source === 'production' ? (
                  // Production Project Details
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">File Code</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold font-mono text-sm">
                          <FileText className="w-4 h-4 text-blue-600" />
                          {selectedEvent?.fileCode}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <CalendarIcon className="w-4 h-4 text-blue-600" />
                          {selectedEvent?.dueDate}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Platform</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          {selectedEvent?.platform}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Artist</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Users className="w-4 h-4 text-blue-600" />
                          {selectedEvent?.artist}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Idea</p>
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-slate-600 leading-relaxed italic">
                        {selectedEvent?.contentIdea}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Schedule Details
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operation Priority</p>
                        <Badge className={cn(
                          "text-[10px] font-black px-2 py-1 rounded",
                          selectedEvent.priority === 'URGENT' ? "bg-red-50 text-red-500 border-red-100" :
                          selectedEvent.priority === 'HIGH' ? "bg-orange-50 text-orange-500 border-orange-100" :
                          "bg-blue-50 text-blue-500 border-blue-100"
                        )} variant="outline">
                          {selectedEvent.priority || 'NORMAL'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <CalendarIcon className="w-4 h-4 text-primary" />
                          {selectedEvent?.date}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client / Project</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Briefcase className="w-4 h-4 text-primary" />
                          {selectedEvent?.client}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <AlertCircle className="w-4 h-4 text-primary" />
                          {selectedEvent?.type}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Call Time</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Clock className="w-4 h-4 text-primary" />
                          {selectedEvent?.callTime}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wrap Time</p>
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Clock className="w-4 h-4 text-primary" />
                          {selectedEvent?.wrapTime}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</p>
                      <div className="flex items-center gap-2 text-slate-700 font-bold">
                        <MapPin className="w-4 h-4 text-primary" />
                        {selectedEvent?.location || 'Not specified'}
                      </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Staff</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent?.staff?.length > 0 ? (
                          selectedEvent.staff.map((member: string) => (
                            <Badge key={member} variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 py-1 px-3">
                              <Users className="w-3 h-3 mr-1.5 opacity-50" />
                              {member}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No staff assigned</span>
                        )}
                      </div>
                    </div>

                    {selectedEvent?.notes && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</p>
                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 leading-relaxed italic">
                          <FileText className="w-3 h-3 text-primary inline mr-2" />
                          {selectedEvent.notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <DialogClose asChild>
                  <Button className={cn(
                    "w-full h-12 font-bold rounded-xl shadow-lg text-white",
                    selectedEvent?.source === 'production' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : 
                    selectedEvent?.source === 'task' ? "bg-green-600 hover:bg-green-700 shadow-green-100" :
                    selectedEvent?.priority === 'URGENT' ? "bg-red-600 hover:bg-red-700 shadow-red-100" :
                    selectedEvent?.priority === 'HIGH' ? "bg-orange-600 hover:bg-orange-700 shadow-orange-100" :
                    "bg-primary hover:bg-primary/90 shadow-red-100"
                  )}>
                    Close Briefing
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
