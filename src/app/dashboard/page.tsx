'use client';

import { useAuth } from '@/components/auth-context';
import { EMPLOYEES } from '@/lib/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Award
} from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

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

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1600px] mx-auto pb-10 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Global Command Center</h1>
      </div>

      {/* Welcome Banner */}
      <div className="bg-[#FFFBF5] border border-[#F2E8D5] rounded-xl p-6 md:p-8 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold text-slate-800">Welcome back, {user?.name}</h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening with your agency today.</p>
      </div>

      {/* Company Pulse */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Company Pulse</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Projects', value: '12', trend: '+3 this week', icon: Briefcase, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Staff Online', value: '28', trend: 'of 32 total', icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
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

      {/* Company Performance & Employee Status */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Chart Section */}
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
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    domain={[0, 100]}
                    width={25}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] text-slate-500 font-medium">{value}</span>}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    name="Efficiency %"
                    stroke="#E11D48" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#E11D48', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projects" 
                    name="Projects"
                    stroke="#1E293B" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#1E293B', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </Card>
        </section>

        {/* Employee Status Sidebar */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Employee Status (7/8 Online)</h3>
          <Card className="border shadow-none rounded-xl p-4">
            <div className="space-y-4">
              {EMPLOYEES.map((emp, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 flex items-center justify-center text-[9px] md:text-[10px] font-bold ${i % 3 === 0 ? 'bg-red-500 text-white' : i % 3 === 1 ? 'bg-orange-500 text-white' : 'bg-slate-500 text-white'}`}>
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-xs font-medium text-slate-700 truncate">{emp.name}</span>
                      {emp.icon && <span className="text-[10px] shrink-0">{emp.icon}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${emp.status === 'Office' ? 'bg-green-500' : emp.status === 'WFH' ? 'bg-orange-500' : 'bg-slate-300'}`}></span>
                    <span className={`text-[9px] md:text-[10px] font-bold px-1 py-0.5 rounded ${emp.status === 'Office' ? 'bg-green-50 text-green-600' : emp.status === 'WFH' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                      {emp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
