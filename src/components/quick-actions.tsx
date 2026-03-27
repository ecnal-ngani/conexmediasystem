'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  Link as LinkIcon,
  Home,
  User,
  Info,
  CheckCheck,
  Timer,
  ChevronRight
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/auth-context';

const QUICK_ACTIONS = [
  {
    title: 'Home',
    description: 'Command Center',
    icon: Home,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    href: '/dashboard'
  },
  {
    title: 'Profile',
    description: 'System Identity',
    icon: User,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    href: '/dashboard/profile'
  },
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
    return query(collection(firestore, 'tasks'), orderBy('updatedAt', 'desc'), limit(50));
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

    // Filter tasks based on privacy requirements
    const filteredTasks = recentTasks?.filter(t => 
      t.assignedToId === user.id || t.assignedById === user.id
    ) || [];

    recentSchedules?.forEach(s => items.push({
      id: `s-${s.id}`,
      title: 'New Schedule Added',
      description: s.title,
      details: `${s.location || 'No location'} • ${s.callTime || ''}-${s.wrapTime || ''}`,
      time: s.createdAt?.toDate ? formatDistanceToNow(s.createdAt.toDate(), { addSuffix: true }) : 'Just now',
      priority: s.priority || 'NORMAL',
      icon: Calendar,
      rawTime: s.updatedAt?.seconds || s.createdAt?.seconds || Math.floor(Date.now() / 1000),
      type: 'SCHEDULE'
    }));

    filteredTasks.forEach(t => items.push({
      id: `t-${t.id}`,
      title: t.status === 'completed' ? 'Task Completed ✅' : 'Task Assigned',
      description: t.title,
      details: `By: ${t.assignedByName || 'Command'} • Assignee: ${t.assignedToName || 'Personnel'}`,
      time: (t.updatedAt || t.createdAt)?.toDate ? formatDistanceToNow((t.updatedAt || t.createdAt).toDate(), { addSuffix: true }) : 'Just now',
      priority: t.status === 'completed' ? 'DONE' : (t.priority || 'NORMAL'),
      icon: t.status === 'completed' ? CheckCircle2 : ListTodo,
      rawTime: t.updatedAt?.seconds || t.createdAt?.seconds || Math.floor(Date.now() / 1000),
      type: 'TASK'
    }));

    recentProjects?.forEach(p => items.push({
      id: `p-${p.id}`,
      title: 'Project Initialized',
      description: `${p.fileCode}: ${p.brand}`,
      details: `${p.artist || 'Unassigned'} • ${p.platform || 'General'}`,
      time: p.createdAt?.toDate ? formatDistanceToNow(p.createdAt.toDate(), { addSuffix: true }) : 'Just now',
      priority: p.priority === 'RUSH' ? 'URGENT' : (p.priority || 'REGULAR'),
      icon: Layers,
      rawTime: p.updatedAt?.seconds || p.createdAt?.seconds || Math.floor(Date.now() / 1000),
      type: 'PRODUCTION'
    }));

    return items.sort((a, b) => b.rawTime - a.rawTime).slice(0, 45);
  }, [recentSchedules, recentTasks, recentProjects, user, isMounted]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.rawTime > lastReadTime).length;
  }, [notifications, lastReadTime]);

  const handleMarkAllRead = () => {
    const now = Math.floor(Date.now() / 1000);
    setLastReadTime(now);
    localStorage.setItem('conex_last_notif_read', now.toString());
    toast({ title: "Intelligence Cleared", description: "All command updates marked as read." });
  };

  const [eventType, setEventType] = useState<'Shoot' | 'Meeting' | 'Deadline'>('Shoot');
  const [schedulePriority, setSchedulePriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [client, setClient] = useState('');
  const [date, setDate] = useState('');
  const [callTime, setCallTime] = useState('09:00');
  const [wrapTime, setWrapTime] = useState('17:00');
  const [location, setLocation] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Operations');
  const [taskPriority, setTaskPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskHours, setTaskHours] = useState('');
  const [assignedToId, setAssignedToId] = useState('');

  const [fileCode, setFileCode] = useState('');
  const [brand, setBrand] = useState('');
  const [contentIdea, setContentIdea] = useState('');
  const [projectStatus, setProjectStatus] = useState('In Production');
  const [projectPriority, setProjectPriority] = useState('REGULAR');
  const [artist, setArtist] = useState('');
  const [type, setType] = useState('Video');
  const [platform, setPlatform] = useState('Instagram');
  const [projectDueDate, setProjectDueDate] = useState('');

  const handleConfirmSchedule = () => {
    if (!firestore || !date || !client) return;
    const ref = collection(firestore, 'schedules');
    const data = { 
      title: `${eventType}: ${client}`, 
      type: eventType, 
      priority: schedulePriority, 
      client, 
      date, 
      callTime, 
      wrapTime, 
      location, 
      staff: selectedStaffIds, 
      notes, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    addDoc(ref, data).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data }));
    });
    toast({ title: "Schedule Synchronized", description: `Added ${client} to the master calendar.` });
    setIsScheduleOpen(false);
    setClient(''); setDate('');
  };

  const handleCreateTask = () => {
    if (!firestore || !taskTitle || !taskDueDate || !assignedToId || !user) {
      toast({ variant: "destructive", title: "Missing Information", description: "Title, Due Date, and Assignee are required." });
      return;
    }
    
    const assignee = staffList?.find(s => s.id === assignedToId);
    if (!assignee) return;

    const ref = collection(firestore, 'tasks');
    const data = { 
      title: taskTitle, 
      category: taskCategory, 
      priority: taskPriority, 
      dueDate: taskDueDate, 
      hours: taskHours || '0h',
      status: 'pending', 
      assignedToId: assignedToId,
      assignedToName: assignee.name,
      assignedById: user.id,
      assignedByName: user.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    addDoc(ref, data).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data }));
    });
    toast({ title: "Task Assigned", description: `"${taskTitle}" deployed to ${assignee.name}.` });
    setIsTaskOpen(false);
    setTaskTitle('');
    setTaskHours('');
    setAssignedToId('');
  };

  const handleCreateProject = () => {
    if (!firestore || !fileCode || !brand) return;
    const ref = collection(firestore, 'projects');
    const data = { 
      fileCode, 
      brand, 
      contentIdea, 
      status: projectStatus, 
      priority: projectPriority, 
      artist, 
      type, 
      platform, 
      dueDate: projectDueDate, 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    addDoc(ref, data).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data }));
    });
    toast({ title: "Project Initialized", description: `${fileCode} added to Production Hub.` });
    setIsProjectOpen(false);
    setFileCode(''); setBrand('');
  };

  const getPriorityBadgeStyles = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'RUSH':
        return "bg-red-600 text-white border-red-700 shadow-sm";
      case 'HIGH':
        return "bg-orange-50 text-white border-orange-600 shadow-sm";
      case 'NORMAL':
      case 'REGULAR':
        return "bg-blue-100 text-blue-700 border-blue-200";
      case 'DONE':
        return "bg-green-600 text-white border-green-700 shadow-sm";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  if (!isMounted) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
        <Sheet>
          <SheetTrigger asChild>
            <button className={cn(
              "pointer-events-auto relative w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all active:scale-95 group",
              unreadCount > 0 && "animate-pulse shadow-[0_0_20px_rgba(225,29,72,0.5)]"
            )}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-800 border-2 border-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md p-0 border-none rounded-l-3xl overflow-hidden shadow-2xl">
            <div className="flex flex-col h-full bg-white">
              <SheetHeader className="p-8 border-b bg-slate-50/50">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-red-200">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Feed</SheetTitle>
                      <SheetDescription className="text-sm text-slate-500 font-medium">Real-time activity log</SheetDescription>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 h-8 px-2"
                    >
                      <CheckCheck className="w-3 h-3 mr-1" />
                      Mark Read
                    </Button>
                  )}
                </div>
              </SheetHeader>
              <ScrollArea className="flex-1">
                <div className="p-6 space-y-4">
                  {notifications.length === 0 ? (
                    <div className="py-20 text-center space-y-4 px-6">
                      <div className="p-4 rounded-full bg-slate-50 text-slate-300 w-16 h-16 mx-auto flex items-center justify-center">
                        <Check className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">All systems quiet. No recent updates.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const isUnread = notif.rawTime > lastReadTime;
                      return (
                        <div key={notif.id} className={cn(
                          "p-5 rounded-2xl border-2 transition-all hover:shadow-md relative overflow-hidden",
                          isUnread ? "bg-white border-primary/20 shadow-sm" : "bg-slate-50/50 border-slate-100",
                          (notif.priority === 'URGENT' || notif.priority === 'HIGH' || notif.priority === 'RUSH') && "border-l-4 border-l-red-500",
                          notif.priority === 'DONE' && "border-l-4 border-l-green-600 bg-green-50/30"
                        )}>
                          {isUnread && (
                            <div className="absolute top-0 right-0">
                              <div className="bg-primary text-white text-[7px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-bl-lg shadow-sm">NEW</div>
                            </div>
                          )}
                          <div className="flex gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
                              notif.priority === 'URGENT' || notif.priority === 'HIGH' || notif.priority === 'RUSH'
                                ? "bg-red-500 border-red-200 text-white" 
                                : notif.priority === 'DONE'
                                ? "bg-green-600 border-green-200 text-white"
                                : "bg-white border-slate-100 text-slate-600 shadow-sm"
                            )}>
                              {notif.priority === 'DONE' ? <CheckCircle2 className="w-5 h-5" /> : 
                               (notif.priority === 'URGENT' || notif.priority === 'HIGH' || notif.priority === 'RUSH' ? <ShieldAlert className="w-5 h-5" /> : <notif.icon className="w-5 h-5" />)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-900 truncate pr-4">{notif.title}</h4>
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded leading-none border shrink-0",
                                  getPriorityBadgeStyles(notif.priority)
                                )}>
                                  {notif.priority}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-bold leading-tight">{notif.description}</p>
                              {notif.details && <p className="text-[10px] text-slate-400 font-medium">{notif.details}</p>}
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                                  <Clock className="w-3 h-3" />
                                  {notif.time}
                                </span>
                                <span className="text-9px font-black text-slate-300 uppercase tracking-tighter">
                                  {notif.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={isActionsOpen} onOpenChange={setIsActionsOpen}>
          <DialogTrigger asChild>
            <button className="pointer-events-auto w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95">
              <Zap className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
            <div className="p-6 space-y-6">
              <DialogHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-red-200">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">Quick Actions</DialogTitle>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
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
                    className="flex flex-col p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary/20 hover:shadow-md transition-all group text-left"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm", action.bg)}>
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
                  <DialogDescription className="text-slate-400 font-medium">Initialize a new creative asset in the hub.</DialogDescription>
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
                <Button onClick={handleCreateProject} className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl mt-4 text-white">Add to Hub</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="max-w-[440px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <div className="p-6 md:p-8 space-y-6">
            <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-100">
                <ListTodo className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Internal Task</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">Deploy a deliverable to a specific team member.</DialogDescription>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Task Title</Label>
                <Input placeholder="Deliverable name..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned Personnel</Label>
                <Select value={assignedToId} onValueChange={setAssignedToId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList?.map((staff: any) => (
                      <SelectItem key={staff.id} value={staff.id}>{staff.name} ({staff.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Timer className="w-3 h-3 text-primary" />
                  Estimated Hours
                </Label>
                <Input placeholder="e.g. 3h" value={taskHours} onChange={(e) => setTaskHours(e.target.value)} />
              </div>
              <Button onClick={handleCreateTask} className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold rounded-xl mt-4 text-white">Deploy Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                <Button onClick={handleConfirmSchedule} className="w-full h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl mt-4 text-white">Add to Calendar</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
