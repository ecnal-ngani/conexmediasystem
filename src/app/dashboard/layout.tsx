'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Loader2, Command } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
              <div className="bg-[#722F37] w-6 h-6 rounded flex items-center justify-center">
                <Command className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight">conex media</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}