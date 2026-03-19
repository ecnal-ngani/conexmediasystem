
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  Zap, 
  Plus, 
  HelpCircle, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Briefcase, 
  MapPin, 
  Check, 
  FileText, 
  ListTodo, 
  AlertCircle 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const QUICK_ACTIONS = [
  {
    title: 'New Project',
    description: 'Create a new production item',
    icon: Plus,
    color: 'text-red-500',
    bg: 'bg-red-50',
    href: '/dashboard/production'
  },
  {
    title: 'Schedule Shoot',
    description: 'Add a new shoot to calendar',
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    href: '/dashboard/calendar'
  },
  {
    title: 'Internal Task',
    description: 'Assign a new company task',
    icon: ListTodo,
    color: 'text-green-600',
    bg: 'bg-green-50',
    action: 'task'
  },
  {
    title: 'Team Management',
    description: 'Manage staff and roles',
    icon: Users,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    href: '/dashboard/admin'
  }
];

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Rush Deadline Approaching',
    description: 'CJC Eco Bag project due in 2 hours - Final review needed',
    time: '5 minutes ago',
    type: 'rush',
    icon: ShieldAlert,
  },
  {
    id: '2',
    title: 'Project Approved',
    description: 'Shimmer & Shield tutorial reel has been approved by QA',
    time: '1 hour ago',
    type: 'approved',
    icon: CheckCircle2,
  },
  {
    id: '3',
    title: 'Client Revision Requested',
    description: 'Keto Lifestyle animation needs color adjustments',
    time: '3 hours ago',
    type: 'revision',
    icon: Clock,
  }
];

const STAFF_LIST = [
  { name: 'Chloe Javier', role: 'Videographer' },
  { name: 'Prince Balagtas', role: 'Videographer' },
  { name: 'Jhon Abad', role: 'Video Editor' },
  { name: 'Clark Tadeo', role: 'Brand Manager' },
  { name: 'Louise Dela Cruz', role: 'Graphic Designer' },
  { name: 'Matthew Valenzona', role: 'Production Director' },
];

export function QuickActions() {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  
  // Schedule Form State
  const [eventType, setEventType] = useState<'Shoot' | 'Meeting' | 'Deadline'>('Shoot');
  const [schedulePriority, setSchedulePriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [client, setClient] = useState('');
  const [date, setDate] = useState('');
  const [callTime, setCallTime] = useState('09:00');
  const [wrapTime, setWrapTime] = useState('17:00');
  const [location, setLocation] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Operations');
  const [taskPriority, setTaskPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [taskDueDate, setTaskDueDate] = useState('');
  
  const pathname = usePathname();
  const firestore = useFirestore();
  const { toast } = useToast();

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'rush': return 'bg-red-50 border-red-500';
      case 'approved': return 'bg-green-50 border-green-500';
      case 'revision': return 'bg-orange-50 border-orange-500';
      default: return 'bg-white border-slate-100';
    }
  };

  const getIconStyles = (type: string) => {
    switch (type) {
      case 'rush': return 'text-red-500 bg-white';
      case 'approved': return 'text-green-500 bg-white';
      case 'revision': return 'text-orange-500 bg-white';
      default: return 'text-blue-500 bg-white';
    }
  };

  const toggleStaff = (name: string) => {
    setSelectedStaff(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const handleConfirmSchedule = () => {
    if (!firestore || !date || !client) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide at least a date and client/project name."
      });
      return;
    }

    const schedulesRef = collection(firestore, 'schedules');
    const scheduleData = {
      title: `${eventType}: ${client}`,
      type: eventType,
      priority: schedulePriority,
      client,
      date,
      callTime,
      wrapTime,
      location,
      staff: selectedStaff,
      notes,
      createdAt: serverTimestamp()
    };

    addDoc(schedulesRef, scheduleData)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: schedulesRef.path,
          operation: 'create',
          requestResourceData: scheduleData
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: "Schedule Initiated",
      description: `New ${eventType} is being synchronized with the operations matrix.`
    });
    
    setIsScheduleOpen(false);
    setClient('');
    setDate('');
    setSelectedStaff([]);
    setNotes('');
    setSchedulePriority('NORMAL');
  };

  const handleCreateTask = () => {
    if (!firestore || !taskTitle || !taskDueDate) {
      toast({
        variant: "destructive",
        title: "Missing Details",
        description: "Task title and due date are required for compliance."
      });
      return;
    }

    const tasksRef = collection(firestore, 'tasks');
    const taskData = {
      title: taskTitle,
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDueDate,
      status: 'pending',
      createdAt: serverTimestamp()
    };

    addDoc(tasksRef, taskData)
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: tasksRef.path,
          operation: 'create',
          requestResourceData: taskData
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: "Task Assigned",
      description: `"${taskTitle}" has been added to the company-wide pending list.`
    });

    setIsTaskOpen(false);
    setTaskTitle('');
    setTaskDueDate('');
  };

  const isCalendarPage = pathname === '/dashboard/calendar';

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
        {/* Notifications Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="pointer-events-auto relative w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95 group">
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              <span className="absolute -top-1 -right-1 bg-red-800 border-2 border-white text-[9px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">3</span>
            </button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md p-0 border-none rounded-l-3xl overflow-hidden">
            <div className="flex flex-col h-full bg-white">
              <SheetHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-red-200">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <SheetTitle className="text-2xl font-bold tracking-tight">Notifications</SheetTitle>
                    <SheetDescription className="text-sm text-slate-500 font-medium">
                      3 unread notifications
                    </SheetDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-none font-bold text-xs hover:bg-blue-100">
                  Mark all as read
                </Button>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {NOTIFICATIONS.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all relative group",
                      getNotificationStyles(notif.type)
                    )}
                  >
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-100 shadow-sm",
                        getIconStyles(notif.type)
                      )}>
                        <notif.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 leading-none">{notif.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-tight pr-4">{notif.description}</p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[10px] text-slate-400 font-medium">{notif.time}</span>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 rounded-lg">
                            Mark as read
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick Actions Trigger */}
        <Dialog open={isActionsOpen} onOpenChange={setIsActionsOpen}>
          <DialogTrigger asChild>
            <button className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95">
              <Zap className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden border-none rounded-3xl">
            <div className="p-6 space-y-6">
              <DialogHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-red-200">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">Quick Actions</DialogTitle>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                {QUICK_ACTIONS.map((action, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setIsActionsOpen(false);
                      if (action.action === 'task') setIsTaskOpen(true);
                      else if (action.href) window.location.href = action.href;
                    }}
                    className="flex flex-col p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary/20 hover:shadow-md transition-all group text-left"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", action.bg)}>
                      <action.icon className={cn("w-5 h-5", action.color)} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{action.title}</h4>
                      <p className="text-[10px] font-medium text-slate-400 leading-tight">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <DialogClose asChild>
                  <Button className="bg-primary hover:bg-primary/90 font-bold px-8 h-11 rounded-xl shadow-lg shadow-red-100">Close</Button>
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* NEW TASK DIALOG */}
        <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
          <DialogContent className="max-w-[440px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
            <div className="p-6 md:p-8 space-y-6">
              <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-100">
                  <ListTodo className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Company Task</DialogTitle>
                  <DialogDescription className="text-slate-400 font-medium">Assign a new task to the internal matrix.</DialogDescription>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Task Title</Label>
                  <Input 
                    placeholder="e.g., Update Brand Guidelines" 
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-green-500" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Priority</Label>
                    <Select value={taskPriority} onValueChange={(val: any) => setTaskPriority(val)}>
                      <SelectTrigger className="h-12 border-slate-200 rounded-xl text-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="URGENT">URGENT</SelectItem>
                        <SelectItem value="HIGH">HIGH</SelectItem>
                        <SelectItem value="NORMAL">NORMAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Category</Label>
                    <Input 
                      placeholder="e.g., Operations" 
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value)}
                      className="h-12 border-slate-200 rounded-xl text-slate-600" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Due Date</Label>
                  <Input 
                    type="date" 
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-green-500" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleCreateTask} 
                  className="flex-1 h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 text-white"
                >
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {isCalendarPage && (
          <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
            <DialogTrigger asChild>
              <button className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95">
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[480px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
              <ScrollArea className="max-h-[90vh]">
                <div className="p-6 md:p-8 space-y-6">
                  <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-red-100">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Schedule</DialogTitle>
                      <DialogDescription className="text-slate-400 font-medium">Add a new event to your calendar.</DialogDescription>
                    </div>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Event Type</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Shoot', 'Meeting', 'Deadline'] as const).map((type) => (
                          <Button
                            key={type}
                            variant="outline"
                            onClick={() => setEventType(type)}
                            className={cn(
                              "h-11 font-bold transition-all border-slate-100 text-slate-600 rounded-xl",
                              eventType === type ? "border-primary text-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-slate-50"
                            )}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Priority Level</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['URGENT', 'HIGH', 'NORMAL'] as const).map((priority) => (
                          <Button
                            key={priority}
                            variant="outline"
                            onClick={() => setSchedulePriority(priority)}
                            className={cn(
                              "h-11 font-bold transition-all border-slate-100 text-slate-600 rounded-xl text-[10px]",
                              schedulePriority === priority 
                                ? priority === 'URGENT' ? "bg-red-50 border-red-500 text-red-600 ring-1 ring-red-500"
                                : priority === 'HIGH' ? "bg-orange-50 border-orange-500 text-orange-600 ring-1 ring-orange-500"
                                : "bg-blue-50 border-blue-500 text-blue-600 ring-1 ring-blue-500"
                                : "hover:bg-slate-50"
                            )}
                          >
                            {priority}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-primary" />
                        Client / Project
                      </Label>
                      <Input 
                        placeholder="Project Name..." 
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                        className="h-12 border-slate-200 rounded-xl text-slate-600" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-primary" />
                        Date
                      </Label>
                      <Input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <Clock className="w-3 h-3 text-primary" />
                          Call Time
                        </Label>
                        <Input 
                          type="time" 
                          value={callTime}
                          onChange={(e) => setCallTime(e.target.value)}
                          className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <Clock className="w-3 h-3 text-primary" />
                          Wrap Time
                        </Label>
                        <Input 
                          type="time" 
                          value={wrapTime}
                          onChange={(e) => setWrapTime(e.target.value)}
                          className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" />
                        Location
                      </Label>
                      <Input 
                        placeholder="Location details..." 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-12 border-slate-200 rounded-xl text-slate-600" 
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Users className="w-3 h-3 text-primary" />
                        Assign Staff ({selectedStaff.length} selected)
                      </Label>
                      <div className="border rounded-xl p-3 bg-slate-50/50 max-h-[220px] overflow-y-auto">
                        <div className="space-y-2">
                          {STAFF_LIST.map((staff) => (
                            <div 
                              key={staff.name}
                              onClick={() => toggleStaff(staff.name)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group",
                                selectedStaff.includes(staff.name) ? "bg-white border-primary/20 shadow-sm" : "bg-transparent border-transparent hover:bg-white"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0",
                                selectedStaff.includes(staff.name) ? "bg-primary border-primary" : "border-slate-300 bg-white"
                              )}>
                                {selectedStaff.includes(staff.name) && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold text-slate-900 truncate">{staff.name}</p>
                                <p className="text-[9px] text-slate-400 font-medium">{staff.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pb-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <FileText className="w-3 h-3 text-primary" />
                        Notes (Optional)
                      </Label>
                      <Textarea 
                        placeholder="Add any additional details..." 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[100px] border-slate-200 rounded-xl focus-visible:ring-primary resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <DialogClose asChild>
                      <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleConfirmSchedule} 
                      className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-red-100 text-white"
                    >
                      Confirm Schedule
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="fixed bottom-4 left-4 z-30">
        <button className="w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
