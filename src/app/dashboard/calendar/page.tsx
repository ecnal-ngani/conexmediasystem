'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const MapPicker = dynamic(() => import('@/components/map-picker'), { ssr: false });
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Loader2,
  Layers,
  CheckCircle2,
  Plus,
  Zap,
  Trash2,
  Building2,
  Check,
  MapPin
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
  const { user } = useAuth();
  const [viewDate, setViewDate] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [editingDate, setEditingDate] = useState('');

  const [eventType, setEventType] = useState<string>('Shoot');
  const [customEventType, setCustomEventType] = useState('');
  const [eventPriority, setEventPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [eventNotes, setEventNotes] = useState('');

  useEffect(() => {
    setMounted(true);
    setViewDate(new Date());
  }, []);

  // OpenStreetMap Location Autocomplete
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (eventLocation && eventLocation.length > 2 && isAddEventOpen) {
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
  }, [eventLocation, isAddEventOpen]);

  useEffect(() => {
    if (selectedEvent) {
      setEditingDate(selectedEvent.date || selectedEvent.dueDate || '');
    }
  }, [selectedEvent]);

  // Gated queries
  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'schedules'), orderBy('date', 'asc'));
  }, [firestore, user]);
  const { data: schedules } = useCollection<any>(schedulesQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'projects'), orderBy('dueDate', 'asc'));
  }, [firestore, user]);
  const { data: projects } = useCollection<any>(projectsQuery);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'tasks'), orderBy('dueDate', 'asc'));
  }, [firestore, user]);
  const { data: allTasks } = useCollection<any>(tasksQuery);

  const brandsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'brands'), orderBy('name', 'asc'));
  }, [firestore, user]);
  const { data: brands } = useCollection<any>(brandsQuery);

  // Filter tasks for privacy
  const tasks = useMemo(() => {
    if (!allTasks || !user) return [];
    if (user.role === 'ADMIN' || user.role === 'BRAND_MANAGER') {
      return allTasks.filter(t => t.assignedToId === user.id || t.assignedById === user.id);
    }
    return allTasks.filter(t => t.assignedToId === user.id);
  }, [allTasks, user]);

  const nextMonth = () => {
    if (viewDate) setViewDate(addMonths(viewDate, 1));
  };
  const prevMonth = () => {
    if (viewDate) setViewDate(subMonths(viewDate, 1));
  };

  const matrixData = useMemo(() => {
    const activeProjects = projects?.filter(p => p.status !== 'Approved' && p.status !== 'Done') || [];
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
    const resolvedType = eventType === 'Custom' ? customEventType.trim() : eventType;
    if (!firestore || !selectedBrandId || !eventDate || !resolvedType) {
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
      title: `${resolvedType}: ${brand.name}`,
      type: resolvedType,
      priority: eventPriority,
      client: brand.name,
      brandId: selectedBrandId,
      date: eventDate,
      location: eventLocation,
      notes: eventNotes,
      assignedById: user.id,
      assignedByName: user.name,
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
    setSelectedBrandId(''); setEventDate(''); setEventLocation(''); setEventNotes('');
  };

  const handleDeleteEvent = () => {
    if (!firestore || !selectedEvent || !selectedEvent.id) return;

    let collectionName = '';
    switch (selectedEvent.source) {
      case 'schedule': collectionName = 'schedules'; break;
      case 'production': collectionName = 'projects'; break;
      case 'task': collectionName = 'tasks'; break;
      default: return;
    }

    const docRef = doc(firestore, collectionName, selectedEvent.id);
    deleteDoc(docRef).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });

    toast({ title: "Event Terminated", description: `The record has been purged.` });
    setSelectedEvent(null);
  };

  const handleCompleteTask = (taskId: string, title: string) => {
    if (!firestore) return;
    const taskRef = doc(firestore, 'tasks', taskId);
    const updateData = { 
      status: 'completed',
      updatedAt: serverTimestamp()
    };
    updateDoc(taskRef, updateData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: taskRef.path,
        operation: 'update',
        requestResourceData: updateData
      }));
    });
    toast({ title: "Task Synchronized", description: `${title} marked as completed.` });
    setSelectedEvent(null);
  };

  const handleCompleteProject = (projectId: string, brand: string) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    const updateData = { 
      status: 'Done',
      updatedAt: serverTimestamp()
    };
    updateDoc(projectRef, updateData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: projectRef.path,
        operation: 'update',
        requestResourceData: updateData
      }));
    });
    toast({ title: "Mission Accomplished", description: `${brand} project marked as Done.` });
    setSelectedEvent(null);
  };

  const renderCalendarDays = () => {
    if (!mounted || !viewDate) return null;
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
        <div 
          key={i} 
          onClick={() => setSelectedDate(dateStr)}
          className={cn(
            "aspect-square p-1.5 md:p-2 bg-white border rounded-lg flex flex-col group relative transition-all cursor-pointer", 
            isToday ? "border-primary border-2 shadow-sm" : "border-slate-100 hover:border-primary/30",
            selectedDate === dateStr ? "bg-primary/5 ring-1 ring-primary/20" : ""
          )}
        >
          <span className={cn("text-[9px] md:text-[10px] font-bold mb-1", isToday ? "text-primary" : "text-slate-400")}>{i}</span>
          
          {/* Desktop: Full Labels */}
          <div className="hidden md:flex flex-col gap-1 w-full flex-1 overflow-y-auto custom-scrollbar">
            {dayScheds.map((s, idx) => (
              <button key={`s-${idx}`} onClick={(e) => { e.stopPropagation(); setSelectedEvent({...s, source: 'schedule'}); }} className={cn("w-full text-left truncate text-[8px] font-black uppercase py-0.5 px-1 rounded text-white", s.priority === 'URGENT' ? 'bg-red-600' : s.priority === 'HIGH' ? 'bg-orange-500' : 'bg-primary')}>{s.title}</button>
            ))}
            {dayProjs.sort((a,b) => (a.status === 'Approved' || a.status === 'Done' ? 1 : 0) - (b.status === 'Approved' || b.status === 'Done' ? 1 : 0)).map((p, idx) => (
              <button key={`p-${idx}`} onClick={(e) => { e.stopPropagation(); setSelectedEvent({...p, source: 'production'}); }} className={cn("w-full text-left truncate text-[8px] font-black uppercase py-0.5 px-1 rounded text-white", (p.status === 'Approved' || p.status === 'Done') ? 'bg-green-600' : 'bg-blue-600')}>PROD: {p.brand}</button>
            ))}
            {dayTasks.sort((a,b) => (a.status === 'completed' ? 1 : 0) - (b.status === 'completed' ? 1 : 0)).map((t, idx) => (
              <button key={`t-${idx}`} onClick={(e) => { e.stopPropagation(); setSelectedEvent({...t, source: 'task'}); }} className={cn("w-full text-left truncate text-[8px] font-black uppercase py-0.5 px-1 rounded text-white", t.status === 'completed' ? 'bg-green-600' : (t.priority === 'URGENT' ? 'bg-red-600' : 'bg-slate-700'))}>TASK: {t.title}</button>
            ))}
          </div>

          {/* Mobile: Status Dots */}
          <div className="flex md:hidden flex-wrap gap-0.5 mt-auto">
            {dayScheds.map((s, idx) => (
              <div key={`sd-${idx}`} className={cn("w-1.5 h-1.5 rounded-full", s.priority === 'URGENT' ? 'bg-red-600' : s.priority === 'HIGH' ? 'bg-orange-500' : 'bg-primary')} />
            ))}
            {dayProjs.sort((a,b) => (a.status === 'Approved' || a.status === 'Done' ? 1 : 0) - (b.status === 'Approved' || b.status === 'Done' ? 1 : 0)).map((p, idx) => (
              <div key={`pd-${idx}`} className={cn("w-1.5 h-1.5 rounded-full", (p.status === 'Approved' || p.status === 'Done') ? 'bg-green-600' : 'bg-blue-600')} />
            ))}
            {dayTasks.sort((a,b) => (a.status === 'completed' ? 1 : 0) - (b.status === 'completed' ? 1 : 0)).map((t, idx) => (
              <div key={`td-${idx}`} className={cn("w-1.5 h-1.5 rounded-full", t.status === 'completed' ? 'bg-green-600' : (t.priority === 'URGENT' ? 'bg-red-600' : 'bg-slate-700'))} />
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  if (!mounted) return null;

  return (
    <div className="w-full space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Operations Command</h1>
        
        {user?.role !== 'INTERN' && (
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 font-bold h-10 px-6 rounded-xl shadow-lg shadow-red-100 text-white gap-2">
                <Plus className="w-4 h-4" />
                Create New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[480px] p-0 rounded-[32px] overflow-hidden border-none shadow-2xl">
              <ScrollArea className="max-h-[90vh]">
                <div className="p-6 md:p-10 space-y-8">
                  <DialogHeader className="flex flex-row items-start gap-5 space-y-0">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-xl shadow-red-100">
                      <CalendarIcon className="w-7 h-7 text-white" />
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
                        <Select value={eventType} onValueChange={(val: any) => { setEventType(val); if (val !== 'Custom') setCustomEventType(''); }}>
                          <SelectTrigger className="h-14 border-slate-200 rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Shoot">Shoot</SelectItem>
                            <SelectItem value="Meeting">Meeting</SelectItem>
                            <SelectItem value="Deadline">Deadline</SelectItem>
                            <SelectItem value="Custom" className="text-primary font-semibold">✏ Custom...</SelectItem>
                          </SelectContent>
                        </Select>
                        {eventType === 'Custom' && (
                          <Input
                            autoFocus
                            placeholder="e.g. Product Launch, BTS..."
                            value={customEventType}
                            onChange={e => setCustomEventType(e.target.value)}
                            className="mt-2 h-12 border-primary border-2 rounded-2xl text-sm font-medium px-4 focus-visible:ring-0 placeholder:font-normal"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-primary" />
                          Priority
                        </Label>
                        <Select value={eventPriority} onValueChange={(val: any) => setEventPriority(val)}>
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
                        <div className="flex gap-2 relative">
                          <div className="relative flex-1">
                            <Input 
                              placeholder="Studio A / Site" 
                              value={eventLocation} 
                              onChange={(e) => {
                                setEventLocation(e.target.value);
                                if (e.target.value.length === 0) setLocationSuggestions([]);
                              }}
                              className="h-14 border-slate-200 rounded-2xl"
                            />
                            {isSearchingLocation && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              </div>
                            )}
                            {locationSuggestions.length > 0 && eventLocation.length > 2 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                {locationSuggestions.map((suggestion: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer text-sm text-slate-700 border-b last:border-0"
                                    onClick={() => {
                                      setEventLocation(suggestion.display_name);
                                      setLocationSuggestions([]);
                                    }}
                                  >
                                    <div className="font-bold flex items-center gap-2">
                                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span className="truncate">{suggestion.display_name.split(',')[0]}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate ml-[22px]">{suggestion.display_name}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-14 w-14 p-0 flex items-center justify-center shrink-0 rounded-2xl border-slate-200 hover:bg-slate-50"
                            onClick={() => setIsMapPickerOpen(true)}
                            title="Open Interactive Map"
                          >
                            <MapPin className="w-5 h-5 text-primary" />
                          </Button>
                        </div>
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
                        onClick={handleCreateEvent}
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
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="flex flex-row items-center justify-between bg-white border rounded-t-xl py-4 px-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-bold">{viewDate ? format(viewDate, 'MMMM yyyy') : 'Loading...'}</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="bg-white border-x border-b rounded-b-xl p-3 md:p-6 shadow-sm">
              <div className="grid grid-cols-7 gap-1 md:gap-4 text-center mb-4 md:mb-6">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => <span key={idx} className="text-[10px] font-black uppercase tracking-widest text-slate-400">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1 md:gap-4">{renderCalendarDays()}</div>
              
              {/* Mobile Agenda View (Visible when a day is tapped) */}
              {selectedDate && (
                <div className="mt-8 md:hidden animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Agenda: {selectedDate}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="h-6 text-[9px] font-bold">Clear Selection</Button>
                  </div>
                  <div className="space-y-2">
                    {[
                      ...(schedules?.filter(s => s.date === selectedDate).map(s => ({...s, source: 'schedule'})) || []),
                      ...(projects?.filter(p => p.dueDate === selectedDate).map(p => ({...p, source: 'production'})) || []),
                      ...(tasks?.filter(t => t.dueDate === selectedDate).map(t => ({...t, source: 'task'})) || [])
                    ].length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4 italic">No missions found for this date.</p>
                    ) : [
                      ...(schedules?.filter(s => s.date === selectedDate).map(s => ({...s, source: 'schedule'})) || []),
                      ...(projects?.filter(p => p.dueDate === selectedDate).map(p => ({...p, source: 'production'})) || []),
                      ...(tasks?.filter(t => t.dueDate === selectedDate).map(t => ({...t, source: 'task'})) || [])
                    ].map((evt, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedEvent(evt)}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 active:scale-[0.98] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            evt.source === 'schedule' ? (evt.priority === 'URGENT' ? 'bg-red-600' : 'bg-primary') :
                            evt.source === 'production' ? 'bg-blue-600' : 'bg-slate-700'
                          )} />
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900 truncate max-w-[180px]">{evt.title || evt.brand}</span>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{evt.source}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-none rounded-xl bg-white h-fit">
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
                  <div key={task.id} onClick={() => setSelectedEvent({...task, source: 'task'})} className={cn("p-4 border rounded-xl shadow-sm transition-all cursor-pointer group", task.status === 'completed' ? "bg-green-50 border-green-200" : "bg-white border-slate-100 hover:border-primary/20")}>
                    <div className="flex justify-between mb-2">
                      <h4 className={cn("text-xs font-bold truncate max-w-[70%] transition-colors", task.status === 'completed' ? "text-green-800" : "text-slate-800 group-hover:text-primary")}>{task.title}</h4>
                      <Badge variant="outline" className={cn("text-[8px]", task.status === 'completed' ? "bg-green-600 text-white border-none" : (task.priority === 'URGENT' ? "text-red-600" : "text-blue-600"))}>{task.status === 'completed' ? 'DONE' : task.priority}</Badge>
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-slate-400"><span className={task.status === 'completed' ? "text-green-600 font-bold" : ""}>{task.status === 'completed' ? '✓ SYNCHRONIZED' : 'TASK'}</span><span>{task.dueDate}</span></div>
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
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-[480px] p-8 rounded-3xl border-none shadow-2xl">
          {selectedEvent && (
            <div className="space-y-6">
              <DialogHeader className="flex flex-row items-center gap-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", selectedEvent.status === 'completed' ? 'bg-green-600' : (selectedEvent.source === 'production' ? 'bg-blue-600' : 'bg-primary'))}>
                  {selectedEvent.status === 'completed' ? <CheckCircle2 className="w-6 h-6 text-white" /> : (selectedEvent.source === 'production' ? <Layers className="w-6 h-6 text-white" /> : <CalendarIcon className="w-6 h-6 text-white" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl font-black text-slate-900 truncate">{selectedEvent.title || selectedEvent.brand}</DialogTitle>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedEvent.source} Briefing</p>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-1"><p className="text-[10px] uppercase font-black text-slate-400">Priority</p><Badge className={cn("text-[10px] font-black px-2 py-1 rounded", selectedEvent.status === 'completed' ? "bg-green-50 text-green-600 border-green-100" : (selectedEvent.priority === 'URGENT' || selectedEvent.priority === 'RUSH' ? "bg-red-50 text-red-500 border-red-100" : "bg-blue-50 text-blue-500 border-blue-100"))} variant="outline">{selectedEvent.status === 'completed' ? 'DONE' : (selectedEvent.priority || 'NORMAL')}</Badge></div>
                <div className="space-y-1"><p className="text-[10px] uppercase font-black text-slate-400">Date</p>{user?.role === 'ADMIN' ? (<Input type="date" value={editingDate} onChange={(e) => setEditingDate(e.target.value)} className="h-8 text-xs font-bold border-slate-200 mt-1" />) : (<p className="text-xs font-bold text-slate-700">{selectedEvent.date || selectedEvent.dueDate}</p>)}</div>
                {selectedEvent.location && (<div className="space-y-1 col-span-2"><p className="text-[10px] uppercase font-black text-slate-400">Location</p><p className="text-xs font-bold text-slate-700">{selectedEvent.location}</p></div>)}
                <div className="space-y-1 col-span-2"><p className="text-[10px] uppercase font-black text-slate-400">Status</p><Badge variant="secondary" className={cn("uppercase font-black text-[10px]", selectedEvent.status === 'completed' ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700")}>{selectedEvent.status || 'PENDING'}</Badge></div>
              </div>
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
                {selectedEvent.source === 'task' && selectedEvent.status !== 'completed' && (<Button onClick={() => handleCompleteTask(selectedEvent.id, selectedEvent.title)} className="w-full h-12 font-bold rounded-xl gap-2 bg-green-600 text-white shadow-lg shadow-green-100"><Check className="w-4 h-4" />MARK AS DONE</Button>)}
                {selectedEvent.source === 'production' && selectedEvent.status !== 'Done' && selectedEvent.status !== 'Approved' && (<Button onClick={() => handleCompleteProject(selectedEvent.id, selectedEvent.brand)} className="w-full h-12 font-bold rounded-xl gap-2 bg-green-600 text-white shadow-lg shadow-green-100"><Check className="w-4 h-4" />MARK AS DONE</Button>)}
                <Button onClick={() => setSelectedEvent(null)} variant="outline" className="w-full h-12 font-bold rounded-xl">Close Briefing</Button>
                {user?.role === 'ADMIN' && (<Button onClick={handleDeleteEvent} variant="destructive" className="w-full h-12 font-bold rounded-xl gap-2 shadow-lg shadow-red-100"><Trash2 className="w-4 h-4" />Terminate Event</Button>)}
              </div>
            </div>
          )}
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
    </div>
  );
}
