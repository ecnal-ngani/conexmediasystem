'use client';

import { useState, useMemo } from 'react';
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
  Save
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ProductionPage() {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const firestore = useFirestore();
  const { toast } = useToast();

  // Project Editing State
  const [editingLink, setEditingLink] = useState('');

  // New Project Form State
  const [fileCode, setFileCode] = useState('');
  const [brand, setBrand] = useState('');
  const [contentIdea, setContentIdea] = useState('');
  const [status, setStatus] = useState('In Production');
  const [priority, setPriority] = useState('REGULAR');
  const [artist, setArtist] = useState('');
  const [type, setType] = useState('Video');
  const [platform, setPlatform] = useState('Instagram');
  const [dueDate, setDueDate] = useState('');
  const [bm, setBm] = useState('');
  const [canvasLink, setCanvasLink] = useState('');

  // Real-time listener for projects
  const projectsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: projects, loading } = useCollection<any>(projectsQuery);

  // Advanced Filtering Logic
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter((project: any) => {
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

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'In Production':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'For QA':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Approved':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'Client Revision':
        return 'bg-pink-50 text-pink-600 border-pink-200';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const getPriorityStyles = (priority: string) => {
    if (priority === 'RUSH') {
      return 'text-red-600 bg-red-50 border-red-200 font-bold';
    }
    return 'text-slate-500 bg-slate-50 border-slate-200 font-medium';
  };

  const handleAddProject = () => {
    if (!firestore || !fileCode || !brand) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "File Code and Company Brand Name are required."
      });
      return;
    }

    const projectsRef = collection(firestore, 'projects');
    const projectData = {
      fileCode,
      brand,
      contentIdea,
      status,
      priority,
      artist,
      type,
      platform,
      dueDate,
      bm,
      canvasLink,
      createdAt: serverTimestamp()
    };

    addDoc(projectsRef, projectData)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: projectsRef.path,
          operation: 'create',
          requestResourceData: projectData
        }));
      });

    toast({
      title: "Project Initialized",
      description: `${fileCode} has been added to the Production Hub.`
    });
    
    setIsAddProjectOpen(false);
    // Reset form
    setFileCode(''); setBrand(''); setContentIdea(''); setArtist(''); setDueDate(''); setCanvasLink('');
  };

  const handleUpdateLink = () => {
    if (!firestore || !selectedProject || !editingLink) return;
    const projectRef = doc(firestore, 'projects', selectedProject.id);
    
    updateDoc(projectRef, { canvasLink: editingLink }).then(() => {
      toast({
        title: "Asset Link Updated",
        description: "The project's destination link has been synchronized."
      });
      setSelectedProject({ ...selectedProject, canvasLink: editingLink });
    }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: projectRef.path,
        operation: 'update',
        requestResourceData: { canvasLink: editingLink }
      }));
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Production Hub</h1>
        <div className="flex items-center gap-2">
           {(statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || searchQuery !== '') && (
             <Button variant="ghost" onClick={resetFilters} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary">
               <XCircle className="w-3 h-3 mr-1" />
               Reset Filters
             </Button>
           )}
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="relative group col-span-1 md:col-span-1 lg:col-span-1">
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

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 shadow-none border-slate-200 text-xs font-medium">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
              <SelectItem value="Graphic Design">Graphic Design</SelectItem>
              <SelectItem value="Motion Graphics">Motion Graphics</SelectItem>
              <SelectItem value="Photography">Photography</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-red-100 text-xs text-white w-full">
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
                          <FileText className="w-3 h-3 text-primary" />
                          File Code
                        </Label>
                        <Input 
                          placeholder="VLM-260120-01" 
                          value={fileCode}
                          onChange={(e) => setFileCode(e.target.value)}
                          className="h-12 border-slate-200 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <Briefcase className="w-3 h-3 text-primary" />
                          Brand Name
                        </Label>
                        <Input 
                          placeholder="CJC Eco Bag" 
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="h-12 border-slate-200 rounded-xl" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Lightbulb className="w-3 h-3 text-primary" />
                        Content Idea
                      </Label>
                      <Input 
                        placeholder="Product showcase reel" 
                        value={contentIdea}
                        onChange={(e) => setContentIdea(e.target.value)}
                        className="h-12 border-slate-200 rounded-xl" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          Status
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="h-12 border-slate-200 rounded-xl">
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
                          <Zap className="w-3 h-3 text-primary" />
                          Priority
                        </Label>
                        <Select value={priority} onValueChange={setPriority}>
                          <SelectTrigger className="h-12 border-slate-200 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REGULAR">REGULAR</SelectItem>
                            <SelectItem value="RUSH">RUSH</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <User className="w-3 h-3 text-primary" />
                          Artist
                        </Label>
                        <Input 
                          placeholder="Jhon Lester Nolial" 
                          value={artist}
                          onChange={(e) => setArtist(e.target.value)}
                          className="h-12 border-slate-200 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <Layers className="w-3 h-3 text-primary" />
                          Type
                        </Label>
                        <Select value={type} onValueChange={setType}>
                          <SelectTrigger className="h-12 border-slate-200 rounded-xl">
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <Share2 className="w-3 h-3 text-primary" />
                          Platform
                        </Label>
                        <Select value={platform} onValueChange={setPlatform}>
                          <SelectTrigger className="h-12 border-slate-200 rounded-xl">
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
                          <Calendar className="w-3 h-3 text-primary" />
                          Due Date
                        </Label>
                        <Input 
                          type="date" 
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="h-12 border-slate-200 rounded-xl" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <User className="w-3 h-3 text-primary" />
                          Brand Manager (BM)
                        </Label>
                        <Input 
                          placeholder="Clark" 
                          value={bm}
                          onChange={(e) => setBm(e.target.value)}
                          className="h-12 border-slate-200 rounded-xl" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <LinkIcon className="w-3 h-3 text-primary" />
                          Canvas Link
                        </Label>
                        <Input 
                          placeholder="https://..." 
                          value={canvasLink}
                          onChange={(e) => setCanvasLink(e.target.value)}
                          className="h-12 border-slate-200 rounded-xl" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleAddProject}
                      className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-red-100 text-white"
                    >
                      Add to Hub
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 pl-6 whitespace-nowrap">Action</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap">File Code</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap">Brand</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap text-center">Priority</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap">Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap">Artist</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">No production items match your intelligence query.</p>
                      <Button variant="link" onClick={resetFilters} className="text-xs text-primary font-bold">Clear all filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProjects.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-0 group">
                  <TableCell className="py-4 pl-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedProject(item);
                          setEditingLink(item.canvasLink || '');
                        }}
                        className="text-primary hover:text-primary/80 hover:bg-primary/5 h-7 text-[10px] px-2 font-bold group"
                      >
                        <LinkIcon className="w-3 h-3 mr-1 transition-transform group-hover:scale-110" />
                        Link
                      </Button>
                      {item.canvasLink && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                          asChild
                        >
                          <a href={item.canvasLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] font-bold text-slate-500 py-4 whitespace-nowrap">{item.fileCode}</TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{item.brand}</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-[150px]">{item.contentIdea}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    <Badge variant="outline" className={cn("text-[8px] font-bold px-2 py-0.5 rounded border leading-none inline-flex items-center justify-center min-w-[90px]", getStatusStyles(item.status))}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    <Badge variant="outline" className={cn("text-[8px] font-bold px-2 py-0.5 rounded border leading-none", getPriorityStyles(item.priority))}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-medium text-slate-600">{item.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                        {item.artist?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] font-medium text-slate-700">{item.artist}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    <div className="flex flex-col items-end sm:items-start">
                      <span className="text-[10px] font-bold text-slate-800">{item.dueDate}</span>
                      <span className="text-[8px] text-slate-400 uppercase font-black">{item.platform}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-md p-8 rounded-3xl border-none shadow-2xl">
          {selectedProject && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-red-100">
                    <LinkIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black">{selectedProject.brand}</DialogTitle>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedProject.fileCode}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-4 border-t">
                {/* Link Configuration */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Link (Canvas/Reel)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://link-to-asset.com" 
                      value={editingLink}
                      onChange={(e) => setEditingLink(e.target.value)}
                      className="h-10 rounded-xl bg-slate-50 border-slate-200"
                    />
                    <Button 
                      onClick={handleUpdateLink}
                      className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-3 shrink-0 rounded-xl"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedProject.canvasLink && (
                    <Button variant="outline" className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5 h-10 rounded-xl" asChild>
                      <a href={selectedProject.canvasLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Jump to Asset
                      </a>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                    <p className="font-bold">{selectedProject.type}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Artist</p>
                    <p className="font-bold">{selectedProject.artist}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setSelectedProject(null)} className="w-full h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-100">
                  Close Link Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
