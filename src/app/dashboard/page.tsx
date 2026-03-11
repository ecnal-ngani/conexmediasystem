
'use client';

import { useAuth } from '@/components/auth-context';
import { AUTHORIZED_CONTENT, ContentItem } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lock, 
  Eye, 
  FileText, 
  Video, 
  BarChart3, 
  Newspaper,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const filteredContent = AUTHORIZED_CONTENT.filter(item => {
    if (!item.requiredRole) return true;
    if (user?.role === 'ADMIN') return true;
    return item.requiredRole === user?.role;
  });

  const getIcon = (category: string) => {
    switch (category) {
      case 'document': return <FileText className="w-5 h-5" />;
      case 'report': return <BarChart3 className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      default: return <Newspaper className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Welcome, {user?.name}. You are currently viewing as <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{user?.role}</Badge>
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/curator">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Curator
            </Link>
          </Button>
          <Button className="gap-2 bg-primary">
            <ShieldCheck className="w-4 h-4" />
            Security Audit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Active Sessions</CardTitle>
            <div className="text-3xl font-bold">14</div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
              +24% from yesterday
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Resources Accessed</CardTitle>
            <div className="text-3xl font-bold">1,204</div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground font-semibold">
              Last 24 hours
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Network Latency</CardTitle>
            <div className="text-3xl font-bold">12ms</div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-primary font-semibold">
              Optimized Perimeter
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Lock className="w-6 h-6 text-primary" />
            Protected Content
          </h2>
          <p className="text-sm text-muted-foreground">
            Showing {filteredContent.length} exclusive resources
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContent.map((item) => (
            <Card key={item.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {getIcon(item.category)}
                  </div>
                  {item.requiredRole && (
                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                      {item.requiredRole} REQUIRED
                    </Badge>
                  )}
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">{item.title}</CardTitle>
                <CardDescription className="line-clamp-2">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full justify-between group-hover:bg-secondary/20" asChild>
                  <Link href={`/dashboard/content/${item.id}`}>
                    Access Resource
                    <Eye className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
