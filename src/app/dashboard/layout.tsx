'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { QuickActions } from '@/components/quick-actions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isWfh, isVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (isWfh && !isVerified) {
        router.push('/verify');
      }
    }
  }, [user, isLoading, isWfh, isVerified, router]);

  if (isLoading || !user || (isWfh && !isVerified)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Synchronizing credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <DashboardSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          {/* Mobile Navigation Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 lg:hidden bg-white sticky top-0 z-20">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <div className="bg-[#722F37] w-8 h-8 rounded flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30 40C30 30 40 25 50 25C60 25 70 30 70 40V75M40 75V40C40 35 45 32 50 32C55 32 60 35 60 40V75" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xs tracking-tighter uppercase text-slate-900 leading-none">conex</span>
                <span className="text-[8px] font-black tracking-[0.2em] uppercase text-primary leading-none mt-0.5">media</span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
            {children}
          </main>
          
          {/* Global Quick Actions */}
          <QuickActions />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
