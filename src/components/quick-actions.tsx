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
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [eventNotes, setEventNotes] = useState('');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

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

  // Dynamic File Code Logic (useEffect memoization)
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

  const filteredActions = useMemo(() => {
    return QUICK_ACTIONS.filter(action => {
      if (action.adminOnly && user?.role !== 'ADMIN') return false;
      if (user?.role === 'INTERN' && (action.action === 'project' || action.action === 'schedule' || action.action === 'task')) return false;
      return true;
    });
  }, [user]);

  const notifications = useMemo(() => {
    const items: any[] = [];
    if (!user || !isMounted) return items;
    recentSchedules?.forEach(s => items.push({ ...s, icon: Calendar, type: 'SCHEDULE', rawTime: s.createdAt?.seconds || 0 }));
    recentTasks?.filter(t => t.assignedToId === user.id || t.assignedById === user.id).forEach(t => items.push({ ...t, icon: ListTodo, type: 'TASK', rawTime: (t.updatedAt || t.createdAt)?.seconds || 0 }));
    return items.sort((a, b) => b.rawTime - a.rawTime).slice(0, 15);
  }, [recentSchedules, recentTasks, user, isMounted]);

  const handleCreateProject = () => {
    if (!firestore || !fileCode || !projectBrandId) return;
    const brandObj = brands?.find((b: any) => b.id === projectBrandId);
    if (!brandObj) return;
    const ref = collection(firestore, 'projects');
    const data = { fileCode, brand: brandObj.name, brandId: projectBrandId, contentIdea, status: projectStatus, priority: projectPriority, artist, type: projectType, platform, dueDate: projectDueDate, bm, canvasLink, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    addDoc(ref, data).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data } satisfies SecurityRuleContext));
    });
    toast({ title: "Project Initialized" });
    setIsProjectOpen(false);
  };

  const handleCreateSchedule = () => {
    if (!firestore || !eventType || !eventDate || !user) return;
    const ref = collection(firestore, 'schedules');
    const brandObj = brands?.find((b: any) => b.id === selectedBrandId);
    const data = { 
      type: eventType, 
      priority: schedulePriority, 
      brandId: selectedBrandId || null, 
      brandName: brandObj ? brandObj.name : null,
      date: eventDate, 
      location: eventLocation, 
      notes: eventNotes,
      createdBy: user.id,
      createdByName: user.name,
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
    const data = { title: taskTitle, dueDate: taskDueDate, status: 'pending', assignedToId, assignedToName: assignee.name, assignedById: user.id, assignedByName: user.name, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    addDoc(ref, data).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: ref.path, operation: 'create', requestResourceData: data } satisfies SecurityRuleContext));
    });
    toast({ title: "Task Assigned" });
    setIsTaskOpen(false);
  };

  if (!isMounted) return null;

  return (
    <>
      <div className="fixed bottom-24 lg:bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
        <Sheet>
          <SheetTrigger asChild>
            <button className="pointer-events-auto w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg"><Bell className="w-5 h-5" /></button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md p-0 rounded-l-2xl overflow-hidden shadow-2xl">
            <SheetHeader className="p-6 border-b bg-slate-50"><SheetTitle>Updates & Activity</SheetTitle></SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {notifications.map((n, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-white shadow-sm">
                    <div className="flex gap-3">
                      <n.icon className="w-4 h-4 text-slate-400" />
                      <div><h4 className="text-sm font-bold">{n.title || n.brand}</h4><p className="text-xs text-slate-600">{n.description || n.type}</p></div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <h4 className="text-sm font-bold">{action.title}</h4>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
        <DialogContent className="max-w-[500px] rounded-[16px] p-8 gap-6 border-none shadow-2xl">
          <button onClick={() => setIsProjectOpen(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground outline-none">
             <X className="h-4 w-4" />
             <span className="sr-only">Close</span>
          </button>
          <DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left">
            <div className="w-[50px] h-[50px] rounded-full bg-[#E31D3B] flex items-center justify-center shrink-0 shadow-sm shadow-[#E31D3B]/40">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-[#0B1527] text-[22px] font-bold leading-none tracking-tight">Add New Project</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium text-[15px]">
                Configure a new production item for the hub.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest px-1">
                  <div className="w-4 h-4 flex items-center justify-center text-[#E31D3B]">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  BRAND SELECTION
                </Label>
                <div className="relative">
                  <Select value={projectBrandId} onValueChange={setProjectBrandId}>
                    <SelectTrigger className="h-[50px] bg-white border-2 border-[#E31D3B] rounded-xl text-[15px] font-medium text-slate-900 px-4 focus:ring-0 focus:ring-offset-0 focus:border-[#E31D3B]">
                      <SelectValue placeholder="Select Brand" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      {brands?.map((b: any) => (<SelectItem key={b.id} value={b.id} className="font-medium">{b.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest px-1">
                  <div className="w-4 h-4 flex items-center justify-center text-[#E31D3B]">
                   <FileText className="w-3.5 h-3.5" />
                  </div>
                  FILE CODE
                </Label>
                <Input 
                  readOnly 
                  value={fileCode || 'Generated automatically...'} 
                  className={cn(
                    "h-[50px] rounded-xl font-mono text-[13px] border-slate-200 bg-slate-50 shadow-none focus-visible:ring-0",
                    !fileCode && "text-slate-400 italic"
                  )} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest px-1">
                <div className="w-4 h-4 flex items-center justify-center text-[#E31D3B]">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                CONTENT IDEA
              </Label>
              <Input 
                placeholder="Product showcase reel" 
                value={contentIdea} 
                onChange={e => setContentIdea(e.target.value)} 
                className="h-[52px] rounded-xl border-slate-200 text-[15px] text-slate-600 font-medium px-4 focus-visible:ring-primary/20 shadow-none placeholder:text-slate-400 placeholder:font-normal" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-900 px-1">Status</Label>
                <Select value={projectStatus} onValueChange={setProjectStatus}>
                  <SelectTrigger className="h-[50px] bg-white border border-slate-200 rounded-xl text-[15px] font-medium text-slate-900 px-4 shadow-none focus:ring-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="In Production" className="font-medium">In Production</SelectItem>
                    <SelectItem value="On Deck" className="font-medium">On Deck</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-900 px-1">Priority</Label>
                <Select value={projectPriority} onValueChange={setProjectPriority}>
                  <SelectTrigger className="h-[50px] bg-white border border-slate-200 rounded-xl text-[15px] font-semibold text-slate-900 px-4 shadow-none focus:ring-0">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="REGULAR" className="font-semibold">REGULAR</SelectItem>
                    <SelectItem value="HIGH" className="font-semibold">HIGH</SelectItem>
                    <SelectItem value="URGENT" className="font-semibold text-red-600">URGENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
               <DialogClose asChild>
                 <Button variant="outline" className="w-full h-[54px] rounded-xl text-[15px] font-bold border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-900 shadow-none">
                   Cancel
                 </Button>
               </DialogClose>
               <Button onClick={handleCreateProject} className="w-full h-[54px] rounded-xl bg-[#E31D3B] hover:bg-[#C91A34] text-white text-[15px] font-bold shadow-sm transition-colors">
                 Add to Hub
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-[500px] rounded-[16px] p-8 gap-6 border-none shadow-2xl">
          <button onClick={() => setIsScheduleOpen(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground outline-none">
             <X className="h-4 w-4" />
             <span className="sr-only">Close</span>
          </button>
          <DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left">
            <div className="w-[50px] h-[50px] rounded-full bg-[#E31D3B] flex items-center justify-center shrink-0 shadow-sm shadow-[#E31D3B]/40">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-[#0B1527] text-[22px] font-bold leading-none tracking-tight">New Event Schedule</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium text-[15px]">
                Synchronize a new event with the master calendar.
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest px-1">
                  EVENT TYPE
                </Label>
                <div className="relative">
                  <Select value={eventType} onValueChange={(v: any) => setEventType(v)}>
                    <SelectTrigger className="h-[50px] bg-white border-2 border-[#E31D3B] rounded-xl text-[15px] font-medium text-slate-900 px-4 focus:ring-0 focus:ring-offset-0 focus:border-[#E31D3B]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                      <SelectItem value="Shoot" className="font-medium">Shoot</SelectItem>
                      <SelectItem value="Meeting" className="font-medium">Meeting</SelectItem>
                      <SelectItem value="Deadline" className="font-medium">Deadline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest px-1">
                  <div className="w-4 h-4 flex items-center justify-center text-[#E31D3B]">
                   <Zap className="w-3.5 h-3.5" />
                  </div>
                  PRIORITY
                </Label>
                <Select value={schedulePriority} onValueChange={(v: any) => setSchedulePriority(v)}>
                  <SelectTrigger className="h-[50px] bg-white border border-slate-200 rounded-xl text-[15px] font-bold text-slate-900 px-4 shadow-none focus:ring-0">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="NORMAL" className="font-bold cursor-pointer">NORMAL</SelectItem>
                    <SelectItem value="HIGH" className="font-bold cursor-pointer">HIGH</SelectItem>
                    <SelectItem value="URGENT" className="font-bold text-red-600 cursor-pointer">URGENT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest px-1">
                <div className="w-4 h-4 flex items-center justify-center text-[#E31D3B]">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                AUTHORIZED BRAND
              </Label>
              <div className="relative">
                 <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                   <SelectTrigger className="h-[50px] bg-white border border-slate-200 rounded-xl text-[15px] font-medium text-slate-900 px-4 shadow-none focus:ring-0">
                     <SelectValue placeholder="Select authorized client" />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                     {brands?.map((b: any) => (<SelectItem key={b.id} value={b.id} className="font-medium">{b.name}</SelectItem>))}
                   </SelectContent>
                 </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest px-1">EVENT DATE</Label>
                <Input 
                  type="date"
                  value={eventDate} 
                  onChange={e => setEventDate(e.target.value)} 
                  className="h-[50px] rounded-xl border-slate-200 text-[15px] text-slate-900 font-medium px-4 focus-visible:ring-primary/20 shadow-none" 
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest px-1">LOCATION</Label>
                <div className="flex gap-2 relative z-50">
                  <div className="relative flex-1 z-50">
                    <Input 
                    placeholder="Studio A / Site" 
                    value={eventLocation} 
                    onChange={e => {
                      setEventLocation(e.target.value);
                      if (e.target.value.length === 0) setLocationSuggestions([]);
                    }} 
                    className="h-[50px] rounded-xl border-slate-200 text-[15px] text-slate-600 font-medium px-4 focus-visible:ring-primary/20 shadow-none placeholder:text-slate-400 placeholder:font-normal" 
                  />
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  )}
                  {locationSuggestions.length > 0 && eventLocation.length > 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                      {locationSuggestions.map((suggestion: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b last:border-0 truncate"
                          onClick={() => {
                            setEventLocation(suggestion.display_name);
                            setLocationSuggestions([]);
                          }}
                        >
                          <div className="font-bold flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#E31D3B] shrink-0" />
                            <span className="truncate">{suggestion.display_name.split(',')[0]}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate ml-[22px]">
                            {suggestion.display_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-[50px] w-[50px] p-0 flex items-center justify-center shrink-0 rounded-xl border-slate-200 hover:bg-slate-50" 
                    onClick={() => setIsMapPickerOpen(true)}
                    title="Open Interactive Map"
                  >
                     <MapPin className="w-5 h-5 text-[#E31D3B]" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
               <Label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest px-1">OPERATIONAL NOTES</Label>
               <Input 
                  placeholder="Special instructions or gear required..." 
                  value={eventNotes} 
                  onChange={e => setEventNotes(e.target.value)} 
                  className="h-[52px] rounded-xl border-slate-200 text-[15px] text-slate-600 font-medium px-4 focus-visible:ring-primary/20 shadow-none placeholder:text-slate-400 placeholder:font-normal" 
               />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
               <DialogClose asChild>
                 <Button variant="outline" className="w-full h-[54px] rounded-xl text-[15px] font-bold border-slate-200 text-slate-900 hover:bg-slate-50 hover:text-slate-900 shadow-none">
                   Cancel
                 </Button>
               </DialogClose>
               <Button onClick={handleCreateSchedule} className="w-full h-[54px] rounded-xl bg-[#E31D3B] hover:bg-[#C91A34] text-white text-[15px] font-bold shadow-sm transition-colors">
                 Deploy to Calendar
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="max-md rounded-3xl p-8"><DialogHeader><DialogTitle>Assign Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Task Title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="h-12" />
            <Select value={assignedToId} onValueChange={setAssignedToId}><SelectTrigger className="h-12"><SelectValue placeholder="Assignee" /></SelectTrigger><SelectContent>{staffList?.map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select>
            <Button onClick={handleCreateTask} className="w-full h-12 bg-primary text-white font-bold">Assign Mission</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMapPickerOpen} onOpenChange={setIsMapPickerOpen}>
        <DialogContent className="max-w-[800px] w-[90vw] p-0 border-none bg-transparent shadow-none [&>button]:hidden sm:rounded-xl">
           <MapPicker 
             onLocationSelect={(addr) => {
               setEventLocation(addr);
               setIsMapPickerOpen(false);
             }} 
             onCancel={() => setIsMapPickerOpen(false)} 
           />
        </DialogContent>
      </Dialog>
    </>
  );
}
