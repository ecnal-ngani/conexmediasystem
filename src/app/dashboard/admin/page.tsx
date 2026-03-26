'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  Trophy, 
  Zap,
  Users,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Camera,
  Calendar,
  UserMinus,
  AlertTriangle,
  ClipboardList,
  Timer,
  Check
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth-context';

const ROLE_MAPPINGS: Record<string, string> = {
  "ADMIN": "AD",
  "BRAND_MANAGER": "BM",
  "VIDEOGRAPHER": "VG",
  "EDITOR": "ED",
  "INTERN": "IN"
};

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('EDITOR');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  
  // Task state
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [taskTarget, setTaskTarget] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [taskCategory, setTaskCategory] = useState('Operations');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskHours, setTaskHours] = useState('');

  const { toast } = useToast();
  const firestore = useFirestore();

  // Users Query
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('systemId', 'asc'));
  }, [firestore]);
  const { data: staff, loading } = useCollection<any>(usersQuery);

  // Verifications Query
  const verificationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'verifications'), orderBy('timestamp', 'desc'));
  }, [firestore]);
  const { data: verifications, loading: vLoading } = useCollection<any>(verificationsQuery);

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    return staff.filter(emp => 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.systemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staff, searchQuery]);

  const generatedId = useMemo(() => {
    if (!staff) return "CX-LOAD-00";
    const code = ROLE_MAPPINGS[selectedRole] || "ST";
    const existingCount = staff.filter((emp: any) => emp.role === selectedRole).length;
    const nextNum = (existingCount + 1).toString().padStart(2, '0');
    return `CX-${code}-${nextNum}`;
  }, [selectedRole, staff]);

  const handleCreateUser = () => {
    if (!firestore || !newUserName || !newUserEmail) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name and Email are required." });
      return;
    }

    const usersRef = collection(firestore, 'users');
    const userData = {
      systemId: generatedId,
      name: newUserName,
      email: newUserEmail.toLowerCase(),
      role: selectedRole,
      status: 'Offline',
      points: 0,
      xp: 0,
      badges: [],
      createdAt: serverTimestamp(),
      avatarUrl: `https://picsum.photos/seed/${generatedId}/200/200`
    };

    addDoc(usersRef, userData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: usersRef.path,
        operation: 'create',
        requestResourceData: userData
      }));
    });

    toast({
      title: "Personnel Enrolled",
      description: `${newUserName} (${generatedId}) has been added to the secure database.`,
    });
    
    setIsGenerateOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleCreateTask = () => {
    if (!firestore || !taskTarget || !taskTitle || !taskDueDate || !currentUser) return;

    const tasksRef = collection(firestore, 'tasks');
    const taskData = {
      title: taskTitle,
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDueDate,
      hours: taskHours || '0h',
      status: 'pending',
      assignedToId: taskTarget.id,
      assignedToName: taskTarget.name,
      assignedById: currentUser.id,
      assignedByName: currentUser.name,
      createdAt: serverTimestamp()
    };

    addDoc(tasksRef, taskData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tasksRef.path,
        operation: 'create',
        requestResourceData: taskData
      }));
    });

    toast({
      title: "Directive Deployed",
      description: `Task assigned to ${taskTarget.name} with command priority ${taskPriority}.`,
    });

    setIsTaskOpen(false);
    setTaskTitle('');
    setTaskHours('');
    setTaskTarget(null);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    
    deleteDoc(userRef)
      .then(() => {
        toast({
          title: "Personnel Terminated",
          description: `${userName} has been removed from the secure database.`,
        });
      })
      .catch(async (e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'delete'
        }));
      });
  };

  const matrixStats = useMemo(() => {
    if (!staff) return { total: 0, active: 0 };
    return {
      total: staff.length,
      active: staff.filter((s: any) => s.status !== 'Offline').length
    };
  }, [staff]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Operations Command</h1>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-11 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-red-100 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll New Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[440px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
              <div className="p-8 space-y-6">
                <DialogHeader className="space-y-2">
                  <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Personnel Enrollment</DialogTitle>
                  <p className="text-sm text-slate-500">Assign clearance and system ID to new personnel.</p>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</Label>
                    <Input placeholder="Enter full name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Corporate Email</Label>
                    <Input placeholder="email@conex.private" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(ROLE_MAPPINGS).map((role) => (
                            <SelectItem key={role} value={role}>{role.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">ID Preview</p>
                      <p className="text-lg font-bold text-primary">{generatedId}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <DialogClose asChild>
                    <Button variant="outline" className="h-12 font-bold rounded-xl border-slate-200">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateUser} className="h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl text-white shadow-lg shadow-red-100">
                    Enroll Personnel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Personnel', value: matrixStats.total, icon: Users, color: 'text-slate-900' },
          { label: 'Active Today', value: matrixStats.active, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Security Clearance', value: 'Level 4', icon: ShieldCheck, color: 'text-blue-600' },
          { label: 'Hub Status', value: 'Nominal', icon: Zap, color: 'text-orange-500' },
        ].map((kpi, i) => (
          <Card key={i} className="border shadow-none rounded-xl bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color} opacity-40`} />
              </div>
              <h3 className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl h-12 w-fit">
          <TabsTrigger value="staff" className="rounded-lg font-bold text-xs h-10 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" />
            Staff Management
          </TabsTrigger>
          <TabsTrigger value="biometric" className="rounded-lg font-bold text-xs h-10 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Camera className="w-4 h-4 mr-2" />
            Biometric Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          <div className="relative group max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by name, ID, or role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 shadow-sm focus-visible:ring-primary w-full"
            />
          </div>

          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-0">
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 pl-6 whitespace-nowrap">System ID</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Role</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Badges</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium">
                        No personnel matches the current query.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((emp) => (
                      <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors border-0">
                        <TableCell className="py-4 pl-6 font-mono text-[10px] font-bold text-slate-500 whitespace-nowrap">
                          {emp.systemId}
                        </TableCell>
                        <TableCell className="py-4 font-bold text-slate-900 whitespace-nowrap">
                          {emp.name}
                        </TableCell>
                        <TableCell className="py-4 text-xs text-slate-500 whitespace-nowrap font-medium">
                          {emp.role.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="py-4 text-center whitespace-nowrap">
                          <Badge className={cn(
                            "text-[9px] font-bold px-2 py-0.5 border-none",
                            emp.status === 'Office' ? "bg-green-50 text-green-600" :
                            emp.status === 'WFH' ? "bg-orange-50 text-orange-600" :
                            "bg-slate-50 text-slate-400"
                          )}>
                            {emp.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {(emp.badges || []).map((badge: string, idx: number) => (
                              <div key={idx} className="w-6 h-6 rounded bg-orange-50 border border-orange-100 flex items-center justify-center text-[10px] shadow-sm">
                                {badge === '🏆' ? <Trophy className="w-3 h-3 text-orange-500" /> : <Zap className="w-3 h-3 text-orange-500" />}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right pr-6 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
                              onClick={() => {
                                setTaskTarget(emp);
                                setIsTaskOpen(true);
                              }}
                            >
                              <ClipboardList className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                                <AlertDialogHeader>
                                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                                    <AlertTriangle className="w-6 h-6" />
                                  </div>
                                  <AlertDialogTitle className="text-xl font-black text-slate-900">Terminate Personnel?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-500">
                                    You are about to remove <strong>{emp.name}</strong> ({emp.systemId}) from the CONEX MEDIA secure database. 
                                    This action will immediately revoke all network privileges and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2 sm:gap-0">
                                  <AlertDialogCancel className="rounded-xl h-11 border-slate-200">Cancel Protocol</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(emp.id, emp.name)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11"
                                  >
                                    Confirm Termination
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="biometric" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vLoading ? (
              <div className="col-span-full h-60 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !verifications || verifications.length === 0 ? (
              <div className="col-span-full h-60 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Camera className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No biometric records found.</p>
              </div>
            ) : (
              verifications.map((log) => (
                <Card key={log.id} className="overflow-hidden border-2 hover:border-primary/20 transition-all shadow-sm group">
                  <div className="aspect-video relative bg-black overflow-hidden">
                    <img 
                      src={log.photoUrl} 
                      alt={`Verification for ${log.userName}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500 text-white border-none shadow-lg">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        VERIFIED
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{log.userName}</h4>
                        <p className="text-[10px] font-mono font-bold text-slate-400">{log.userSystemId}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPP p') : 'Recent'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <Zap className="w-3 h-3 text-primary" />
                        Confidence Score: {(log.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* CONTEXTUAL TASK DIALOG */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="max-w-[440px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          {taskTarget && (
            <div className="p-8 space-y-6">
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-red-100">
                    <ClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Assign Task</DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 font-medium">Issuing directive to {taskTarget.name}.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Directive Title</Label>
                  <Input 
                    placeholder="Enter mission objective" 
                    value={taskTitle} 
                    onChange={(e) => setTaskTitle(e.target.value)} 
                    className="h-11 rounded-xl" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Command Priority</Label>
                    <Select value={taskPriority} onValueChange={(val: any) => setTaskPriority(val)}>
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
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category</Label>
                    <Select value={taskCategory} onValueChange={setTaskCategory}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Post-Production">Post-Production</SelectItem>
                        <SelectItem value="Field Shoot">Field Shoot</SelectItem>
                        <SelectItem value="Internal Support">Internal Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Due Date</Label>
                    <Input 
                      type="date" 
                      value={taskDueDate} 
                      onChange={(e) => setTaskDueDate(e.target.value)} 
                      className="h-11 rounded-xl" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                      <Timer className="w-3 h-3 text-primary" />
                      Hours
                    </Label>
                    <Input 
                      placeholder="e.g. 3h" 
                      value={taskHours} 
                      onChange={(e) => setTaskHours(e.target.value)} 
                      className="h-11 rounded-xl" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsTaskOpen(false)} className="h-12 font-bold rounded-xl border-slate-200">Cancel</Button>
                <Button onClick={handleCreateTask} className="h-12 bg-primary hover:bg-primary/90 font-bold rounded-xl text-white shadow-lg shadow-red-100">
                  Deploy Directive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
