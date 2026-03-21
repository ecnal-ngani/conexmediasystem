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
  Download, 
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
  Loader2
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
import { useCollection, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ProductionPage() {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const firestore = useFirestore();
  const { toast } = useToast();

  // Form State
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

  // Real-time listener
  const projectsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'projects'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: projects, loading } = useCollection<any>(projectsQuery);

  // Filtered Data Logic
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter((project: any) => {
      const matchesSearch = 
        (project.fileCode?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (project.brand?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (project.artist?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'In Production':
        return 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100';
      case 'For QA':
        return 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100';
      case 'Approved':
        return 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100';
      case 'Client Revision':
        return 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const getPriorityStyles = (priority: string) => {
    if (priority === 'RUSH') {
      return 'text-red-500 bg-red-50 border-red-100 font-bold';
    }
    return 'text-slate-400 bg-slate-50 border-slate-100 font-medium';
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
        const permissionError = new FirestorePermissionError({
          path: projectsRef.path,
          operation: 'create',
          requestResourceData: projectData
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: "Project Initialized",
      description: `${fileCode} is being added to the Production Matrix.`
    });
    
    setIsAddProjectOpen(false);
    // Reset form
    setFileCode('');
    setBrand('');
    setContentIdea('');
    setArtist('');
    setDueDate('');
    setCanvasLink('');
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Production Matrix</h1>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
          <div className="hidden sm:flex w-10 h-10 border rounded-lg items-center justify-center bg-white shadow-sm text-slate-400 shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] md:w-[180px] h-10 shadow-sm border-slate-200 text-xs font-medium">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="In Production">In Production</SelectItem>
              <SelectItem value="For QA">For QA</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Client Revision">Client Revision</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search projects by code, brand or artist..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 w-full shadow-sm border-slate-200 focus-visible:ring-primary text-xs"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-10 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-red-100 text-xs text-white">
                <Plus className="w-4 h-4 mr-1.5" />
                Add New Project
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
                      <DialogDescription className="text-slate-400 font-medium">Configure a new production item for the matrix.</DialogDescription>
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
                          className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <Briefcase className="w-3 h-3 text-primary" />
                          Company Brand Name
                        </Label>
                        <Input 
                          placeholder="CJC Eco Bag" 
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
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
                        className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          Status
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger className="h-12 border-slate-200 rounded-xl text-slate-600">
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
                          <SelectTrigger className="h-12 border-slate-200 rounded-xl text-slate-600">
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
                          className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                          <Layers className="w-3 h-3 text-primary" />
                          Type
                        </Label>
                        <Select value={type} onValueChange={setType}>
                          <SelectTrigger className="h-12 border-slate-200 rounded-xl text-slate-600">
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
                          <SelectTrigger className="h-12 border-slate-200 rounded-xl text-slate-600">
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
                          className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
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
                          className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
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
                          className="h-12 border-slate-200 rounded-xl text-slate-600 focus-visible:ring-primary" 
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
                      Add to Matrix
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline" className="w-full sm:w-auto h-10 border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm text-xs font-bold">
            <Download className="w-4 h-4 mr-1.5" />
            Export Matrix
          </Button>
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
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap">Priority</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap">Artist</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 whitespace-nowrap">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                    {searchQuery || statusFilter !== 'all' ? 'No projects match your current filters.' : 'No production items found.'}
                  </TableCell>
                </TableRow>
              ) : filteredProjects.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors border-0">
                  <TableCell className="py-4 pl-6 whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 text-[10px] px-2 font-bold group">
                      <ExternalLink className="w-3 h-3 mr-1 transition-transform group-hover:scale-110" />
                      View
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] font-bold text-slate-700 py-4 whitespace-nowrap">{item.fileCode}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-800 whitespace-nowrap">{item.brand}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className={cn("inline-flex h-7 items-center text-[9px] font-bold border rounded px-1.5 w-[110px]", getStatusStyles(item.status))}>
                      {item.status}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0 rounded tracking-tighter", getPriorityStyles(item.priority))}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 whitespace-nowrap">{item.artist}</TableCell>
                  <TableCell className="text-xs text-slate-800 font-medium whitespace-nowrap">{item.dueDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
