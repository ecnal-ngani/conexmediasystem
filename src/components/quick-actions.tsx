
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
  AlertCircle,
  Lightbulb,
  Share2,
  Layers,
  Link as LinkIcon
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
    description: 'Create a production item',
    icon: Layers,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    action: 'project'
  },
  {
    title: 'Schedule Event',
    description: 'Add shoot or meeting',
    icon: Calendar,
    color: 'text-primary',
    bg: 'bg-red-50',
    action: 'schedule'
  },
  {
    title: 'Internal Task',
    description: 'Assign company task',
    icon: ListTodo,
    color: 'text-green-600',
    bg: 'bg-green-50',
    action: 'task'
  },
  {
    title: 'Admin Access',
    description: 'Staff management',
    icon: Users,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    href: '/dashboard/admin'
  }
];

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Rush Deadline',
    description: 'CJC Eco Bag project needs final review',
    time: '5m ago',
    type: 'rush',
    icon: ShieldAlert,
  },
  {
    id: '2',
    title: 'Project Approved',
    description: 'Shimmer & Shield reel is QA approved',
    time: '1h ago',
    type: 'approved',
    icon: CheckCircle2,
  }
];

const STAFF_LIST = [
  { name: 'Chloe Javier', role: 'Videographer' },
  { name: 'Clark Tadeo', role: 'Brand Manager' },
  { name: 'Louise Dela Cruz', role: 'Graphic Designer' },
  { name: 'Matthew Valenzona', role: 'Production Director' },
  { name: 'Trish Jarque', role: 'Creative Director' },
];

export function QuickActions() {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  
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

  // Project Form State
  const [fileCode, setFileCode] = useState('');
  const [brand, setBrand] = useState('');
  const [contentIdea, setContentIdea] = useState('');
  const [projectStatus, setProjectStatus] = useState('In Production');
  const [projectPriority, setProjectPriority] = useState('REGULAR');
  const [artist, setArtist] = useState('');
  const [type, setType] = useState('Video');
  const [platform, setPlatform] = useState('Instagram');
  const [projectDueDate, setProjectDueDate] = useState('');
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleConfirmSchedule = () => {
    if (!firestore || !date || !client) return;
    const ref = collection(firestore, 'schedules');
    const data = { title: `${eventType}: ${client}`, type: eventType, priority: schedulePriority, client, date, callTime, wrapTime, location, staff: selectedStaff, notes, createdAt: serverTimestamp() };
    addDoc(ref, data).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data }));
    });
    toast({ title: "Schedule Synchronized", description: `Added ${client} to the master calendar.` });
    setIsScheduleOpen(false);
    setClient(''); setDate('');
  };

  const handleCreateTask = () => {
    if (!firestore || !taskTitle || !taskDueDate) return;
    const ref = collection(firestore, 'tasks');
    const data = { title: taskTitle, category: taskCategory, priority: taskPriority, dueDate: taskDueDate, status: 'pending', createdAt: serverTimestamp() };
    addDoc(ref, data).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data }));
    });
    toast({ title: "Task Assigned", description: `"${taskTitle}" added to company list.` });
    setIsTaskOpen(false);
    setTaskTitle('');
  };

  const handleCreateProject = () => {
    if (!firestore || !fileCode || !brand) return;
    const ref = collection(firestore, 'projects');
    const data = { fileCode, brand, contentIdea, status: projectStatus, priority: projectPriority, artist, type, platform, dueDate: projectDueDate, createdAt: serverTimestamp() };
    addDoc(ref, data).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data }));
    });
    toast({ title: "Project Initialized", description: `${fileCode} added to Production Matrix.` });
    setIsProjectOpen(false);
    setFileCode(''); setBrand('');
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
        <Sheet>
          <SheetTrigger asChild>
            <button className="pointer-events-auto relative w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95 group">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-800 border-2 border-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">2</span>
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
                    <SheetDescription className="text-sm text-slate-500 font-medium">Internal command updates</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {NOTIFICATIONS.map((notif) => (
                  <div key={notif.id} className="p-5 rounded-2xl border-2 bg-slate-50/50 border-slate-100 group transition-all">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white bg-white shadow-sm">
                        <notif.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-tight">{notif.description}</p>
                        <span className="text-[10px] text-slate-400 font-medium pt-2 block">{notif.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={isActionsOpen} onOpenChange={setIsActionsOpen}>
          <DialogTrigger asChild>
            <button className="pointer-events-auto w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95">
              <Zap className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden border-none rounded-3xl">
            <div className="p-6 space-y-6">
              <DialogHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-red-200">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">Quick Actions</DialogTitle>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                {QUICK_ACTIONS.map((action, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setIsActionsOpen(false);
                      if (action.action === 'task') setIsTaskOpen(true);
                      else if (action.action === 'schedule') setIsScheduleOpen(true);
                      else if (action.action === 'project') setIsProjectOpen(true);
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
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* NEW PROJECT DIALOG */}
      <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
        <DialogContent className="max-w-[540px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6 md:p-8 space-y-6">
              <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Production Project</DialogTitle>
                  <DialogDescription className="text-slate-400 font-medium">Initialize a new creative asset in the matrix.</DialogDescription>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">File Code</Label>
                    <Input placeholder="VLM-..." value={fileCode} onChange={(e) => setFileCode(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Brand</Label>
                    <Input placeholder="Client Name..." value={brand} onChange={(e) => setBrand(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Content Idea</Label>
                  <Input placeholder="Short description..." value={contentIdea} onChange={(e) => setContentIdea(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Priority</Label>
                    <Select value={projectPriority} onValueChange={setProjectPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="REGULAR">REGULAR</SelectItem><SelectItem value="RUSH">RUSH</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Due Date</Label>
                    <Input type="date" value={projectDueDate} onChange={(e) => setProjectDueDate(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleCreateProject} className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl mt-4">Add to Matrix</Button>
              </div>
            </div>
          </ScrollArea>
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
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Internal Task</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">Deploy a deliverable to the internal team.</DialogDescription>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Task Title</Label>
                <Input placeholder="Deliverable name..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Priority</Label>
                  <Select value={taskPriority} onValueChange={(val: any) => setTaskPriority(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="URGENT">URGENT</SelectItem><SelectItem value="HIGH">HIGH</SelectItem><SelectItem value="NORMAL">NORMAL</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Due Date</Label>
                  <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleCreateTask} className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold rounded-xl mt-4">Deploy Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEW SCHEDULE DIALOG */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-[480px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6 md:p-8 space-y-6">
              <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-red-100">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Event Schedule</DialogTitle>
                  <DialogDescription className="text-slate-400 font-medium">Synchronize a new event with the calendar.</DialogDescription>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Event Type</Label>
                    <Select value={eventType} onValueChange={(val: any) => setEventType(val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Shoot">Shoot</SelectItem><SelectItem value="Meeting">Meeting</SelectItem><SelectItem value="Deadline">Deadline</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Priority</Label>
                    <Select value={schedulePriority} onValueChange={(val: any) => setSchedulePriority(val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="URGENT">URGENT</SelectItem><SelectItem value="HIGH">HIGH</SelectItem><SelectItem value="NORMAL">NORMAL</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Client / Project</Label>
                  <Input placeholder="Project Name..." value={client} onChange={(e) => setClient(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location</Label>
                    <Input placeholder="Location..." value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleConfirmSchedule} className="w-full h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl mt-4">Add to Calendar</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
