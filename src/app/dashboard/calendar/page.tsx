'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  MapPin,
  Users,
  FileText,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Lightbulb,
  Zap,
  Trash2,
  ShieldAlert,
  Save,
  Building2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  getDay, 
  getDaysInMonth,
  isToday as isTodayFn
} from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/components/auth-context';

export default function CalendarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [viewDate, setViewDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [editingDate, setEditingDate] = useState('');

  const [eventType, setEventType] = useState<'Shoot' | 'Meeting' | 'Deadline'>('Shoot');
  const [eventPriority, setEventPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventNotes, setEventNotes] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setEditingDate(selectedEvent.date || selectedEvent.dueDate || '');
    }
  }, [selectedEvent]);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'schedules'), orderBy('date', 'asc'));
  }, [firestore]);
  const { data: schedules, loading: sLoading } = useCollection<any>(schedulesQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy('dueDate', 'asc'));
  }, [firestore]);
  const { data: projects, loading: pLoading } = useCollection<any>(projectsQuery);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tasks'), orderBy('dueDate', 'asc'));
  }, [firestore]);
  const { data: tasks, loading: tLoading } = useCollection<any>(tasksQuery);

  const brandsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'brands'), orderBy('name', 'asc'));
  }, [firestore]);
  const { data: brands, loading: bLoading } = useCollection<any>(brandsQuery);

  const nextMonth = () => setViewDate(prev => addMonths(prev, 1));
  const prevMonth = () => setViewDate(prev => subMonths(prev, 1));

  const matrixData = useMemo(() => {
    const activeProjects = projects?.filter(p => p.status !== 'Approved') || [];
    const activeTasks = tasks?.filter(t => t.status !== 'completed') || [];
    const activeScheds = schedules || [];

    const urgent = (activeScheds.filter(s => s.priority === 'URGENT').length || 0) + 
                   (activeTasks.filter(t => t.priority === 'URGENT').length) + 
                   (activeProjects.filter(p => p.priority === 'RUSH').length);
    const high = (activeScheds.filter(s => s.priority === 'HIGH').length || 0) + 
                 (activeTasks.filter(t => t.priority === 'HIGH').length);
    const normal = (activeScheds.filter(s => s.priority === 'NORMAL').length || 0) + 
                   (activeTasks.filter(t => t.priority === 'NORMAL').length) +
                   (activeProjects.filter(p => p.priority === 'REGULAR').length);
    
    return { urgent, high, normal, total: activeScheds.length + activeProjects.length + activeTasks.length };
  }, [schedules, projects, tasks]);

  const handleCreateEvent = () => {
    if (!firestore || !selectedBrandId || !eventDate) {
      toast({
        variant: "destructive",
        title: "Incomplete Intel",
        description: "Brand Selection and Date are required for command synchronization."
      });
      return;
    }

    const brand = brands?.find(b => b.id === selectedBrandId);
    if (!brand) return;

    const schedulesRef = collection(firestore, 'schedules');
    const scheduleData = {
      title: `${eventType}: ${brand.name}`,
      type: eventType,
      priority: eventPriority,
      client: brand.name,
      brandId: selectedBrandId,
      date: eventDate,
      location: eventLocation,
      notes: eventNotes,
      createdAt: serverTimestamp()
    };

    addDoc(schedulesRef, scheduleData)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: schedulesRef.path,
          operation: 'create',
          requestResourceData: scheduleData
        }));
      });

    toast({
      title: "Event Synchronized",
      description: `${brand.name} has been added to the master calendar.`
    });

    setIsAddEventOpen(false);
    setSelectedBrandId('');
    setEventDate('');
    setEventLocation('');
    setEventNotes('');
  };

  const handleUpdateEventDate = () => {
    if (!firestore || !selectedEvent || !editingDate) return;

    let collectionName = '';
    let fieldName = 'date';
    switch (selectedEvent.source) {
      case 'schedule': collectionName = 'schedules'; break;
      case 'production': collectionName = 'projects'; fieldName = 'dueDate'; break;
      case 'task': collectionName = 'tasks'; fieldName = 'dueDate'; break;
      default: return;
    }

    const docRef = doc(firestore, collectionName, selectedEvent.id);
    const updateData = { [fieldName]: editingDate, updatedAt: serverTimestamp() };

    updateDoc(docRef, updateData)
      .then(() => {
        toast({
          title: "Event Rescheduled",
          description: "The deployment timeline has been updated."
        });
        setSelectedEvent(null);
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  const handleCompleteTask = (taskId: string, title: string) => {
    if (!firestore) return;
    const taskRef = doc(firestore, 'tasks', taskId);
    const updateData = { 
      status: 'completed',
      updatedAt: serverTimestamp()
    };

    updateDoc(taskRef, updateData)
      .then(() => {
        toast({
          title: "Directive Completed",
          description: `"${title}" has been successfully synchronized as completed.`,
        });
        setSelectedEvent(null);
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: taskRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  const handleDeleteEvent = () => {
    if (!firestore || !selectedEvent || !selectedEvent.id) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Could not identify the record ID for deletion."
      });
      return;
    }

    let collectionName = '';
    switch (selectedEvent.source) {
      case 'schedule': collectionName = 'schedules'; break;
      case 'production': collectionName = 'projects'; break;
      case 'task': collectionName = 'tasks'; break;
      default: 
        toast({ variant: "destructive", title: "Error", description: "Unknown source node." });
        return;
    }

    const docRef = doc(firestore, collectionName, selectedEvent.id);
    
    deleteDoc(docRef).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });

    toast({
      title: "Event Terminated",
      description: `The ${selectedEvent.source} record has been purged from the matrix.`
    });

    setSelectedEvent(null);
  };

  const renderCalendarDays = () => {
    if (!mounted) return null;
    const days = [];
    const daysCount = getDaysInMonth(viewDate);
    const startOffset = getDay(startOfMonth(viewDate));
    
    for (let i = 0; i < startOffset; i++) days.push(<div key={`b-${i}`} className="aspect-square bg-slate-50/50 rounded-lg border border-transparent" />);
    
    for (let i = 1; i <= daysCount; i++) {
      const dateStr = `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const dayScheds = schedules?.filter(s => s.date === dateStr) || [];
      const dayProjs = projects?.filter(p => p.dueDate === dateStr) || [];
      const dayTasks = tasks?.filter(t => t.dueDate === dateStr) || [];
      const isToday = isTodayFn(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

      days.push(
        <div key={i} className={cn("aspect-square p-2 bg-white border rounded-lg flex flex-col group relative overflow-hidden", isToday ? "border-primary border-2 shadow-sm" : "border-slate-100")}>
          <span className={cn("text-[10px] font-bold mb-1", isToday ? "text-primary" : "text-slate-400")}>{i}</span>
          <div className="w-full space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {dayScheds.map((s, idx) => (
              <button key={`s-${idx}`} onClick={() => setSelectedEvent({...s, source: 'schedule'})} className={cn("w-full text-left truncate text-[10px] font-bold py-0.5 px-1.5 rounded text-white", s.priority === 'URGENT' ? 'bg-red-600' : s.priority === 'HIGH' ? 'bg-orange-500' : 'bg-primary')}>{s.title}</button>
            ))}
            {dayProjs.map((p, idx) => (
              <button key={`p-${idx}`} onClick={() => setSelectedEvent({...p, source: 'production'})} className="w-full text-left truncate text-[10px] font-bold py-0.5 px-1.5 rounded bg-blue-600 text-white">PROD: {p.brand}</button>
            ))}
            {dayTasks.map((t, idx) => (
              <button key={`t-${idx}`} onClick={() => setSelectedEvent({...t, source: 'task'})} className={cn("w-full text-left truncate text-[10px] font-bold py-0.5 px-1.5 rounded text-white", t.priority === 'URGENT' ? 'bg-red-600' : 'bg-slate-700')}>TASK: {t.title}</button>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const isAdmin = user?.role === 'ADMIN';
  const canCreateEvents = user?.role !== 'INTERN';

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Operations Command</h1>
        
        {canCreateEvents && (
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 font-bold h-10 px-6 rounded-xl shadow-lg shadow-red-100 text-white gap-2">
                <Plus className="w-4 h-4" />
                Create New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[480px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
              <ScrollArea className="max-h-[90vh]">
                <div className="p-6 md:p-8 space-y-6">
                  <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-red-100">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Event Schedule</DialogTitle>
                      <DialogDescription className="text-slate-400 font-medium">Synchronize a new event with the master calendar.</DialogDescription>
                    </div>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Event Type</Label>
                        <Select value={eventType} onValueChange={(val: any) => setEventType(val)}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Shoot">Shoot</SelectItem>
                            <SelectItem value="Meeting">Meeting</SelectItem>
                            <SelectItem value="Deadline">Deadline</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary" />
                          Priority
                        </Label>
                        <Select value={eventPriority} onValueChange={(val: any) => setEventPriority(val)}>
                          <SelectTrigger className="h-11 rounded-xl">
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

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-primary" />
                        Authorized Brand
                      </Label>
                      <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select authorized client" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands?.map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Event Date</Label>
                        <Input 
                          type="date" 
                          value={eventDate} 
                          onChange={(e) => setEventDate(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location</Label>
                        <Input 
                          placeholder="Studio A / Site" 
                          value={eventLocation} 
                          onChange={(e) => setEventLocation(e.target.value)}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operational Notes</Label>
                      <Input 
                        placeholder="Special instructions or gear required..." 
                        value={eventNotes} 
                        onChange={(e) => setEventNotes(e.target.value)}
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600">Cancel</Button>
                      </DialogClose>
                      <Button 
                        onClick={handleCreateEvent}
                        className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-red-100 text-white"
                      >
                        Deploy to Calendar
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between bg-white border rounded-t-xl py-4 px-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-bold">{mounted ? format(viewDate, 'MMMM yyyy') : 'Loading...'}</CardTitle>
                {(sLoading || pLoading || tLoading) && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="bg-white border-x border-b rounded-b-xl p-6 shadow-sm">
              <div className="grid grid-cols-7 gap-4 text-center mb-6">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-4">{renderCalendarDays()}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-none rounded-xl bg-white overflow-hidden flex flex-col h-fit">
          <CardHeader className="border-b bg-slate-50/30"><CardTitle className="text-base font-bold text-slate-800">Command-Wide Matrix</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-6">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-red-50 p-2 rounded-lg text-center"><p className="text-xl font-bold text-red-600">{matrixData.urgent}</p><p className="text-[9px] font-medium text-red-400 uppercase">Urgent</p></div>
              <div className="bg-orange-50 p-2 rounded-lg text-center"><p className="text-xl font-bold text-orange-600">{matrixData.high}</p><p className="text-[9px] font-medium text-orange-400 uppercase">High</p></div>
              <div className="bg-blue-50 p-2 rounded-lg text-center"><p className="text-xl font-bold text-blue-600">{matrixData.normal}</p><p className="text-[9px] font-medium text-blue-400 uppercase">Normal</p></div>
            </div>
            <ScrollArea className="h-[450px] pr-2">
              <div className="space-y-3">
                {tasks?.map((task: any) => (
                  <div key={task.id} onClick={() => setSelectedEvent({...task, source: 'task'})} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-primary/20 cursor-pointer group">
                    <div className="flex justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-primary truncate max-w-[70%]">{task.title}</h4>
                      <Badge variant="outline" className={cn("text-[8px]", task.priority === 'URGENT' ? "text-red-600" : "text-blue-600")}>{task.priority}</Badge>
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-slate-400">
                      <span>{task.status === 'completed' ? '✓ DONE' : 'TASK'}</span>
                      <span>{task.dueDate}</span>
                    </div>
                  </div>
                ))}
                {projects?.filter(p => p.status !== 'Approved').map((p: any) => (
                  <div key={p.id} onClick={() => setSelectedEvent({...p, source: 'production'})} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 cursor-pointer group">
                    <div className="flex justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate max-w-[70%]">{p.brand}</h4>
                      <Badge variant="outline" className="text-[8px] text-blue-600">{p.priority === 'RUSH' ? 'URGENT' : 'REGULAR'}</Badge>
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-slate-400"><span>PRODUCTION</span><span>{p.dueDate}</span></div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={() => router.push('/dashboard/production')} className="w-full bg-primary font-bold h-11 rounded-xl shadow-lg shadow-red-100 text-white">
              View All Company Tasks
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-[480px] p-8 rounded-3xl border-none shadow-2xl">
          {selectedEvent && (
            <div className="space-y-6">
              <DialogHeader className="flex flex-row items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", selectedEvent.source === 'production' ? 'bg-blue-600' : 'bg-primary')}>
                  {selectedEvent.source === 'production' ? <Layers className="w-6 h-6 text-white" /> : <CalendarIcon className="w-6 h-6 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl font-black text-slate-900 truncate">{selectedEvent.title || selectedEvent.brand}</DialogTitle>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedEvent.source} Briefing</p>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-slate-400">Priority</p>
                  <Badge className={cn(
                    "text-[10px] font-black px-2 py-1 rounded",
                    selectedEvent.priority === 'URGENT' || selectedEvent.priority === 'RUSH' ? "bg-red-50 text-red-500 border-red-100" :
                    selectedEvent.priority === 'HIGH' ? "bg-orange-50 text-orange-500 border-orange-100" :
                    "bg-blue-50 text-blue-500 border-blue-100"
                  )} variant="outline">
                    {selectedEvent.priority || 'NORMAL'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-slate-400">Date</p>
                  {isAdmin ? (
                    <Input 
                      type="date" 
                      value={editingDate} 
                      onChange={(e) => setEditingDate(e.target.value)} 
                      className="h-8 text-xs font-bold border-slate-200 mt-1"
                    />
                  ) : (
                    <p className="text-xs font-bold text-slate-700">{selectedEvent.date || selectedEvent.dueDate}</p>
                  )}
                </div>
                {selectedEvent.location && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-[10px] uppercase font-black text-slate-400">Location</p>
                    <p className="text-xs font-bold text-slate-700">{selectedEvent.location}</p>
                  </div>
                )}
                {selectedEvent.status && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-[10px] uppercase font-black text-slate-400">Status</p>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 uppercase font-black text-[10px]">
                      {selectedEvent.status}
                    </Badge>
                  </div>
                )}
                {selectedEvent.notes && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-[10px] uppercase font-black text-slate-400">Operational Notes</p>
                    <p className="text-xs font-medium text-slate-500 italic">{selectedEvent.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
                {selectedEvent.source === 'task' && selectedEvent.status !== 'completed' && (
                  <Button 
                    onClick={() => handleCompleteTask(selectedEvent.id, selectedEvent.title)} 
                    className="w-full h-12 font-bold rounded-xl gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100"
                  >
                    <Check className="w-4 h-4" />
                    MARK AS DONE
                  </Button>
                )}

                {isAdmin && (
                  <Button 
                    onClick={handleUpdateEventDate} 
                    className="w-full h-12 font-bold rounded-xl gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-100"
                  >
                    <Save className="w-4 h-4" />
                    Save Deployment Update
                  </Button>
                )}

                <Button onClick={() => setSelectedEvent(null)} variant="outline" className="w-full h-12 font-bold rounded-xl">
                  Close Briefing
                </Button>

                {isAdmin && (
                  <Button 
                    onClick={handleDeleteEvent} 
                    variant="destructive" 
                    className="w-full h-12 font-bold rounded-xl gap-2 shadow-lg shadow-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Terminate Event
                  </Button>
                )}
                
                {isAdmin && (
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 mt-2">
                    <ShieldAlert className="w-3 h-3 text-red-500" />
                    Privileged Command Action
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}