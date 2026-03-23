'use client';

import * as React from 'react';
import { 
  Home, 
  Layers, 
  Calendar, 
  Users, 
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/components/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Production', url: '/dashboard/production', icon: Layers },
  { title: 'Calendar', url: '/dashboard/calendar', icon: Calendar },
  { title: 'Admin & HR', url: '/dashboard/admin', icon: Users, adminOnly: true },
];

const ConexLogo = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className="flex items-center gap-2 overflow-hidden">
    <div className="bg-[#722F37] min-w-[36px] w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-md">
      {/* Tactical SVG Logo Mark */}
      <svg viewBox="0 0 100 100" className="w-6 h-6 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 40C30 30 40 25 50 25C60 25 70 30 70 40V75M40 75V40C40 35 45 32 50 32C55 32 60 35 60 40V75" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-30" />
      </svg>
    </div>
    {!isCollapsed && (
      <div className="flex flex-col animate-in slide-in-from-left-2 duration-500">
        <span className="font-black text-sm tracking-tighter uppercase text-slate-900 leading-none">conex</span>
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-primary leading-none mt-1">media</span>
      </div>
    )}
  </div>
);

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (!user) return null;

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && user.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r bg-white transition-all duration-300 ease-in-out">
      <SidebarHeader className={cn(
        "h-20 flex flex-row items-center border-b transition-all duration-300 relative",
        isCollapsed ? "px-0 justify-center" : "px-4 justify-between"
      )}>
        <ConexLogo isCollapsed={isCollapsed} />
        {!isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-8 bg-white border rounded-full p-1 shadow-md hover:text-red-500 z-50 transition-transform hover:scale-110"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-0 py-6 overflow-hidden">
        <ScrollArea className="h-full px-2">
          {/* Centralized Profile Section */}
          <SidebarMenu className="mb-8">
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => router.push('/dashboard/profile')}
                className={cn(
                  "h-auto py-2 transition-all duration-300 group hover:bg-slate-50 rounded-xl",
                  isCollapsed ? "justify-center px-0" : "px-2"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Avatar className={cn(
                      "border-2 border-white shadow-md transition-all duration-300",
                      isCollapsed ? "w-10 h-10" : "w-12 h-12"
                    )}>
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="bg-primary text-white font-black text-xs">
                        {user.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      "absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full transition-all duration-300",
                      isCollapsed ? "w-2 h-2" : "w-3 h-3"
                    )}></span>
                  </div>
                  {!isCollapsed && (
                    <div className="overflow-hidden animate-in slide-in-from-left-4 duration-500 flex-1">
                      <p className="text-sm font-black leading-none mb-1.5 truncate group-hover:text-[#E11D48] transition-colors">{user.name}</p>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-blue-600 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded inline-block truncate w-fit max-w-full">
                          {user.systemId}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded leading-none w-fit">
                            In Office
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarMenu>
            {filteredNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className={cn(
                    "h-12 rounded-xl transition-all mb-1.5",
                    pathname === item.url 
                      ? 'bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-red-100' 
                      : 'text-slate-600 hover:bg-slate-100',
                    isCollapsed ? "px-0 justify-center" : "px-3"
                  )}
                >
                  <Link href={item.url} className="flex items-center gap-3">
                    <item.icon className={cn(
                      "w-5 h-5 shrink-0 transition-colors",
                      pathname === item.url ? 'text-white' : 'text-slate-400'
                    )} />
                    {!isCollapsed && (
                      <span className="text-sm font-bold truncate tracking-tight animate-in slide-in-from-left-3 duration-500">
                        {item.title}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t bg-slate-50/30">
        <Button 
          variant="default"
          onClick={logout}
          className={cn(
            "w-full bg-primary hover:bg-primary/90 text-white font-black h-12 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-[0.97] flex items-center gap-3 px-3",
            isCollapsed ? "justify-center p-0" : "justify-start"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-xs uppercase tracking-wider font-bold animate-in slide-in-from-left-2 duration-500">Log Out</span>}
        </Button>
      </SidebarFooter>
      <SidebarRail className="hover:bg-primary/5 transition-colors" />
    </Sidebar>
  );
}