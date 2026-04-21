'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Filter, 
  Search,
  Plus,
  FileText,
  Briefcase,
  User,
  Zap,
  Calendar,
  Layers,
  Share2,
  Link as LinkIcon,
  CheckCircle2,
  Lightbulb,
  Loader2,
  XCircle,
  Save,
  Tag,
  Trash2,
  Send
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { useAuth } from '@/components/auth-context';
import { useRouter } from 'next/navigation';

export default function ProductionPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Intern access allowed for submission workflow

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isManageBrandsOpen, setIsManageBrandsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submittingProject, setSubmittingProject] = useState<any>(null);
  const [submissionLink, setSubmissionLink] = useState('');
  
  const firestore = useFirestore();
  const { toast } = useToast();

  const [editingLink, setEditingLink] = useState('');
  const [fileCode, setFileCode] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [contentIdea, setContentIdea] = useState('');
  const [status, setStatus] = useState('In Production');
  const [priority, setPriority] = useState('REGULAR');
  const [artist, setArtist] = useState('');
  const [artistId, setArtistId] = useState('');
  const [type, setType] = useState('Video');
  const [platform, setPlatform] = useState('Instagram');
  const [dueDate, setDueDate] = useState('');
  const [bm, setBm] = useState('');
  const [canvasLink, setCanvasLink] = useState('');

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandPrefix, setNewBrandPrefix] = useState('');

  // MEMOIZED QUERIES for performance stability
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const isManagement = user.role === 'ADMIN' || user.role === 'BRAND_MANAGER';
    return query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'));
    // Note: We filter in-memory for filteredProjects to support complex searching,
    // but we could also add a where clause here if the dataset gets very large.
  }, [firestore, user]);
  const { data: projects, isLoading: loading } = useCollection<any>(projectsQuery);

  const brandsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'brands'), orderBy('name', 'asc'));
  }, [firestore, user]);
  const { data: brands, isLoading: bLoading } = useCollection<any>(brandsQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('name', 'asc'));
  }, [firestore, user]);
  const { data: staffList } = useCollection<any>(usersQuery);

  // Tactical File Code Logic (Memoized calculation via useEffect)
  useEffect(() => {
    if (selectedBrandId && brands && projects) {
      const brand = brands.find(b => b.id === selectedBrandId);
      if (brand) {
        const now = new Date();
        const yy = now.getFullYear().toString().slice(-2);
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const dateStr = `${yy}${mm}${dd}`;
        
        const brandPrefixMatch = `${brand.prefix}-`;
        const brandProjects = projects.filter((p: any) => p.fileCode?.startsWith(brandPrefixMatch));
        
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
  }, [selectedBrandId, brands, projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((project: any) => {
      const isManagement = user?.role === 'ADMIN' || user?.role === 'BRAND_MANAGER';
      const isAssigned = project.artistId === user?.id || project.artist === user?.name || project.assignedById === user?.id;
      
      if (!isManagement && !isAssigned) return false;

      const matchesSearch = 
        (project.fileCode?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (project.brand?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (project.artist?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (project.contentIdea?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
      const matchesType = typeFilter === 'all' || project.type === typeFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [projects, searchQuery, statusFilter, priorityFilter, typeFilter]);

  const handleUpdateStatus = (projectId: string, newStatus: string) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    const updateData = { 
      status: newStatus, 
      updatedAt: serverTimestamp(),
      lastUpdatedBy: user?.name || 'Unknown'
    };

    updateDoc(projectRef, updateData)
      .then(() => {
        toast({ title: "Status Synchronized", description: `Asset status updated to ${newStatus}.` });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: projectRef.path,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext));
      });
  };

  const handleUpdatePriority = (projectId: string, newPriority: string) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    const updateData = { 
      priority: newPriority, 
      updatedAt: serverTimestamp() 
    };
    updateDoc(projectRef, updateData)
      .then(() => {
        toast({ title: "Priority Updated", description: `Priority set to ${newPriority}.` });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: projectRef.path,
          operation: 'update',
          requestResourceData: updateData
        } satisfies SecurityRuleContext));
      });
  };

  const handleAddProject = () => {
    if (!firestore || !fileCode || !selectedBrandId || !artist || !dueDate) {
      toast({ variant: "destructive", title: "Missing Information", description: "Brand, Artist, and Due Date are required." });
      return;
    }
    const brand = brands?.find(b => b.id === selectedBrandId);
    if (!brand) return;
    const projectsRef = collection(firestore, 'projects');
    const projectData = {
      fileCode,
      brand: brand.name,
      brandId: selectedBrandId,
      contentIdea,
      status,
      priority,
      artist,
      artistId,
      assignedById: user.id,
      assignedByName: user.name,
      type,
      platform,
      requestDate: new Date().toISOString().split('T')[0],
      dueDate,
      bm,
      canvasLink,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    addDoc(projectsRef, projectData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: projectsRef.path,
        operation: 'create',
        requestResourceData: projectData
      } satisfies SecurityRuleContext));
    });
    toast({ title: "Project Initialized", description: `${fileCode} has been added.` });
    setIsAddProjectOpen(false);
  };

  const handleAddBrand = () => {
    if (!firestore || !newBrandName || !newBrandPrefix) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name and Prefix are required." });
      return;
    }
    const brandsRef = collection(firestore, 'brands');
    const brandData = {
      name: newBrandName,
      prefix: newBrandPrefix.toUpperCase().slice(0, 3),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    addDoc(brandsRef, brandData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: brandsRef.path,
        operation: 'create',
        requestResourceData: brandData
      } satisfies SecurityRuleContext));
    });
    toast({ title: "Brand Registered", description: `${newBrandName} is authorized.` });
    setNewBrandName('');
    setNewBrandPrefix('');
  };

  const handleDeleteBrand = (brandId: string, brandName: string) => {
    if (!firestore) return;
    const brandRef = doc(firestore, 'brands', brandId);
    deleteDoc(brandRef).then(() => {
      toast({ title: "Brand Removed", description: `${brandName} has been deauthorized.` });
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: brandRef.path,
        operation: 'delete'
      } satisfies SecurityRuleContext));
    });
  };

  const handleUpdateLink = () => {
    if (!firestore || !selectedProject || !editingLink) return;
    const projectRef = doc(firestore, 'projects', selectedProject.id);
    const updates = { canvasLink: editingLink, updatedAt: serverTimestamp() };
    updateDoc(projectRef, updates).then(() => {
      toast({ title: "Asset Link Updated", description: "Destination synchronized." });
      setSelectedProject({ ...selectedProject, canvasLink: editingLink });
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: projectRef.path,
        operation: 'update',
        requestResourceData: updates
      } satisfies SecurityRuleContext));
    });
  };

  const handleDeleteProject = (projectId: string, code: string) => {
    if (!firestore) return;
    const projectRef = doc(firestore, 'projects', projectId);
    deleteDoc(projectRef).then(() => {
      toast({ title: "Project Terminated", description: `${code} purged.` });
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: projectRef.path,
        operation: 'delete'
      } satisfies SecurityRuleContext));
    });
  };

  const handleSubmission = () => {
    if (!firestore || !submittingProject || !submissionLink) return;
    
    const projectRef = doc(firestore, 'projects', submittingProject.id);
    const updates = { 
      submissionLink: submissionLink,
      status: 'For QA',
      updatedAt: serverTimestamp(),
      lastUpdatedBy: user?.name || 'Unknown'
    };

    updateDoc(projectRef, updates).then(() => {
      toast({ 
        title: "Work Submitted", 
        description: `Submission link for ${submittingProject.fileCode} synchronized. Status set to For QA.` 
      });
      setIsSubmitDialogOpen(false);
      setSubmissionLink('');
      setSubmittingProject(null);
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: projectRef.path,
        operation: 'update',
        requestResourceData: updates
      } satisfies SecurityRuleContext));
    });
  };

  const canEditStatus = (project: any) => {
    if (user?.role === 'ADMIN' || user?.role === 'BRAND_MANAGER') return true;
    return project.artistId === user?.id;
  };
  const canTerminate = user?.role === 'ADMIN' || user?.role === 'BRAND_MANAGER';

  return (
    <div className="w-full space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Production Hub</h1>
        <div className="flex items-center gap-2">
           {(statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || searchQuery !== '') && (
             <Button variant="ghost" onClick={() => {setSearchQuery(''); setStatusFilter('all'); setPriorityFilter('all'); setTypeFilter('all');}} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary">
               <XCircle className="w-3 h-3 mr-1" />
               Reset Filters
             </Button>
           )}
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="relative group col-span-1 md:col-span-1 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search code, brand, artist..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full shadow-none border-slate-200 focus-visible:ring-primary text-xs"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 shadow-none border-slate-200 text-xs font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Production">In Production</SelectItem>
              <SelectItem value="For QA">For QA</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Client Revision">Client Revision</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-10 shadow-none border-slate-200 text-xs font-medium">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-slate-400" />
                <SelectValue placeholder="Priority" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="REGULAR">REGULAR</SelectItem>
              <SelectItem value="RUSH">RUSH</SelectItem>
            </SelectContent>
          </Select>

          {user?.role !== 'INTERN' && (
            <div className="flex gap-2 lg:col-span-2">
              <Dialog open={isManageBrandsOpen} onOpenChange={setIsManageBrandsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-10 font-bold border-slate-200 text-xs text-slate-600 flex-1">
                    <Tag className="w-4 h-4 mr-1.5" />
                    Brands
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[440px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
                  <div className="p-8 space-y-6">
                    <DialogHeader className="space-y-2">
                      <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Brand Management</DialogTitle>
                      <DialogDescription className="text-sm text-slate-500 font-medium">Register client brands and tactical prefixes.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Brand Name</Label>
                          <Input placeholder="e.g. CJC Eco Bag" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Prefix</Label>
                          <Input placeholder="CJC" maxLength={3} value={newBrandPrefix} onChange={(e) => setNewBrandPrefix(e.target.value.toUpperCase())} />
                        </div>
                      </div>
                      <Button onClick={handleAddBrand} className="w-full bg-slate-900 text-white font-bold h-11 rounded-xl">
                        Register Brand
                      </Button>
                    </div>

                    <div className="pt-4 border-t space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authorized Brands</Label>
                      <ScrollArea className="h-[200px] pr-2">
                        <div className="space-y-2">
                          {bLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-300" /> : 
                           !brands || brands.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No brands registered.</p> :
                           brands.map((b: any) => (
                             <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <div className="flex items-center gap-2">
                                 <span className="text-xs font-bold text-slate-700">{b.name}</span>
                                 <Badge className="bg-white border-slate-200 text-primary font-mono text-[10px]">{b.prefix}</Badge>
                               </div>
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                   <AlertDialogHeader>
                                     <AlertDialogTitle>Remove Brand</AlertDialogTitle>
                                     <AlertDialogDescription>
                                       Are you sure you want to remove <strong>{b.name}</strong>? This will deauthorize the brand but won't delete existing projects.
                                     </AlertDialogDescription>
                                   </AlertDialogHeader>
                                   <AlertDialogFooter>
                                     <AlertDialogCancel>Cancel</AlertDialogCancel>
                                     <AlertDialogAction onClick={() => handleDeleteBrand(b.id, b.name)} className="bg-red-600 hover:bg-red-700 text-white">Remove</AlertDialogAction>
                                   </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             </div>
                           ))
                          }
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                <DialogTrigger asChild>
                  <Button className="h-10 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-red-100 text-xs text-white flex-1">
                    <Plus className="w-4 h-4 mr-1.5" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[540px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
                  <ScrollArea className="max-h-[90vh]">
                    <div className="p-6 md:p-8 space-y-6">
                      <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-red-100">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Add New Project</DialogTitle>
                          <DialogDescription className="text-slate-400 font-medium">Configure a new production item for the hub.</DialogDescription>
                        </div>
                      </DialogHeader>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                              <Briefcase className="w-3 h-3 text-primary" />
                              Brand Selection
                            </Label>
                            <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                              <SelectTrigger className="h-12 border-slate-200 rounded-xl">
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
                              <FileText className="w-3 h-3 text-primary" />
                              File Code
                            </Label>
                            <Input 
                              placeholder="Generated automatically..." 
                              value={fileCode}
                              onChange={(e) => setFileCode(e.target.value)}
                              className="h-12 border-slate-200 rounded-xl bg-slate-50 font-mono text-xs" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <Lightbulb className="w-3 h-3 text-primary" />
                            Content Idea
                          </Label>
                          <Input placeholder="Product showcase reel" value={contentIdea} onChange={(e) => setContentIdea(e.target.value)} className="h-12 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                              <User className="w-3 h-3 text-primary" />
                              Artist
                            </Label>
                            <Select value={artistId} onValueChange={(val) => {
                              setArtistId(val);
                              const s = staffList?.find(u => u.id === val);
                              if (s) setArtist(s.name);
                            }}>
                              <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                              <SelectContent>
                                {staffList?.map((s: any) => (
                                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-primary" />
                              Due Date
                            </Label>
                            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-12 rounded-xl" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                              <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="In Production">In Production</SelectItem>
                                <SelectItem value="For QA">For QA</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Client Revision">Client Revision</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                              <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="REGULAR">REGULAR</SelectItem>
                                <SelectItem value="RUSH">RUSH</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
                      <div className="flex gap-3 pt-4">
                        <DialogClose asChild><Button variant="outline" className="flex-1 h-12 rounded-xl">Cancel</Button></DialogClose>
                        <Button onClick={handleAddProject} className="flex-1 h-12 rounded-xl bg-primary text-white font-bold">Add to Hub</Button>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-0">
                <TableHead className="text-[10px] font-black uppercase py-4 pl-6">IDEA</TableHead>
                <TableHead className="text-[10px] font-black uppercase py-4">File Code</TableHead>
                <TableHead className="text-[10px] font-black uppercase py-4">Brand</TableHead>
                <TableHead className="text-[10px] font-black uppercase py-4 text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase py-4 text-center">Priority</TableHead>
                <TableHead className="text-[10px] font-black uppercase py-4">Artist</TableHead>
                <TableHead className="text-[10px] font-black uppercase py-4">Request Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase py-4">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-40 text-center text-slate-400">No production items found.</TableCell></TableRow>
              ) : filteredProjects.map((item: any) => (
                <TableRow key={item.id} className={cn("border-0 group transition-colors", (item.status === 'Approved' || item.status === 'Done') && "bg-green-50/80 hover:bg-green-100/80")}>
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedProject(item); setEditingLink(item.canvasLink || ''); }} className="text-primary h-7 text-[10px] font-bold">
                        <LinkIcon className="w-3 h-3 mr-1" /> Link
                      </Button>
                      {user?.role !== 'ADMIN' && user?.role !== 'BRAND_MANAGER' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            setSubmittingProject(item); 
                            setSubmissionLink(item.submissionLink || '');
                            setIsSubmitDialogOpen(true); 
                          }} 
                          className="text-green-600 h-7 text-[10px] font-bold hover:text-green-700 hover:bg-green-50"
                        >
                          <Send className="w-3 h-3 mr-1" /> Submit
                        </Button>
                      )}
                      {canTerminate && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Terminate Project</AlertDialogTitle><AlertDialogDescription>Delete {item.fileCode}?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProject(item.id, item.fileCode)} className="bg-red-600 text-white">Terminate</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] font-bold text-slate-500">{item.fileCode}</TableCell>
                  <TableCell className="py-4 font-bold text-slate-800">{item.brand}</TableCell>
                  <TableCell className="text-center">
                    {canEditStatus(item) ? (
                      <Select value={item.status} onValueChange={(val) => handleUpdateStatus(item.id, val)}>
                        <SelectTrigger className="h-7 text-[8px] font-black uppercase min-w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">PENDING</SelectItem>
                          <SelectItem value="In Production">IN PRODUCTION</SelectItem>
                          <SelectItem value="For QA">FOR QA</SelectItem>
                          <SelectItem value="Approved">APPROVED</SelectItem>
                          <SelectItem value="Client Revision">CLIENT REVISION</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : <Badge variant="outline" className="text-[8px] font-bold uppercase">{item.status}</Badge>}
                  </TableCell>
                  <TableCell className="text-center">
                    {canEditStatus(item) && user?.role !== 'INTERN' ? (
                      <Select value={item.priority} onValueChange={(val) => handleUpdatePriority(item.id, val)}>
                        <SelectTrigger className="h-7 text-[8px] font-black uppercase min-w-[90px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REGULAR">REGULAR</SelectItem>
                          <SelectItem value="HIGH">HIGH</SelectItem>
                          <SelectItem value="URGENT">URGENT</SelectItem>
                          <SelectItem value="RUSH">RUSH</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={cn("text-[8px] font-bold", item.priority === 'RUSH' || item.priority === 'URGENT' ? 'text-red-600 bg-red-50' : 'text-slate-500')}>{item.priority}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-[10px] font-medium text-slate-700">{item.artist}</TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-500">{item.requestDate}</TableCell>
                  <TableCell className="text-[10px] font-bold text-slate-800">{item.dueDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="p-6 sm:p-8 space-y-6">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-primary" />
                </div>
                <DialogTitle className="text-xl font-black tracking-tight text-slate-900">Project Assets</DialogTitle>
              </div>
              <DialogDescription className="font-medium text-slate-500 text-sm leading-relaxed">
                Strategic access to design assets for mission <span className="text-slate-900 font-bold">{selectedProject?.fileCode}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Tactical Destination (Canva)</Label>
              {selectedProject?.canvasLink ? (
                <a 
                  href={selectedProject.canvasLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="grid grid-cols-[3rem_1fr_2rem] items-center gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl group hover:bg-blue-50 transition-all duration-300 w-full overflow-hidden"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-blue-50 group-hover:scale-105 transition-transform">
                    <Share2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-[14px] font-black text-blue-900 mb-0.5 truncate">Open Design Assets</p>
                    <p className="text-[11px] text-blue-500 font-medium truncate opacity-70">{selectedProject.canvasLink}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              ) : (
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                  <p className="text-xs font-bold text-slate-400">No tactical link assigned.</p>
                </div>
              )}
            </div>

            {selectedProject?.submissionLink && (
              <div className="space-y-3 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-green-600">Employee Submission</Label>
                <a 
                  href={selectedProject.submissionLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="grid grid-cols-[3rem_1fr_2rem] items-center gap-4 p-4 bg-green-50/50 border border-green-100 rounded-2xl group hover:bg-green-50 transition-all duration-300 w-full overflow-hidden"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-green-50 group-hover:scale-105 transition-transform">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-[14px] font-black text-green-900 mb-0.5 truncate">View Finished Work</p>
                    <p className="text-[11px] text-green-500 font-medium truncate opacity-70">{selectedProject.submissionLink}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </a>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Update Intelligence</Label>
                {user?.role !== 'ADMIN' && user?.role !== 'BRAND_MANAGER' && (
                  <Badge variant="outline" className="text-[8px] font-black uppercase bg-slate-50 border-slate-200 text-slate-400">Read-Only</Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="New Canva link..." 
                    value={editingLink} 
                    onChange={(e) => setEditingLink(e.target.value)}
                    disabled={user?.role !== 'ADMIN' && user?.role !== 'BRAND_MANAGER'}
                    className="h-12 pl-10 rounded-xl bg-white border-slate-200 focus:ring-primary focus:border-primary text-sm font-medium"
                  />
                </div>
                <Button 
                  onClick={handleUpdateLink}
                  disabled={user?.role !== 'ADMIN' && user?.role !== 'BRAND_MANAGER'}
                  className="h-12 sm:w-12 w-full p-0 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shrink-0 shadow-xl shadow-slate-200/50 transition-all active:scale-95"
                >
                  <Save className="w-5 h-5 sm:block hidden" />
                  <span className="sm:hidden font-bold">Update Link</span>
                </Button>
              </div>
            </div>

            <DialogClose asChild>
              <Button variant="ghost" className="w-full h-12 rounded-xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                Close Briefing
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="max-w-[440px] p-0 rounded-3xl overflow-hidden border-none shadow-2xl">
          <div className="p-8 space-y-6">
            <DialogHeader className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Submit Finished Work</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 font-medium">
                Provide the final link for <span className="text-slate-900 font-bold">{submittingProject?.fileCode}</span>. This will set the status to <span className="text-green-600 font-bold">For QA</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Submission Link (Drive/Canva/Review)</Label>
                <Input 
                  placeholder="https://..." 
                  value={submissionLink} 
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
                <Button 
                  onClick={handleSubmission} 
                  disabled={!submissionLink}
                  className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-100"
                >
                  Confirm Submission
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
