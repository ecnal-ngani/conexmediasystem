'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function CalendarPage() {
  const [currentDay] = useState(new Date().getDate());
  const firestore = useFirestore();

  // Real-time schedules
  const schedulesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('date', 'asc'));
  }, [firestore]);
  const { data: schedules, loading: schedulesLoading } = useCollection<any>(schedulesQuery);

  // Real-time tasks
  const tasksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'), orderBy('dueDate', 'asc'));
  }, [firestore]);
  const { data: tasks, loading: tasksLoading } = useCollection<any>(tasksQuery);

  const daysInMonth = 28; // Hardcoded for Feb 2025 as per design
  const startDayOffset = 6; // Feb 1, 2025 is a Saturday

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < startDayOffset; i++) {
      days.push(
        <div key={`blank-${i}`} className="aspect-square bg-slate-50/50 rounded-lg border border-transparent" />
      );
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      // Find events for this day using timezone-safe string comparison
      const dayEvents = schedules?.filter(s => {
        if (!s.date) return false;
        // Date format from input is YYYY-MM-DD
        const parts = s.date.split('-');
        if (parts.length !== 3) return false;
        
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        
        // Filter for February (month 2) 2025
        return day === i && month === 2 && year === 2025;
      }) || [];
      
      const isToday = i === currentDay;

      days.push(
        <div 
          key={i} 
          className={cn(
            "aspect-square p-2 bg-white border rounded-lg flex flex-col items-center justify-between transition-all group hover:border-primary/50 relative overflow-hidden",
            isToday ? "border-primary border-2 shadow-md" : "border-slate-100 shadow-sm"
          )}
        >
          <span className={cn(
            "text-xs font-medium",
            isToday ? "text-primary font-bold" : "text-slate-400"
          )}>{i}</span>
          
          <div className="w-full space-y-1 overflow-hidden mt-1">
            {dayEvents.map((event, idx) => (
              <div 
                key={idx} 
                className="bg-primary text-white text-[8px] font-bold py-1 px-1.5 rounded truncate w-full text-center"
                title={event.title}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const urgentTasksCount = tasks?.filter(t => t.priority === 'URGENT').length || 0;
  const highTasksCount = tasks?.filter(t => t.priority === 'HIGH').length || 0;
  const normalTasksCount = tasks?.filter(t => t.priority === 'NORMAL').length || 0;

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
              <CardTitle className="text-lg font-bold">February 2025</CardTitle>
              {schedulesLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="text-slate-400"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="text-slate-400"><ChevronRight className="w-4 h-4" /></Button>
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
            <CardTitle className="text-base font-bold text-slate-800">Company-Wide Pending Tasks</CardTitle>
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

            {/* Task List */}
            <div className="space-y-3">
              {tasksLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : tasks?.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-8">No pending tasks found.</p>
              ) : tasks?.map((task: any) => (
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
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 font-bold h-11 rounded-xl shadow-lg shadow-red-100 mt-2">
              View All Company Tasks
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
