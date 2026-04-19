'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const MapPicker = dynamic(() => import('@/components/map-picker'), { ssr: false });
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
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Badge } from '@/components/ui/badge';

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
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [isNotifDetailOpen, setIsNotifDetailOpen] = useState(false);
  const [lastReadTime, setLastReadTime] = useState<number>(0);
  
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('conex_last_notif_read');
    if (stored) setLastReadTime(parseInt(stored));
  }, []);

  // MEMOIZED QUERIES for performance stability
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
    return query(collection(firestore, 'projects'), orderBy('updatedAt', 'desc'), limit(15));
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
  const [eventType, setEventType] = useState<string>('Shoot');
  const [customEventType, setCustomEventType] = useState('');
  const [schedulePriority, setSchedulePriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [eventNotes, setEventNotes] = useState('');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // States for Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [taskPriority, setTaskPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');

  // States for Project
  const [fileCode, setFileCode] = useState('');
  const [projectBrandId, setProjectBrandId] = useState('');
  const [contentIdea, setContentIdea] = useState('');
  const [projectStatus, setProjectStatus] = useState('Pending');
  const [projectPriority, setProjectPriority] = useState('REGULAR');
  const [artist, setArtist] = useState('');
  const [artistId, setArtistId] = useState('');
  const [projectType, setProjectType] = useState('Video');
  const [platform, setPlatform] = useState('Instagram');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [bm, setBm] = useState('');
  const [canvasLink, setCanvasLink] = useState('');

  // OpenStreetMap Location Autocomplete
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (eventLocation && eventLocation.length > 2 && isScheduleOpen) {
        setIsSearchingLocation(true);
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(eventLocation)}&format=json&addressdetails=1&limit=5`)
          .then(res => res.json())
          .then(data => {
            setLocationSuggestions(data);
            setIsSearchingLocation(false);
          })
          .catch(() => {
            setIsSearchingLocation(false);
            setLocationSuggestions([]);
          });
      } else {
        setLocationSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [eventLocation, isScheduleOpen]);

  // Dynamic File Code Logic
  useEffect(() => {
    if (projectBrandId && brands && recentProjects) {
      const brand = brands.find((b: any) => b.id === projectBrandId);
      if (brand) {
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const dateStr = `${yy}${mm}${dd}`;
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

  const notifications = useMemo(() => {
    const items: any[] = [];
    if (!user || !isMounted) return items;
    
    // 1. Schedules (Global Events)
    recentSchedules?.forEach(s => items.push({ ...s, type: 'SCHEDULE', rawTime: s.createdAt?.seconds || 0 }));
    
    // 2. Tasks (Personal Directives)
    recentTasks?.filter(t => t.assignedToId === user.id || t.assignedById === user.id).forEach(t => items.push({ ...t, type: 'TASK', rawTime: (t.updatedAt || t.createdAt)?.seconds || 0 }));
    
    // 3. Projects (Assigned Production Items)
    const isAdmin = user.role === 'ADMIN' || user.role === 'BRAND_MANAGER';
    recentProjects?.filter(p => isAdmin || p.artistId === user.id).forEach(p => items.push({ ...p, type: 'PROJECT', rawTime: p.createdAt?.seconds || 0 }));

    return items.sort((a, b) => b.rawTime - a.rawTime).slice(0, 20);
  }, [recentSchedules, recentTasks, recentProjects, user, isMounted]);

  const getNotifIcon = (type: string) => {
    if (type === 'SCHEDULE') return Calendar;
    if (type === 'TASK') return ListTodo;
    if (type === 'PROJECT') return Layers;
    return Bell;
  };

  const getNotifStyle = (type: string, status?: string) => {
    if (status === 'Done' || status === 'completed' || status === 'Approved') {
      return { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-100', iconColor: 'text-green-600', dot: 'bg-green-500' };
    }
    if (type === 'SCHEDULE') return { bg: 'bg-red-50', border: 'border-red-100', iconBg: 'bg-red-100', iconColor: 'text-primary', dot: 'bg-primary' };
    if (type === 'TASK') return { bg: 'bg-green-50', border: 'border-green-100', iconBg: 'bg-green-100', iconColor: 'text-green-600', dot: 'bg-green-500' };
    if (type === 'PROJECT') return { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', dot: 'bg-blue-500' };
    return { bg: 'bg-slate-50', border: 'border-slate-100', iconBg: 'bg-slate-100', iconColor: 'text-slate-500', dot: 'bg-slate-400' };
  };

  const handleCreateProject = () => {
    if (!firestore || !fileCode || !projectBrandId || !artist || !projectDueDate || !user) {
      toast({ variant: "destructive", title: "Missing Information", description: "Brand, Artist, and Due Date are required." });
      return;
    }
    const brandObj = brands?.find((b: any) => b.id === projectBrandId);
    if (!brandObj) return;
    const ref = collection(firestore, 'projects');
    const data = { 
      fileCode, brand: brandObj.name, brandId: projectBrandId, contentIdea, status: projectStatus, priority: projectPriority, 
      artist, artistId, type: projectType, platform, dueDate: projectDueDate, bm, canvasLink, 
      assignedById: user.id, assignedByName: user.name,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp() 
    };
    addDoc(ref, data).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data } satisfies SecurityRuleContext));
    });
    toast({ title: "Project Initialized" });
    setIsProjectOpen(false);
  };

  const handleCreateSchedule = () => {
    const resolvedType = eventType === 'Custom' ? customEventType.trim() : eventType;
    if (!firestore || !resolvedType || !eventDate || !user) return;
    const ref = collection(firestore, 'schedules');
    const brandObj = brands?.find((b: any) => b.id === selectedBrandId);
    const data = { 
      type: resolvedType, 
      priority: schedulePriority, 
      brandId: selectedBrandId || null, 
      brandName: brandObj ? brandObj.name : null,
      date: eventDate, 
      location: eventLocation, 
      notes: eventNotes,
      assignedById: user.id,
      assignedByName: user.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp() 
    };
    addDoc(ref, data).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data } satisfies SecurityRuleContext));
    });
    toast({ title: "Event Scheduled" });
    setIsScheduleOpen(false);
  };

  const handleCreateTask = () => {
    if (!firestore || !taskTitle || !assignedToId || !user) return;
    const assignee = staffList?.find(s => s.id === assignedToId);
    if (!assignee) return;
    const ref = collection(firestore, 'tasks');
    const data = { title: taskTitle, dueDate: taskDueDate, status: 'pending', priority: taskPriority, assignedToId, assignedToName: assignee.name, assignedById: user.id, assignedByName: user.name, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    addDoc(ref, data).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data } satisfies SecurityRuleContext));
    });
    toast({ title: "Task Assigned" });
    setIsTaskOpen(false);
  };

  if (!isMounted) return null;

  const unreadCount = notifications.filter(n => n.rawTime > lastReadTime).length;

  const markAllRead = () => {
    const now = Date.now() / 1000;
    setLastReadTime(now);
    localStorage.setItem('conex_last_notif_read', String(now));
  };

  const filteredActions = QUICK_ACTIONS.filter(action => {
    if (action.adminOnly && user?.role !== 'ADMIN') return false;
    if (user?.role === 'INTERN' && (action.action === 'project' || action.action === 'schedule' || action.action === 'task')) return false;
    return true;
  });

  return (
    <>
      <div className="fixed bottom-24 lg:bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
        <Sheet open={isNotifOpen} onOpenChange={setIsNotifOpen}>
          <SheetTrigger asChild>
            <button className="pointer-events-auto w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200 hover:scale-105 active:scale-95 transition-transform relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-slate-900 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm tabular-nums">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-[420px] p-0 flex flex-col rounded-l-3xl overflow-hidden shadow-2xl border-0">
            <SheetHeader className="px-6 pt-6 pb-4 border-b bg-white shrink-0 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <SheetTitle className="text-[15px] font-black text-slate-900 leading-none">Activity Feed</SheetTitle>
                    <SheetDescription className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {notifications.length} updates
                      {unreadCount > 0 && <span className="text-primary font-black"> · {unreadCount} new</span>}
                    </SheetDescription>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1.5 text-[11px] font-black text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors">
                    <CheckCheck className="w-3 h-3" />
                    Mark read
                  </button>
                )}
              </div>
            </SheetHeader>
            <ScrollArea className="flex-1 min-h-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4"><Bell className="w-7 h-7 text-slate-300" /></div>
                  <p className="text-sm font-black text-slate-900">All caught up!</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">No recent activity.</p>
                </div>
              ) : (
                <div className="p-4 space-y-2 text-left">
                  {notifications.map((n, i) => {
                    const style = getNotifStyle(n.type, n.status);
                    const Icon = getNotifIcon(n.type);
                    const isUnread = n.rawTime > lastReadTime;
                    const label = n.type === 'SCHEDULE' ? (n.brandName || n.brand || 'Shoot') : n.type === 'PROJECT' ? (n.brand || n.fileCode) : n.title;
                    const sublabel = n.type === 'SCHEDULE' ? `${n.type} · ${n.date || ''}` : n.type === 'PROJECT' ? `New Project · Due ${n.dueDate}` : `Task · ${n.assignedToName || ''}`;
                    return (
                      <div key={i} onClick={() => { setSelectedNotif(n); setIsNotifDetailOpen(true); }} className={cn("p-4 rounded-2xl border transition-all cursor-pointer hover:bg-white/50", style.bg, style.border, isUnread ? "shadow-sm" : "opacity-70")}>
                        <div className="flex gap-3 items-start">
                          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", style.iconBg)}><Icon className={cn("w-4 h-4", style.iconColor)} /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-black text-slate-900 truncate">{label}</p>
                              {isUnread && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{sublabel}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{n.rawTime ? formatDistanceToNow(new Date(n.rawTime * 1000), { addSuffix: true }) : ''}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
        <Dialog open={isActionsOpen} onOpenChange={setIsActionsOpen}>
          <DialogTrigger asChild><button className="pointer-events-auto w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg"><Plus className="w-5 h-5" /></button></DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl"><DialogHeader><DialogTitle>Quick Actions</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {filteredActions.map((action, i) => (
                <button key={i} onClick={() => { setIsActionsOpen(false); if(action.action === 'project') setIsProjectOpen(true); else if(action.action === 'schedule') setIsScheduleOpen(true); else if(action.action === 'task') setIsTaskOpen(true); else if(action.href) router.push(action.href); }} className="p-4 bg-white border rounded-xl hover:border-primary">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", action.bg)}><action.icon className={cn("w-4 h-4", action.color)} /></div>
                  <h4 className="text-sm font-bold text-left">{action.title}</h4>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
        <DialogContent className="max-w-[540px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6 md:p-8 space-y-6">
              <DialogHeader className="flex flex-row items-start gap-4 space-y-0 text-left">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-red-100"><Plus className="w-6 h-6 text-white" /></div>
                <div><DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Add New Project</DialogTitle><DialogDescription className="text-slate-400 font-medium">Configure a new production item for the hub.</DialogDescription></div>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest"><Briefcase className="w-3 h-3 text-primary" />Brand Selection</Label>
                    <Select value={projectBrandId} onValueChange={setProjectBrandId}><SelectTrigger className="h-12 border-slate-200 rounded-xl"><SelectValue placeholder="Select Brand" /></SelectTrigger><SelectContent>{brands?.map((b: any) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest"><FileText className="w-3 h-3 text-primary" />File Code</Label>
                    <Input readOnly value={fileCode} className="h-12 border-slate-200 rounded-xl bg-slate-50 font-mono text-xs" />
                  </div>
                </div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest"><Lightbulb className="w-3 h-3 text-primary" />Content Idea</Label><Input placeholder="Product showcase reel" value={contentIdea} onChange={(e) => setContentIdea(e.target.value)} className="h-12 rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest"><User className="w-3 h-3 text-primary" />Artist</Label>
                    <Select value={artistId} onValueChange={(val) => { setArtistId(val); const s = staffList?.find(u => u.id === val); if (s) setArtist(s.name); }}><SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{staffList?.map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest"><Calendar className="w-3 h-3 text-primary" />Due Date</Label><Input type="date" value={projectDueDate} onChange={(e) => setProjectDueDate(e.target.value)} className="h-12 rounded-xl" /></div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Status</Label><Select value={projectStatus} onValueChange={setProjectStatus}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="In Production">In Production</SelectItem><SelectItem value="For QA">For QA</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Client Revision">Client Revision</SelectItem><SelectItem value="Done">Done</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Priority</Label><Select value={projectPriority} onValueChange={setProjectPriority}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="REGULAR">REGULAR</SelectItem><SelectItem value="RUSH">RUSH</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <LinkIcon className="w-3 h-3 text-primary" />
                      Canva / Design Link
                    </Label>
                    <Input 
                      placeholder="https://www.canva.com/design/..." 
                      value={canvasLink} 
                      onChange={(e) => setCanvasLink(e.target.value)} 
                      className="h-12 rounded-xl" 
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <DialogClose asChild><Button variant="outline" className="flex-1 h-12 rounded-xl">Cancel</Button></DialogClose>
                <Button onClick={handleCreateProject} className="flex-1 h-12 rounded-xl bg-primary text-white font-bold">Add to Hub</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-[500px] rounded-[16px] p-8 gap-6 border-none shadow-2xl">
          <button onClick={() => setIsScheduleOpen(false)} className="absolute right-4 top-4 opacity-70 hover:opacity-100 outline-none"><X className="h-4 w-4" /></button>
          <DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left">
            <div className="w-[50px] h-[50px] rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-red-200"><Calendar className="w-6 h-6 text-white" /></div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Event Schedule</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">Synchronize with master calendar.</DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-6 mt-2 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">EVENT TYPE</Label>
                <Select value={eventType} onValueChange={(v: any) => { setEventType(v); if (v !== 'Custom') setCustomEventType(''); }}>
                  <SelectTrigger className="h-12 border-slate-200 rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent><SelectItem value="Shoot">Shoot</SelectItem><SelectItem value="Meeting">Meeting</SelectItem><SelectItem value="Deadline">Deadline</SelectItem><SelectItem value="Custom" className="text-primary font-bold">✏ Custom...</SelectItem></SelectContent>
                </Select>
                {eventType === 'Custom' && <Input autoFocus placeholder="e.g. BTS..." value={customEventType} onChange={e => setCustomEventType(e.target.value)} className="mt-2 h-10 rounded-xl border-primary border-2 font-medium px-4" />}
              </div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" />PRIORITY</Label>
                <Select value={schedulePriority} onValueChange={(v: any) => setSchedulePriority(v)}><SelectTrigger className="h-12 border-slate-200 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NORMAL">NORMAL</SelectItem><SelectItem value="HIGH">HIGH</SelectItem><SelectItem value="URGENT" className="text-red-600 font-bold">URGENT</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-primary" />BRAND</Label>
              <Select value={selectedBrandId} onValueChange={setSelectedBrandId}><SelectTrigger className="h-12 border-slate-200 rounded-xl"><SelectValue placeholder="Select Brand" /></SelectTrigger><SelectContent>{brands?.map((b: any) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">DATE</Label><Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="h-12 border-slate-200 rounded-xl" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">LOCATION</Label>
                <div className="flex gap-2 relative">
                  <Input placeholder="Studio A" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="h-12 border-slate-200 rounded-xl flex-1" />
                  <Button variant="outline" className="h-12 w-12 p-0 rounded-xl" onClick={() => setIsMapPickerOpen(true)}><MapPin className="w-5 h-5 text-primary" /></Button>
                </div>
              </div>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">OPERATIONAL NOTES</Label><Input placeholder="Special gear required..." value={eventNotes} onChange={e => setEventNotes(e.target.value)} className="h-12 border-slate-200 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <DialogClose asChild><Button variant="outline" className="h-12 rounded-xl font-bold">Cancel</Button></DialogClose>
              <Button onClick={handleCreateSchedule} className="h-12 rounded-xl bg-primary text-white font-bold">Deploy</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="max-w-md rounded-3xl p-8"><DialogHeader><DialogTitle className="text-xl font-black">Assign Mission</DialogTitle></DialogHeader>
          <div className="space-y-4 text-left">
            <Input placeholder="Mission Title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="h-12 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Timeline</Label><Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="h-12 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Priority</Label>
                <Select value={taskPriority} onValueChange={(v: any) => setTaskPriority(v)}><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="URGENT">URGENT</SelectItem><SelectItem value="HIGH">HIGH</SelectItem><SelectItem value="NORMAL">NORMAL</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Assignee</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}><SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select operative" /></SelectTrigger><SelectContent>{staffList?.map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select>
            </div>
            <Button onClick={handleCreateTask} className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-red-100 mt-2">Deploy Directive</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMapPickerOpen} onOpenChange={setIsMapPickerOpen}>
        <DialogContent className="max-w-[800px] w-[90vw] p-0 border-none bg-transparent shadow-none [&>button]:hidden sm:rounded-xl">
           <MapPicker onLocationSelect={(addr) => { setEventLocation(addr); setIsMapPickerOpen(false); }} onCancel={() => setIsMapPickerOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isNotifDetailOpen} onOpenChange={setIsNotifDetailOpen}>
        <DialogContent className="max-w-[480px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          {selectedNotif && (
            <div className="p-8 space-y-6 text-left">
              {(() => {
                const Icon = getNotifIcon(selectedNotif.type);
                const style = getNotifStyle(selectedNotif.type, selectedNotif.status);
                return (
                  <div className="flex items-center gap-4">
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", style.iconBg)}><Icon className={cn("w-7 h-7", style.iconColor)} /></div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedNotif.title || selectedNotif.brand}</h3>
                      <Badge className={cn("mt-1 text-[10px] font-black uppercase px-2", style.bg, style.iconColor)} variant="outline">{selectedNotif.type} MISSION</Badge>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-50">
                <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Priority</p><p className={cn("text-xs font-bold", selectedNotif.priority === 'URGENT' || selectedNotif.priority === 'RUSH' ? 'text-red-600' : 'text-slate-700')}>{selectedNotif.priority || 'NORMAL'}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Timeline</p><p className="text-xs font-bold text-slate-700">{selectedNotif.dueDate || selectedNotif.date || 'TBA'}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assigned By</p><div className="flex items-center gap-2 mt-1"><div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 capitalize">{selectedNotif.assignedByName?.charAt(0) || 'A'}</div><p className="text-xs font-bold text-slate-900">{selectedNotif.assignedByName || 'Administrator'}</p></div></div>
                <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</p><p className="text-xs font-bold text-slate-700 capitalize">{selectedNotif.status || 'Pending'}</p></div>
              </div>
              {selectedNotif.notes && (
                <div className="space-y-2"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Intelligence</p><p className="text-sm text-slate-600 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">"{selectedNotif.notes}"</p></div>
              )}
              {selectedNotif.canvasLink && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Design Assets</p>
                  <a 
                    href={selectedNotif.canvasLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl group hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <LinkIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-blue-900">Open Canva Project</p>
                      <p className="text-[11px] text-blue-600/70 truncate">{selectedNotif.canvasLink}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
                  </a>
                </div>
              )}
              <div className="flex flex-col gap-3 pt-2">
                <Button onClick={() => { setIsNotifDetailOpen(false); setIsNotifOpen(false); router.push(selectedNotif.type === 'SCHEDULE' ? '/dashboard/calendar' : selectedNotif.type === 'PROJECT' ? '/dashboard/production' : '/dashboard/calendar'); }} className="h-12 rounded-xl bg-slate-900 text-white font-bold">Go to Command Center</Button>
                <Button variant="outline" onClick={() => setIsNotifDetailOpen(false)} className="h-12 rounded-xl border-slate-200 font-bold text-slate-500">Dismiss</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
