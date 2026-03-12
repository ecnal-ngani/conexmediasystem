
'use client';

import { useState } from 'react';
import { PRODUCTION_DATA, ProductionItem } from '@/lib/mock-data';
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
  Plus, 
  Filter, 
  Search 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductionPage() {
  const [data, setData] = useState<ProductionItem[]>(PRODUCTION_DATA);

  const getStatusStyles = (status: ProductionItem['status']) => {
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

  const getPriorityStyles = (priority: ProductionItem['priority']) => {
    if (priority === 'RUSH') {
      return 'text-red-500 bg-red-50 border-red-100 font-bold';
    }
    return 'text-slate-400 bg-slate-50 border-slate-100 font-medium';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Production Operations Matrix</h1>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border rounded-lg flex items-center justify-center bg-white shadow-sm text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px] h-10 shadow-sm border-slate-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-production">In Production</SelectItem>
              <SelectItem value="qa">For QA</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="revision">Client Revision</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search projects..." 
              className="pl-10 h-10 w-[300px] shadow-sm border-slate-200 focus-visible:ring-primary"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium ml-2">{data.length} items</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="h-10 bg-[#E11D48] hover:bg-[#E11D48]/90 font-bold shadow-lg shadow-red-200">
            <Plus className="w-4 h-4 mr-2" />
            Add New Project
          </Button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4 pl-6">File Code</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4">Brand</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4">Content Idea</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4">Status</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4">Priority</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4">Artist</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4">Type</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4">Platform</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4">Due Date</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4">BM</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-400 py-4 text-right pr-6">Canvas Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, i) => (
              <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-b last:border-0">
                <TableCell className="font-mono text-xs font-bold text-slate-700 py-4 pl-6">{item.fileCode}</TableCell>
                <TableCell className="text-xs font-bold text-slate-800">{item.brand}</TableCell>
                <TableCell className="text-xs text-slate-500">{item.contentIdea}</TableCell>
                <TableCell>
                  <Select defaultValue={item.status}>
                    <SelectTrigger className={cn("h-8 text-[10px] font-bold border rounded px-2 w-[130px]", getStatusStyles(item.status))}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Production">In Production</SelectItem>
                      <SelectItem value="For QA">For QA</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Client Revision">Client Revision</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0.5 rounded tracking-tighter", getPriorityStyles(item.priority))}>
                    [{item.priority}]
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500">{item.artist}</TableCell>
                <TableCell className="text-xs text-slate-500">{item.type}</TableCell>
                <TableCell className="text-xs text-slate-500">{item.platform}</TableCell>
                <TableCell className="text-xs text-slate-800 font-medium">{item.dueDate}</TableCell>
                <TableCell className="text-xs text-slate-500">{item.bm}</TableCell>
                <TableCell className="text-right pr-6">
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 text-[10px] gap-1.5">
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
