
'use client';

import { useAuth } from '@/components/auth-context';
import { AUTHORIZED_CONTENT } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  TrendingUp, 
  Users, 
  Shield, 
  Sparkles, 
  ChevronRight,
  LayoutGrid,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const chartData = [
  { month: "Jan", usage: 450 },
  { month: "Feb", usage: 520 },
  { month: "Mar", usage: 480 },
  { month: "Apr", usage: 610 },
  { month: "May", usage: 590 },
  { month: "Jun", usage: 720 },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const filteredContent = AUTHORIZED_CONTENT.filter(item => {
    if (!item.requiredRole) return true;
    if (user?.role === 'CEO' || user?.role === 'ADMIN') return true;
    return item.requiredRole === user?.role;
  });

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-1000">
      {/* Hero Executive Summary */}
      <section className="relative h-[400px] rounded-3xl overflow-hidden group shadow-2xl border-4 border-white">
        <Image 
          src="https://picsum.photos/seed/conexhero/1200/600" 
          alt="Dashboard Hero"
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          data-ai-hint="luxury office"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-10 space-y-4 max-w-2xl">
          <Badge className="bg-primary text-white hover:bg-primary px-3 py-1 font-bold">EXECUTIVE FEED</Badge>
          <h1 className="text-5xl font-extrabold text-white leading-tight">
            Strategic Command: <br /> Global Media Operations
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Welcome back, {user?.name}. Global engagement is up 12% this week. Your morning AI briefing is ready for review.
          </p>
          <div className="flex gap-4 pt-4">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 rounded-xl px-8 h-14 font-bold shadow-xl">
              Launch Briefing
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 h-14 font-bold backdrop-blur-md">
              View Analytics
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Nodes', value: '1,204', trend: '+14%', icon: Activity, color: 'text-blue-500' },
          { label: 'Engagement', value: '89.4k', trend: '+8%', icon: TrendingUp, color: 'text-green-500' },
          { label: 'Security Clearance', value: 'Level 4', trend: 'Verified', icon: Shield, color: 'text-primary' },
          { label: 'Team Activity', value: '42 Active', trend: 'Live', icon: Users, color: 'text-orange-500' },
        ].map((kpi, i) => (
          <Card key={i} className="border-2 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-secondary/10 ${kpi.color}`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-muted-foreground/20">{kpi.trend}</Badge>
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-3xl font-black mt-1">{kpi.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-primary" />
              Intelligence Assets
            </h2>
            <Button variant="ghost" className="text-primary font-bold group">
              View All <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredContent.map((item) => (
              <Card key={item.id} className="group overflow-hidden border-2 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/5">
                <div className="relative aspect-video overflow-hidden">
                  <Image 
                    src={item.thumbnail || 'https://picsum.photos/seed/default/400/300'} 
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-black backdrop-blur-md uppercase text-[10px] tracking-widest">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </div>
                  </div>
                </div>
                <CardHeader className="space-y-1">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{item.title}</CardTitle>
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-muted font-bold text-muted-foreground uppercase">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <Button asChild className="w-full mt-6 bg-secondary/20 text-foreground hover:bg-primary hover:text-white border-0 font-bold h-12">
                    <Link href={`/dashboard/content/${item.id}`}>Initialize Resource</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-8">
          <Card className="border-4 border-primary/20 shadow-2xl bg-secondary/5 overflow-hidden">
            <CardHeader className="bg-primary p-6">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5" />
                AI CEO Briefing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="p-4 rounded-2xl bg-white border shadow-sm space-y-3">
                <p className="text-sm font-bold text-primary italic">Key Takeaway:</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Market sentiment is shifting towards localized logistics. Recommend increasing node capacity in Southeast Asia by 15% before Q4 begins.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Network Health</span>
                  <span>98.4%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[98.4%]" />
                </div>
              </div>
              <Button className="w-full h-12 bg-primary font-bold shadow-lg shadow-primary/20">
                Full Strategic Analysis
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Network Usage</CardTitle>
              <CardDescription>Global data consumption trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ChartContainer config={{ usage: { label: "Data Usage", color: "hsl(var(--primary))" } }}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="fillUsage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#fillUsage)" 
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
