
'use client';

import { useAuth } from '@/components/auth-context';
import { EMPLOYEES } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Award,
  Bell,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

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
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20 relative">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Global Command Center</h1>
      </div>

      {/* Welcome Banner */}
      <div className="bg-[#FFFBF5] border border-[#F2E8D5] rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Welcome back, {user?.name}</h2>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening with your agency today.</p>
      </div>

      {/* Company Pulse */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Company Pulse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Projects', value: '12', trend: '+3 this week', icon: Briefcase, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Staff Online', value: '28', subValue: 'of 32 total', trend: 'of 32 total', icon: Users, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Projects Delivered', value: '47', trend: 'this month', icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Client Satisfaction', value: '96%', trend: '+4% vs last month', icon: Award, color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map((kpi, i) => (
            <Card key={i} className="border shadow-none rounded-xl">
              <CardContent className="p-6">
                <div className={`w-10 h-10 rounded-full ${kpi.bg} flex items-center justify-center mb-4`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="text-xs text-slate-400 font-medium">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{kpi.value}</h3>
                <p className={`text-[10px] mt-1 ${kpi.trend.startsWith('+') ? 'text-green-500 font-bold' : 'text-slate-400'}`}>
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
          <Card className="border shadow-none rounded-xl p-6">
            <div className="h-[400px] w-full">
              <ChartContainer config={{ 
                efficiency: { label: "Efficiency %", color: "#E11D48" },
                projects: { label: "Projects", color: "#1E293B" }
              }}>
                <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-500 font-medium">{value}</span>}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    name="Efficiency %"
                    stroke="#E11D48" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#E11D48', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projects" 
                    name="Projects"
                    stroke="#1E293B" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#1E293B', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </Card>
        </section>

        {/* Employee Status Sidebar */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Employee Status (7/8 Online)</h3>
          <Card className="border shadow-none rounded-xl p-4 overflow-hidden">
            <div className="space-y-4">
              {EMPLOYEES.map((emp, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold ${i % 3 === 0 ? 'bg-red-500 text-white' : i % 3 === 1 ? 'bg-orange-500 text-white' : 'bg-slate-500 text-white'}`}>
                      {emp.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-700">{emp.name}</span>
                      {emp.icon && <span className="text-[10px]">{emp.icon}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Office' ? 'bg-green-500' : emp.status === 'WFH' ? 'bg-orange-500' : 'bg-slate-300'}`}></span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${emp.status === 'Office' ? 'bg-green-50 text-green-600' : emp.status === 'WFH' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                      {emp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-4">
        <button className="relative w-12 h-12 bg-[#E11D48] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-800 border-2 border-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span>
        </button>
        <button className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
          <Zap className="w-5 h-5" />
        </button>
      </div>

      {/* Help FAB */}
      <div className="fixed bottom-4 right-4">
        <button className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
