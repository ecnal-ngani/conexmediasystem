'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  category: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  dueDate: string;
}

interface CalendarEvent {
  day: number;
  title: string;
}

const TASKS: Task[] = [
  { id: '1', title: 'Approve Q1 Budget Report', category: 'Finance', priority: 'URGENT', dueDate: 'Feb 5, 2025' },
  { id: '2', title: 'Review Production Matrix', category: 'Operations', priority: 'HIGH', dueDate: 'Feb 6, 2025' },
  { id: '3', title: 'Client Meeting - Solarmaxx', category: 'Business Development', priority: 'NORMAL', dueDate: 'Feb 7, 2025' },
  { id: '4', title: 'Staff Performance Review', category: 'HR', priority: 'NORMAL', dueDate: 'Feb 10, 2025' },
  { id: '5', title: 'Equipment Procurement Approval', category: 'Production', priority: 'HIGH', dueDate: 'Feb 12, 2025' },
];

const EVENTS: CalendarEvent[] = [
  { day: 5, title: 'CJC Eco Bag - Shoot' },
  { day: 6, title: 'Shimmer & Shield' },
  { day: 7, title: 'Dentasmile - Client C...' },
  { day: 10, title: 'Solarmaxx - Deadline' },
  { day: 12, title: 'Team Meeting' },
  { day: 15, title: 'Client Presentation' },
];

export default function CalendarPage() {
  const [currentDay] = useState(4); // Today is Feb 4

  const daysInMonth = 28;
  const startDayOffset = 6; // Feb 1, 2025 is a Saturday

  const renderCalendarDays = () => {
    const days = [];
    // Blank days for start of month
    for (let i = 0; i < startDayOffset; i++) {
      days.push(
        <div key={`blank-${i}`} className="aspect-square bg-red-500 rounded-lg border border-transparent shadow-sm" />
      );
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayEvents = EVENTS.filter(e => e.day === i);
      const isToday = i === currentDay;

      days.push(
        <div 
          key={i} 
          className={cn(
            "aspect-square p-2 bg-white border rounded-lg flex flex-col items-center justify-between transition-all group hover:border-primary/50 relative",
            isToday ? "border-primary border-2 shadow-md" : "border-slate-100 shadow-sm"
          )}
        >
          <span className={cn(
            "text-xs font-medium",
            isToday ? "text-primary font-bold" : "text-slate-400"
          )}>{i}</span>
          
          <div className="w-full space-y-1 overflow-hidden">
            {dayEvents.map((event, idx) => (
              <div 
                key={idx} 
                className="bg-primary text-white text-[8px] font-bold py-1 px-1.5 rounded truncate w-full text-center"
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
                <p className="text-xl font-bold text-red-600">1</p>
                <p className="text-[9px] font-medium text-red-400 uppercase tracking-wider">Urgent</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-center">
                <p className="text-xl font-bold text-orange-600">2</p>
                <p className="text-[9px] font-medium text-orange-400 uppercase tracking-wider">High</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                <p className="text-xl font-bold text-blue-600">2</p>
                <p className="text-[9px] font-medium text-blue-400 uppercase tracking-wider">Normal</p>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {TASKS.map((task) => (
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
