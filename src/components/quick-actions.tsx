'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Plus, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Check, 
  ListTodo, 
  Layers,
  Home,
  CheckCheck,
  Briefcase,
  FileText,
  Lightbulb,
  Zap,
  User,
  Share2,
  Link as LinkIcon,
  Loader2,
  Save,
  X,
  MapPin,
  Building2
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/auth-context';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

  // Data Queries
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
    return query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const brandsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'brands'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('name', 'asc'));
  }, [firestore, user]);

  const { data: recentSchedules } = useCollection<any>(schedulesQuery);
  const { data: recentTasks } = useCollection<any>(tasksQuery);
  const { data: recentProjects } = useCollection<any>(projectsQuery);
  const { data: brands } = useCollection<any>(brandsQuery);
  const { data: staffList } = useCollection<any>(usersQuery);

  // States for Schedule
  const [eventType, setEventType] = useState<'Shoot' | 'Meeting' | 'Deadline'>('Shoot');
  const [schedulePriority, setSchedulePriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  // States for Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');

  // States for Project
  const [fileCode, setFileCode] = useState('');
  const [projectBrandId, setProjectBrandId] = useState('');
  const [contentIdea, setContentIdea] = useState('');
  const [projectStatus, setProjectStatus] = useState('In Production');
  const [projectPriority, setProjectPriority] = useState('REGULAR');
  const [artist, setArtist] = useState('');
  const [projectType, setProjectType] = useState('Video');
  const [platform, setPlatform] = useState('Instagram');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [bm, setBm] = useState('');
  const [canvasLink, setCanvasLink] = useState('');

  // Continuous Tactical File Code Logic
  useEffect(() => {
    if (projectBrandId && brands && recentProjects) {
      const brand = brands.find((b: any) => b.id === projectBrandId);
      if (brand) {
        // Use local date (YYMMDD)
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const dateStr = `${yy}${mm}${dd}`;
        
        // Filter all projects for this brand to find the absolute max sequence
        const brandPrefixMatch = `${brand.prefix}-`;
        const brandProjects = recentProjects.filter((p: any) => p.fileCode?.startsWith(brandPrefixMatch));
        
        let nextNum = 1;
        if (brandProjects.length > 0) {
          const numbers = brandProjects.map((p: any) => {
            const parts = p.fileCode.split('-');
            const lastPart = parts[parts.length - 1];
            return parseInt(lastPart, 10) || 0;
          });
          nextNum = Math.max(...numbers) + 1;
        }
        
        setFileCode(`${brand.prefix}-${dateStr}-${nextNum.toString().padStart(2, '0')}`);
      }
    }
  }, [projectBrandId, brands, recentProjects]);

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

    recentProjects?.slice(0, 5).forEach(p => items.push({
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

  const handleConfirmSchedule = () => {
    if (!firestore || !eventDate || !selectedBrandId) {
      toast({ variant: "destructive", title: "Incomplete Intel", description: "Brand and Date are required." });
      return;
    }
    const brand = brands?.find((b: any) => b.id === selectedBrandId);
    if (!brand) return;

    const ref = collection(firestore, 'schedules');
    const data = { 
      title: `${eventType}: ${brand.name}`, 
      type: eventType, 
      priority: schedulePriority, 
      client: brand.name, 
      brandId: selectedBrandId,
      date: eventDate, 
      location: eventLocation,
      notes: eventNotes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    addDoc(ref, data).catch((e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'create',
        requestResourceData: data
      }));
    });
    toast({ title: "Event Synchronized", description: `${brand.name} has been added to the master calendar.` });
    setIsScheduleOpen(false);
    setSelectedBrandId(''); setEventDate(''); setEventLocation(''); setEventNotes('');
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
    addDoc(ref, data).catch((e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'create',
        requestResourceData: data
      }));
    });
    toast({ title: "Task Assigned", description: `Assigned to ${assignee.name}.` });
    setIsTaskOpen(false);
  };

  const handleCreateProject = () => {
    if (!firestore || !fileCode || !projectBrandId) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Brand and File Code are required." });
      return;
    }
    const brandObj = brands?.find((b: any) => b.id === projectBrandId);
    if (!brandObj) return;

    const ref = collection(firestore, 'projects');
    const data = { 
      fileCode, 
      brand: brandObj.name, 
      brandId: projectBrandId,
      contentIdea,
      status: projectStatus,
      priority: projectPriority,
      artist,
      type: projectType,
      platform,
      dueDate: projectDueDate,
      bm,
      canvasLink,
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp()
    };
    addDoc(ref, data).catch((e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: ref.path,
        operation: 'create',
        requestResourceData: data
      }));
    });
    toast({ title: "Project Created", description: `${fileCode} is now active.` });
    setIsProjectOpen(false);
    setFileCode(''); setProjectBrandId(''); setContentIdea(''); setArtist(''); setProjectDueDate(''); setCanvasLink('');
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
                    <SheetTitle className="text-xl font-bold">Updates & Activity</SheetTitle>
                    <SheetDescription>Recent project and task milestones</SheetDescription>
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
                      <p className="text-sm font-medium">System reports clear.</p>
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
              <Plus className="w-5 h-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-6 rounded-2xl border-none shadow-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-bold">Quick Actions</DialogTitle>
              <DialogDescription>Access common staff tools and creation menus.</DialogDescription>
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

      {/* New Project Dialog */}
      <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
        <DialogContent className="max-w-[540px] p-0 rounded-[32px] overflow-hidden border-none shadow-2xl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6 md:p-10 space-y-8">
              <DialogHeader className="flex flex-row items-start gap-5 space-y-0">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-xl shadow-red-100">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div className="pt-1">
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Add New Project</DialogTitle>
                  <DialogDescription className="text-slate-400 font-medium">Configure a new production item for the hub.</DialogDescription>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                      Brand Selection
                    </Label>
                    <Select value={projectBrandId} onValueChange={setProjectBrandId}>
                      <SelectTrigger className="h-14 border-slate-200 rounded-2xl focus:ring-primary">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands?.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      File Code
                    </Label>
                    <Input 
                      placeholder="Generated automatically..." 
                      value={fileCode}
                      onChange={(e) => setFileCode(e.target.value)}
                      className="h-14 border-slate-200 rounded-2xl bg-slate-50 font-mono text-xs" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-primary" />
                    Content Idea
                  </Label>
                  <Input 
                    placeholder="Product showcase reel" 
                    value={contentIdea}
                    onChange={(e) => setContentIdea(e.target.value)}
                    className="h-14 border-slate-200 rounded-2xl focus:ring-primary" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      Status
                    </Label>
                    <Select value={projectStatus} onValueChange={setProjectStatus}>
                      <SelectTrigger className="h-14 border-slate-200 rounded-2xl focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="In Production">In Production</SelectItem>
                        <SelectItem value="For QA">For QA</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Client Revision">Client Revision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      Priority
                    </Label>
                    <Select value={projectPriority} onValueChange={setProjectPriority}>
                      <SelectTrigger className="h-14 border-slate-200 rounded-2xl focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REGULAR">REGULAR</SelectItem>
                        <SelectItem value="RUSH">RUSH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Artist
                    </Label>
                    <Input 
                      placeholder="Jhon Lester Nolial" 
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      className="h-14 border-slate-200 rounded-2xl focus:ring-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Type
                    </Label>
                    <Select value={projectType} onValueChange={setProjectType}>
                      <SelectTrigger className="h-14 border-slate-200 rounded-2xl focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Video">Video</SelectItem>
                        <SelectItem value="Graphic Design">Graphic Design</SelectItem>
                        <SelectItem value="Motion Graphics">Motion Graphics</SelectItem>
                        <SelectItem value="Photography">Photography</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 text-primary" />
                      Platform
                    </Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="h-14 border-slate-200 rounded-2xl focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="TikTok">TikTok</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                        <SelectItem value="YouTube">YouTube</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      Due Date
                    </Label>
                    <Input 
                      type="date" 
                      value={projectDueDate}
                      onChange={(e) => setProjectDueDate(e.target.value)}
                      className="h-14 border-slate-200 rounded-2xl focus:ring-primary" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Brand Manager (BM)
                    </Label>
                    <Input 
                      placeholder="Clark" 
                      value={bm}
                      onChange={(e) => setBm(e.target.value)}
                      className="h-14 border-slate-200 rounded-2xl focus:ring-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-primary" />
                      Canvas Link
                    </Label>
                    <Input 
                      placeholder="https://..." 
                      value={canvasLink}
                      onChange={(e) => setCanvasLink(e.target.value)}
                      className="h-14 border-slate-200 rounded-2xl focus:ring-primary" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <DialogClose asChild>
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  onClick={handleCreateProject}
                  className="flex-1 h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-red-100 text-white transition-all active:scale-[0.98]"
                >
                  Add to Hub
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Assign Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Task Title</Label>
              <Input placeholder="Objective description..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assignee</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select personnel" /></SelectTrigger>
                <SelectContent>{staffList?.map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deadline</Label>
              <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <Button onClick={handleCreateTask} className="w-full h-12 rounded-xl bg-primary text-white font-bold mt-4 shadow-lg shadow-red-100">Assign Mission</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Event Schedule Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-[480px] p-0 rounded-[32px] overflow-hidden border-none shadow-2xl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6 md:p-10 space-y-8">
              <DialogHeader className="flex flex-row items-start gap-5 space-y-0">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-xl shadow-red-100">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="pt-1">
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Event Schedule</DialogTitle>
                  <DialogDescription className="text-slate-400 font-medium">Synchronize a new event with the master calendar.</DialogDescription>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Event Type</Label>
                    <Select value={eventType} onValueChange={(val: any) => setEventType(val)}>
                      <SelectTrigger className="h-14 border-slate-200 rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shoot">Shoot</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                        <SelectItem value="Deadline">Deadline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-primary" />
                      Priority
                    </Label>
                    <Select value={schedulePriority} onValueChange={(val: any) => setSchedulePriority(val)}>
                      <SelectTrigger className="h-14 border-slate-200 rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="URGENT">URGENT</SelectItem>
                        <SelectItem value="HIGH">HIGH</SelectItem>
                        <SelectItem value="NORMAL">NORMAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Authorized Brand
                  </Label>
                  <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                    <SelectTrigger className="h-14 border-slate-200 rounded-2xl">
                      <SelectValue placeholder="Select authorized client" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands?.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Event Date</Label>
                    <Input 
                      type="date" 
                      value={eventDate} 
                      onChange={(e) => setEventDate(e.target.value)}
                      className="h-14 border-slate-200 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location</Label>
                    <Input 
                      placeholder="Studio A / Site" 
                      value={eventLocation} 
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="h-14 border-slate-200 rounded-2xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operational Notes</Label>
                  <Input 
                    placeholder="Special instructions or gear required..." 
                    value={eventNotes} 
                    onChange={(e) => setEventNotes(e.target.value)}
                    className="h-14 border-slate-200 rounded-2xl"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <DialogClose asChild>
                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleConfirmSchedule}
                    className="flex-1 h-14 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-red-100 text-white"
                  >
                    Deploy to Calendar
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
