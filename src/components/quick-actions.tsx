'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Zap, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  Check, 
  ListTodo, 
  Layers,
  Home,
  CheckCheck
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/auth-context';

const QUICK_ACTIONS = [
  {
    title: 'Dashboard',
    description: 'Home Overview',
    icon: Home,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    href: '/dashboard'
  },
  {
    title: 'New Project',
    description: 'Launch production item',
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
    title: 'Assign Task',
    description: 'Create internal directive',
    icon: ListTodo,
    color: 'text-green-600',
    bg: 'bg-green-50',
    action: 'task'
  },
  {
    title: 'Staff Management',
    description: 'Admin controls',
    icon: Users,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    href: '/dashboard/admin',
    adminOnly: true
  }
];

export function QuickActions() {
  const router = useRouter();
  const { user } = useAuth();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<number>(0);
  
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('conex_last_notif_read');
    if (stored) setLastReadTime(parseInt(stored));
  }, []);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'schedules'), orderBy('createdAt', 'desc'), limit(15));
  }, [firestore, user]);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'tasks'), orderBy('updatedAt', 'desc'), limit(15));
  }, [firestore, user]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'), limit(15));
  }, [firestore, user]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const { data: recentSchedules } = useCollection<any>(schedulesQuery);
  const { data: recentTasks } = useCollection<any>(tasksQuery);
  const { data: recentProjects } = useCollection<any>(projectsQuery);
  const { data: staffList } = useCollection<any>(usersQuery);

  const filteredActions = useMemo(() => {
    return QUICK_ACTIONS.filter(action => {
      if (action.adminOnly && user?.role !== 'ADMIN') return false;
      if (user?.role === 'INTERN') {
        if (action.action === 'project' || action.action === 'schedule' || action.action === 'task') {
          return false;
        }
      }
      return true;
    });
  }, [user]);

  const notifications = useMemo(() => {
    const items: any[] = [];
    if (!user || !isMounted) return items;

    const filteredTasks = recentTasks?.filter(t => 
      t.assignedToId === user.id || t.assignedById === user.id
    ) || [];

    recentSchedules?.forEach(s => items.push({
      id: `s-${s.id}`,
      title: 'Schedule Added',
      description: s.title,
      time: s.createdAt?.toDate ? formatDistanceToNow(s.createdAt.toDate(), { addSuffix: true }) : 'Just now',
      priority: s.priority || 'NORMAL',
      icon: Calendar,
      rawTime: s.updatedAt?.seconds || s.createdAt?.seconds || Math.floor(Date.now() / 1000),
      type: 'SCHEDULE'
    }));

    filteredTasks.forEach(t => items.push({
      id: `t-${t.id}`,
      title: t.status === 'completed' ? 'Task Completed' : 'New Task Assigned',
      description: t.title,
      time: (t.updatedAt || t.createdAt)?.toDate ? formatDistanceToNow((t.updatedAt || t.createdAt).toDate(), { addSuffix: true }) : 'Just now',
      priority: t.status === 'completed' ? 'DONE' : (t.priority || 'NORMAL'),
      icon: t.status === 'completed' ? CheckCircle2 : ListTodo,
      rawTime: t.updatedAt?.seconds || t.createdAt?.seconds || Math.floor(Date.now() / 1000),
      type: 'TASK'
    }));

    recentProjects?.forEach(p => items.push({
      id: `p-${p.id}`,
      title: 'Project Created',
      description: `${p.fileCode}: ${p.brand}`,
      time: p.createdAt?.toDate ? formatDistanceToNow(p.createdAt.toDate(), { addSuffix: true }) : 'Just now',
      priority: p.priority === 'RUSH' ? 'URGENT' : (p.priority || 'REGULAR'),
      icon: Layers,
      rawTime: p.updatedAt?.seconds || p.createdAt?.seconds || Math.floor(Date.now() / 1000),
      type: 'PROJECT'
    }));

    return items.sort((a, b) => b.rawTime - a.rawTime).slice(0, 20);
  }, [recentSchedules, recentTasks, recentProjects, user, isMounted]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.rawTime > lastReadTime).length;
  }, [notifications, lastReadTime]);

  const handleMarkAllRead = () => {
    const now = Math.floor(Date.now() / 1000);
    setLastReadTime(now);
    localStorage.setItem('conex_last_notif_read', now.toString());
    toast({ title: "Notifications Read", description: "All updates have been marked as read." });
  };

  const [eventType, setEventType] = useState<'Shoot' | 'Meeting' | 'Deadline'>('Shoot');
  const [schedulePriority, setSchedulePriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [client, setClient] = useState('');
  const [date, setDate] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');

  const [fileCode, setFileCode] = useState('');
  const [brand, setBrand] = useState('');

  const handleConfirmSchedule = () => {
    if (!firestore || !date || !client) return;
    const ref = collection(firestore, 'schedules');
    const data = { 
      title: `${eventType}: ${client}`, 
      type: eventType, 
      priority: schedulePriority, 
      client, 
      date, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    addDoc(ref, data).catch(console.error);
    toast({ title: "Event Added", description: "The schedule has been updated." });
    setIsScheduleOpen(false);
  };

  const handleCreateTask = () => {
    if (!firestore || !taskTitle || !taskDueDate || !assignedToId || !user) return;
    const assignee = staffList?.find(s => s.id === assignedToId);
    if (!assignee) return;
    const ref = collection(firestore, 'tasks');
    const data = { 
      title: taskTitle, 
      dueDate: taskDueDate, 
      status: 'pending', 
      assignedToId: assignedToId,
      assignedToName: assignee.name,
      assignedById: user.id,
      assignedByName: user.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    addDoc(ref, data).catch(console.error);
    toast({ title: "Task Assigned", description: `Assigned to ${assignee.name}.` });
    setIsTaskOpen(false);
  };

  const handleCreateProject = () => {
    if (!firestore || !fileCode || !brand) return;
    const ref = collection(firestore, 'projects');
    const data = { 
      fileCode, brand, status: 'In Production', priority: 'REGULAR', 
      createdAt: serverTimestamp(), updatedAt: serverTimestamp()
    };
    addDoc(ref, data).catch(console.error);
    toast({ title: "Project Created", description: `${fileCode} is now active.` });
    setIsProjectOpen(false);
  };

  if (!isMounted) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
        <Sheet>
          <SheetTrigger asChild>
            <button className={cn(
              "pointer-events-auto relative w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all",
              unreadCount > 0 && "animate-pulse"
            )}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 border-2 border-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md p-0 rounded-l-2xl overflow-hidden shadow-2xl">
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 border-b bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-xl font-bold">Notifications</SheetTitle>
                    <SheetDescription>Recent project and task updates</SheetDescription>
                  </div>
                  {unreadCount > 0 && (
                    <Button variant="ghost" onClick={handleMarkAllRead} className="text-xs text-primary font-bold h-8 px-2">
                      <CheckCheck className="w-3.5 h-3.5 mr-1" />
                      Mark Read
                    </Button>
                  )}
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {notifications.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">
                      <p className="text-sm font-medium">No recent updates.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={cn(
                        "p-4 rounded-xl border transition-all",
                        notif.rawTime > lastReadTime ? "bg-white border-primary/20 shadow-sm" : "bg-slate-50/50 border-slate-100"
                      )}>
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <notif.icon className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                              <span className="text-[10px] text-slate-400 font-medium">{notif.time}</span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-1">{notif.description}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={isActionsOpen} onOpenChange={setIsActionsOpen}>
          <DialogTrigger asChild>
            <button className="pointer-events-auto w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all">
              <Zap className="w-5 h-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold">Quick Actions</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {filteredActions.map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    setIsActionsOpen(false);
                    if (action.action === 'task') setIsTaskOpen(true);
                    else if (action.action === 'schedule') setIsScheduleOpen(true);
                    else if (action.action === 'project') setIsProjectOpen(true);
                    else if (action.href) router.push(action.href);
                  }}
                  className="flex flex-col p-4 bg-white border border-slate-100 rounded-xl hover:border-primary transition-all group"
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", action.bg)}>
                    <action.icon className={cn("w-4 h-4", action.color)} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary">{action.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{action.description}</p>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Simplified Modal Forms */}
      <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Production Project</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="File Code" value={fileCode} onChange={(e) => setFileCode(e.target.value)} />
            <Input placeholder="Brand Name" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <Button onClick={handleCreateProject} className="w-full">Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Task</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Task Title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>{staffList?.map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
            </Select>
            <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
            <Button onClick={handleCreateTask} className="w-full">Assign Task</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Client Name" value={client} onChange={(e) => setClient(e.target.value)} />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Button onClick={handleConfirmSchedule} className="w-full">Save Event</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
