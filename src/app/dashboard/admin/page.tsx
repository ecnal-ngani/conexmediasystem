'use client';

/**
 * Admin Hub: Staff Management & Tasking
 * 
 * Allows Administrators to:
 * 1. Enroll new staff members and generate system IDs.
 * 2. Manage high-security internal Security Tokens.
 * 3. Assign tasks (directives) to personnel.
 * 4. View attendance and biometric logs with Visual ID.
 */

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  UserPlus, 
  Loader2, 
  Users, 
  UserMinus, 
  ClipboardList, 
  RefreshCcw,
  Key,
  Eye,
  Camera,
  ShieldCheck
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
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Helper mapping for generating System IDs based on role
const ROLE_CODE_MAPPINGS: Record<string, string> = {
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
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newSecurityToken, setNewSecurityToken] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Task state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTargetUser, setTaskTargetUser] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [taskCategory, setTaskCategory] = useState('Operations');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Biometric Photo state
  const [selectedLogPhoto, setSelectedLogPhoto] = useState<string | null>(null);

  const { toast } = useToast();
  const firestore = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'users'), orderBy('systemId', 'asc'));
  }, [firestore, currentUser]);
  const { data: staff, loading: staffLoading } = useCollection<any>(staffQuery);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, 'verifications'), orderBy('timestamp', 'desc'));
  }, [firestore, currentUser]);
  const { data: verifications, loading: historyLoading } = useCollection<any>(historyQuery);

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    const q = searchQuery.toLowerCase();
    return staff.filter(emp => 
      emp.name.toLowerCase().includes(q) ||
      emp.systemId.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q)
    );
  }, [staff, searchQuery]);

  const nextSystemId = useMemo(() => {
    if (!staff) return "CX-LOAD-00";
    const code = ROLE_CODE_MAPPINGS[selectedRole] || "ST";
    const roleCount = staff.filter((emp: any) => emp.role === selectedRole).length;
    const sequenceNum = (roleCount + 1).toString().padStart(2, '0');
    return `CX-${code}-${sequenceNum}`;
  }, [selectedRole, staff]);

  const handleEnrollStaff = () => {
    if (!firestore || !newUserName || !newUserEmail || !newSecurityToken) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name, Email, and Security Token are required." });
      return;
    }

    const avatar = PlaceHolderImages.find(img => img.id === 'avatar-user')?.imageUrl || '';

    const usersRef = collection(firestore, 'users');
    const newUserData = {
      systemId: nextSystemId,
      name: newUserName,
      email: newUserEmail.toLowerCase(),
      securityToken: newSecurityToken,
      role: selectedRole,
      status: 'Offline',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      avatarUrl: avatar
    };

    addDoc(usersRef, newUserData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: usersRef.path,
        operation: 'create',
        requestResourceData: newUserData
      }));
    });

    toast({
      title: "Staff Enrolled",
      description: `${newUserName} has been added with ID ${nextSystemId}.`,
    });
    
    setIsEnrollModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewSecurityToken('');
  };

  const handleCreateTask = () => {
    if (!firestore || !taskTargetUser || !taskTitle || !taskDueDate || !currentUser) return;

    const tasksRef = collection(firestore, 'tasks');
    const taskData = {
      title: taskTitle,
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDueDate,
      status: 'pending',
      assignedToId: taskTargetUser.id,
      assignedToName: taskTargetUser.name,
      assignedById: currentUser.id,
      assignedByName: currentUser.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    addDoc(tasksRef, taskData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tasksRef.path,
        operation: 'create',
        requestResourceData: taskData
      }));
    });

    toast({
      title: "Task Assigned",
      description: `Objective assigned to ${taskTargetUser.name}.`,
    });

    setIsTaskModalOpen(false);
    setTaskTitle('');
    setTaskTargetUser(null);
  };

  const handleDeleteStaff = (userId: string, userName: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    
    deleteDoc(userRef).then(() => {
      toast({ title: "Personnel Removed", description: `${userName} has been removed from the registry.` });
    }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'delete'
      }));
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Management</h1>
          {staffLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-300" />}
        </div>
        
        <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto font-bold bg-primary text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Enroll New Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enroll New Personnel</DialogTitle>
              <DialogDescription>Assign system credentials and security token clearance.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="John Doe" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Work Email</Label>
                <Input placeholder="john@conex.private" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Key className="w-3 h-3 text-primary" />
                  Initial Security Token
                </Label>
                <Input placeholder="e.g. CX-9988-ABC" value={newSecurityToken} onChange={(e) => setNewSecurityToken(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(ROLE_CODE_MAPPINGS).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-slate-50 p-2 rounded flex flex-col justify-center border">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">System ID</span>
                  <span className="font-bold text-primary">{nextSystemId}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleEnrollStaff} className="bg-primary text-white font-bold">Enroll</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="bg-white border rounded-xl p-1">
          <TabsTrigger value="staff">Staff Directory</TabsTrigger>
          <TabsTrigger value="attendance">Biometric Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search directory..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 ml-4">
              <RefreshCcw className={cn("w-3 h-3", staffLoading && "animate-spin")} />
              REAL-TIME SYNC ACTIVE
            </div>
          </div>

          <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500">System ID</TableHead>
                  <TableHead className="font-bold text-slate-500">Name</TableHead>
                  <TableHead className="font-bold text-slate-500">Security Token</TableHead>
                  <TableHead className="font-bold text-slate-500">Status</TableHead>
                  <TableHead className="text-right font-bold text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">No personnel found.</TableCell></TableRow>
                ) : (
                  filteredStaff.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs font-bold">{emp.systemId}</TableCell>
                      <TableCell className="font-bold text-slate-900">{emp.name}</TableCell>
                      <TableCell className="font-mono text-[10px] text-slate-400">••••••••</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            emp.status === 'Office' ? "bg-green-500" : 
                            emp.status === 'WFH' ? "bg-orange-500" : "bg-slate-300"
                          )} />
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold uppercase",
                            emp.status === 'Office' ? "text-green-600 bg-green-50 border-green-200" :
                            emp.status === 'WFH' ? "text-orange-600 bg-orange-50 border-orange-200" : "text-slate-400"
                          )}>{emp.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setTaskTargetUser(emp); setIsTaskModalOpen(true); }}>
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600">
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
                                <AlertDialogDescription>Are you sure you want to remove {emp.name} from the registry?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteStaff(emp.id, emp.name)} className="bg-red-600 text-white">Remove</AlertDialogAction>
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
        </TabsContent>

        <TabsContent value="attendance">
           <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-500">Personnel</TableHead>
                  <TableHead className="font-bold text-slate-500">Timestamp</TableHead>
                  <TableHead className="font-bold text-slate-500">Method</TableHead>
                  <TableHead className="text-right font-bold text-slate-500">Visual ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : !verifications || verifications.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400">No logs found.</TableCell></TableRow>
                ) : (
                  verifications.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{log.userName}</span>
                          <span className="text-[10px] text-slate-400">{log.userSystemId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPP p') : 'Pending...'}
                      </TableCell>
                      <TableCell><Badge className="bg-slate-100 text-slate-600 font-bold text-[9px]">BIOMETRIC FEED</Badge></TableCell>
                      <TableCell className="text-right">
                        <button 
                          onClick={() => setSelectedLogPhoto(log.photoUrl)}
                          className="group relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 hover:border-primary transition-colors inline-block"
                        >
                          <img src={log.photoUrl} alt="Visual ID" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Biometric Asset Viewer */}
      <Dialog open={!!selectedLogPhoto} onOpenChange={(open) => !open && setSelectedLogPhoto(null)}>
        <DialogContent className="max-w-[480px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <div className="p-6 md:p-8 space-y-6">
            <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-red-100">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Biometric Asset</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium">Visual identity confirm for secure login.</DialogDescription>
              </div>
            </DialogHeader>

            <div className="aspect-video bg-black rounded-2xl overflow-hidden border-4 border-slate-50 relative">
               {selectedLogPhoto && (
                 <img src={selectedLogPhoto} alt="Capture" className="w-full h-full object-cover" />
               )}
               <div className="absolute bottom-4 left-4">
                  <Badge className="bg-green-600 text-white font-black text-[10px] px-3 gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    AUTHORIZED CAPTURE
                  </Badge>
               </div>
            </div>

            <Button onClick={() => setSelectedLogPhoto(null)} className="w-full h-12 rounded-xl font-bold bg-slate-900 text-white">
              Close Visual ID
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Assignment Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to {taskTargetUser?.name}</DialogTitle>
            <DialogDescription>Define the mission objective and priority level.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objective Title</Label>
              <Input placeholder="Client Video Edit" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={taskPriority} onValueChange={(v: any) => setTaskPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENT">URGENT</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                    <SelectItem value="NORMAL">NORMAL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} className="bg-primary text-white font-bold">Assign Mission</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
