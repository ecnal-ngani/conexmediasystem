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
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
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
                <button key={i} onClick={() => { setIsActionsOpen(false); if(action.action === 'project') setIsProjectOpen(true); else if(action.action === 'task') setIsTaskOpen(true); else if(action.href) router.push(action.href); }} className="p-4 bg-white border rounded-xl hover:border-primary">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", action.bg)}><action.icon className={cn("w-4 h-4", action.color)} /></div>
                  <h4 className="text-sm font-bold">{action.title}</h4>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-8"><DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={projectBrandId} onValueChange={setProjectBrandId}><SelectTrigger className="h-12"><SelectValue placeholder="Brand" /></SelectTrigger><SelectContent>{brands?.map((b: any) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}</SelectContent></Select>
            <Input placeholder="Idea" value={contentIdea} onChange={e => setContentIdea(e.target.value)} className="h-12" />
            <Button onClick={handleCreateProject} className="w-full h-12 bg-primary text-white font-bold">Add to Hub</Button>
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
    </>
  );
}
