'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Loader2, Settings } from 'lucide-react';
import { QuickActions } from '@/components/quick-actions';
import { MobileNav } from '@/components/mobile-nav';
import Link from 'next/link';

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
      <div className="flex min-h-screen w-full bg-[#F8FAFC]">
        {/* Persistent Tactical Sidebar */}
        <DashboardSidebar />
        
        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-transparent">
          {/* Mobile Header - Streamlined Branding */}
          <header className="flex h-16 shrink-0 items-center justify-between px-4 lg:hidden bg-white border-b sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-slate-500 hover:text-primary transition-colors" />
              <div className="flex items-center gap-2">
                <div className="bg-[#722F37] w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 100 100" className="w-5 h-5 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M30 40C30 30 40 25 50 25C60 25 70 30 70 40V75M40 75V40C40 35 45 32 50 32C55 32 60 35 60 40V75" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-xs tracking-tighter uppercase text-slate-900 leading-none">conex</span>
                  <span className="text-[8px] font-black tracking-[0.2em] uppercase text-primary leading-none mt-0.5">media</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-slate-400">LVL {user.level || 1}</span>
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${Math.min(100, ((user.xp || 0) % 1000) / 10)}%` }} 
                    />
                  </div>
                </div>
                <span className="text-[7px] font-black text-primary uppercase tracking-tighter">{user.xp || 0} XP</span>
              </div>
              <Link href="/dashboard/settings" className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </header>

          <div className="w-full p-4 md:p-6 lg:p-10 pb-24 lg:pb-12">
            {/* PC Settings Button - top right, desktop only */}
            <div className="hidden lg:flex justify-end mb-4">
              <Link href="/dashboard/settings" className="flex items-center gap-2 h-9 px-4 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 transition-colors text-sm font-bold shadow-sm">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
            {children}
          </div>
          
          {/* Global Quick Actions */}
          <QuickActions />

          {/* Mobile Bottom Navigation Bar */}
          <MobileNav />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
