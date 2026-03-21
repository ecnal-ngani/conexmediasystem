
'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Award,
  Search,
  Download,
  UserPlus,
  Trophy,
  Zap,
  Wallet,
  Loader2
} from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const performanceData = [
  { month: "Jan", efficiency: 82, projects: 40 },
  { month: "Feb", efficiency: 85, projects: 42 },
  { month: "Mar", efficiency: 88, projects: 45 },
  { month: "Apr", efficiency: 91, projects: 48 },
  { month: "May", efficiency: 94, projects: 50 },
  { month: "Jun", efficiency: 92, projects: 48 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const firestore = useFirestore();
  const router = useRouter();

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('systemId', 'asc'));
  }, [firestore]);

  const { data: staff, loading: sLoading } = useCollection<any>(usersQuery);

  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    return staff.filter(emp => 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.systemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staff, searchQuery]);

  // ADMIN-ONLY DASHBOARD VIEW
  if (user?.role === 'ADMIN' || user?.role === 'CEO') {
    return (
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Admin Personnel Dashboard</h1>
        </div>

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
              Export Personnel
            </Button>
            <Button onClick={() => router.push('/dashboard/admin')} className="w-full sm:w-auto h-11 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-red-100 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Manage Personnel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Total Staff', value: staff?.length || 0, icon: Users, color: 'text-slate-900' },
            { label: 'Active Personnel', value: staff?.filter((s: any) => s.status !== 'Offline').length || 0, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Personnel XP', value: (staff?.reduce((acc: number, s: any) => acc + (s.xp || 0), 0) || 0).toLocaleString(), icon: Trophy, color: 'text-primary' },
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

        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-0">
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 pl-6 whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Name</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Role</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap text-center">XP Level</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-5 whitespace-nowrap">Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell>
                  </TableRow>
                ) : filteredStaff.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors border-0">
                    <TableCell className="py-4 pl-6 font-mono text-[10px] font-bold text-slate-500 whitespace-nowrap">{emp.systemId}</TableCell>
                    <TableCell className="py-4 font-bold text-slate-900 whitespace-nowrap">{emp.name}</TableCell>
                    <TableCell className="py-4 text-xs text-slate-500 whitespace-nowrap">{emp.role}</TableCell>
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
                    <TableCell className="py-4 text-center font-bold text-primary text-xs whitespace-nowrap">{(emp.xp || 0).toLocaleString()}</TableCell>
                    <TableCell className="py-4 text-xs font-medium text-slate-700 whitespace-nowrap">{emp.salary || '₱0'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD DASHBOARD VIEW
  return (
    <div className="space-y-6 md:space-y-8 max-w-[1600px] mx-auto pb-10 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Global Command Center</h1>
      </div>

      <div className="bg-[#FFFBF5] border border-[#F2E8D5] rounded-xl p-6 md:p-8 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold text-slate-800">Welcome back, {user?.name}</h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening with your agency today.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Company Pulse</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Projects', value: '12', trend: '+3 this week', icon: Briefcase, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Staff Online', value: staff?.filter((s: any) => s.status !== 'Offline').length || 0, trend: `of ${staff?.length || 0} total`, icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Projects Delivered', value: '47', trend: 'this month', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Client Satisfaction', value: '96%', trend: '+4% vs last month', icon: Award, color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map((kpi, i) => (
            <Card key={i} className="border shadow-none rounded-xl">
              <CardContent className="p-4 md:p-6">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${kpi.bg} flex items-center justify-center mb-3 md:mb-4`}>
                  <kpi.icon className={`w-4 h-4 md:w-5 md:h-5 ${kpi.color}`} />
                </div>
                <p className="text-[10px] md:text-xs text-slate-400 font-medium">{kpi.label}</p>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{kpi.value}</h3>
                <p className={`text-[9px] md:text-[10px] mt-1 ${kpi.trend.startsWith('+') ? 'text-green-500 font-bold' : 'text-slate-400'}`}>
                  {kpi.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <section className="lg:col-span-3 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Company Performance</h3>
          <Card className="border shadow-none rounded-xl p-4 md:p-6">
            <div className="h-[300px] md:h-[400px] w-full">
              <ChartContainer config={{ 
                efficiency: { label: "Efficiency %", color: "#E11D48" },
                projects: { label: "Projects", color: "#1E293B" }
              }}>
                <LineChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} domain={[0, 100]} width={25} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-[10px] text-slate-500 font-medium">{value}</span>} />
                  <Line type="monotone" dataKey="efficiency" name="Efficiency %" stroke="#E11D48" strokeWidth={2} dot={{ r: 3, fill: '#E11D48', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="projects" name="Projects" stroke="#1E293B" strokeWidth={2} dot={{ r: 3, fill: '#1E293B', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ChartContainer>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Personnel Status</h3>
          <Card className="border shadow-none rounded-xl p-4">
            <div className="space-y-4">
              {sLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : staff?.slice(0, 10).map((emp: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                      "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold text-white shrink-0",
                      emp.role === 'CEO' || emp.role === 'ADMIN' ? "bg-red-500" : "bg-slate-500"
                    )}>
                      {emp.name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-700 truncate">{emp.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${emp.status === 'Office' ? 'bg-green-500' : emp.status === 'WFH' ? 'bg-orange-500' : 'bg-slate-300'}`}></span>
                    <span className={cn(
                      "text-[9px] md:text-[10px] font-bold px-1 py-0.5 rounded",
                      emp.status === 'Office' ? "bg-green-50 text-green-600" :
                      emp.status === 'WFH' ? "bg-orange-50 text-orange-600" :
                      "bg-slate-50 text-slate-400"
                    )}>
                      {emp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {staff && staff.length > 10 && (
              <Button variant="ghost" className="w-full text-[10px] mt-2 font-bold uppercase text-slate-400" onClick={() => router.push('/dashboard/admin')}>View All Personnel</Button>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
