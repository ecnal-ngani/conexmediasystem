'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  UserPlus, 
  Trophy, 
  Zap,
  Users,
  CheckCircle2,
  Wallet,
  Copy,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'Inactive';
  points: number;
  xp: number;
  salary: string;
  badges: string[];
}

const STAFF_DATA: Employee[] = [
  { id: 'CX-CEO-01', name: 'Kyle Jarque', role: 'CEO', email: 'kyle@conexmedia.com', status: 'Active', points: 0, xp: 0, salary: 'N/A', badges: [] },
  { id: 'CX-COO-01', name: 'Sophie', role: 'COO', email: 'sophie@conexmedia.com', status: 'Active', points: 0, xp: 0, salary: 'N/A', badges: [] },
  { id: 'CX-MS-01', name: 'Ellaija Joy Parot', role: 'Marketing Strategist', email: 'ellaija@conexmedia.com', status: 'Active', points: 850, xp: 8500, salary: '₱33,200', badges: ['🏆'] },
  { id: 'CX-CD-01', name: 'Trish Jarque', role: 'Creative Director', email: 'trish@conexmedia.com', status: 'Active', points: 0, xp: 0, salary: '₱38,000', badges: [] },
  { id: 'CX-PD-01', name: 'Matthew Valenzona', role: 'Production Director', email: 'matthew@conexmedia.com', status: 'Active', points: 0, xp: 0, salary: '₱38,000', badges: [] },
  { id: 'CX-BM-01', name: 'Clark Tadeo', role: 'Brand Manager', email: 'clark@conexmedia.com', status: 'Active', points: 1250, xp: 12500, salary: '₱37,400', badges: ['🏆', '⚡'] },
  { id: 'CX-BM-02', name: 'CA Guazon', role: 'Brand Manager', email: 'ca@conexmedia.com', status: 'Active', points: 1180, xp: 11800, salary: '₱36,800', badges: ['🏆'] },
  { id: 'CX-BM-03', name: 'Janella Toribio', role: 'Brand Manager', email: 'janella@conexmedia.com', status: 'Active', points: 980, xp: 9000, salary: '₱36,500', badges: ['🏆'] },
  { id: 'CX-BM-04', name: 'Hanna Pestaño', role: 'Brand Manager', email: 'hanna@conexmedia.com', status: 'Active', points: 920, xp: 9200, salary: '₱36,400', badges: [] },
  { id: 'CX-BM-05', name: 'Khael Rodriguez', role: 'Brand Manager', email: 'khael@conexmedia.com', status: 'Active', points: 780, xp: 7800, salary: '₱36,100', badges: [] },
  { id: 'CX-VG-01', name: 'Chloe Javier', role: 'Videographer', email: 'chloe@conexmedia.com', status: 'Active', points: 587, xp: 5870, salary: '₱28,200', badges: ['🏆'] },
];

const ROLE_MAPPINGS: Record<string, string> = {
  "CEO": "CEO",
  "COO": "COO",
  "Marketing Strategist": "MS",
  "Creative Director": "CD",
  "Production Director": "PD",
  "Brand Manager": "BM",
  "Videographer": "VG"
};

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('Brand Manager');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const { toast } = useToast();

  const filteredStaff = STAFF_DATA.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generatedId = useMemo(() => {
    const code = ROLE_MAPPINGS[selectedRole] || "STAFF";
    const existingCount = STAFF_DATA.filter(emp => emp.role === selectedRole).length;
    const nextNum = (existingCount + 1).toString().padStart(2, '0');
    return `CX-${code}-${nextNum}`;
  }, [selectedRole]);

  const handleCopyAndGenerate = () => {
    navigator.clipboard.writeText(generatedId);
    toast({
      title: "ID Copied to Clipboard",
      description: `${generatedId} has been successfully generated for ${selectedRole}.`,
    });
    setIsGenerateOpen(false);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Staff Management</h1>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by name, ID, or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 shadow-sm focus-visible:ring-primary w-full"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="w-full sm:w-auto h-11 border-primary/20 text-primary hover:bg-primary/5 font-bold">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-11 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-red-100">
                <UserPlus className="w-4 h-4 mr-2" />
                Generate New ID
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[400px] p-8 rounded-3xl border-none shadow-2xl">
              <DialogHeader className="space-y-4 mb-6">
                <DialogTitle className="text-xl font-bold text-slate-900">Generate New Employee ID</DialogTitle>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400 font-medium">Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="h-12 border-slate-200 text-slate-700">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(ROLE_MAPPINGS).map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DialogHeader>

              <div className="bg-slate-50 rounded-2xl p-8 text-center space-y-3 border border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Generated ID:</p>
                <h2 className="text-3xl font-black text-primary tracking-tight">
                  {generatedId}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8">
                <DialogClose asChild>
                  <Button variant="outline" className="h-12 font-medium border-slate-200 text-slate-600 hover:bg-slate-50">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  onClick={handleCopyAndGenerate}
                  className="h-12 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-red-100"
                >
                  Generate & Copy
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Staff', value: '20', icon: Users, color: 'text-slate-900' },
          { label: 'Active', value: '20', icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Total XP', value: '98,350', icon: Trophy, color: 'text-primary' },
          { label: 'Monthly Payroll', value: '₱533K', icon: Wallet, color: 'text-slate-900' },
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

      {/* Employee Table */}
      <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 pl-6 whitespace-nowrap">Employee ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Role</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Email</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap text-center">Total Pts</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap text-center">XP Level</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Salary</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Badges</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors border-0">
                  <TableCell className="py-4 pl-6 font-mono text-[10px] font-bold text-slate-500 whitespace-nowrap">
                    {emp.id}
                  </TableCell>
                  <TableCell className="py-4 font-bold text-slate-900 whitespace-nowrap">
                    {emp.name}
                  </TableCell>
                  <TableCell className="py-4 text-xs text-slate-500 whitespace-nowrap">
                    {emp.role}
                  </TableCell>
                  <TableCell className="py-4 text-xs text-slate-400 whitespace-nowrap">
                    {emp.email}
                  </TableCell>
                  <TableCell className="py-4 text-center whitespace-nowrap">
                    <Badge className="bg-green-50 text-green-600 border-green-100 hover:bg-green-100 text-[9px] font-bold px-2 py-0.5">
                      {emp.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-center font-bold text-primary text-xs whitespace-nowrap">
                    {emp.points.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-4 text-center font-bold text-blue-600 text-xs whitespace-nowrap">
                    {emp.xp.toLocaleString()}
                  </TableCell>
                  <TableCell className="py-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                    {emp.salary}
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {emp.badges.map((badge, idx) => (
                        <div key={idx} className="w-6 h-6 rounded bg-orange-50 border border-orange-100 flex items-center justify-center text-[10px] shadow-sm">
                          {badge === '🏆' ? <Trophy className="w-3 h-3 text-orange-500" /> : <Zap className="w-3 h-3 text-orange-500" />}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
