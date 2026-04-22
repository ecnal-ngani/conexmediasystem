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
import { usePathname } from 'next/navigation';
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
import { cn } from '@/lib/utils';

// Navigation items - Profile removed as it is now integrated into the header summary
const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Production Hub', url: '/dashboard/production', icon: Layers },
  { title: 'Schedule', url: '/dashboard/calendar', icon: Calendar },
  { title: 'Administration', url: '/dashboard/admin', icon: Users, adminOnly: true },
];

const ConexLogo = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className="flex items-center gap-2 overflow-hidden">
    <div className="bg-[#722F37] min-w-[36px] w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-md">
      <svg viewBox="0 0 100 100" className="w-6 h-6 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 40C30 30 40 25 50 25C60 25 70 30 70 40V75M40 75V40C40 35 45 32 50 32C55 32 60 35 60 40V75" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-30" />
      </svg>
    </div>
    {!isCollapsed && (
      <div className="flex flex-col">
        <span className="font-bold text-sm tracking-tight uppercase text-slate-900 leading-none">CONEX</span>
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-primary leading-none mt-1">MEDIA</span>
      </div>
    )}
  </div>
);

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (!user) return null;

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && user.role !== 'ADMIN') return false;
    // if (item.url === '/dashboard/production' && user.role === 'INTERN') return false;
    return true;
  });

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      <SidebarHeader className={cn(
        "h-20 flex flex-row items-center border-b transition-all relative",
        isCollapsed ? "px-0 justify-center" : "px-4 justify-between"
      )}>
        <ConexLogo isCollapsed={isCollapsed} />
        {!isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex text-slate-400 hover:text-primary hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-8 bg-white border rounded-full p-1 shadow-md hover:text-primary z-50"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-6 overflow-y-auto">
        {/* User Profile Summary - Now the primary gateway to the profile page */}
        <Link href="/dashboard/profile" className={cn(
          "mb-8 flex items-center gap-3 w-full p-2 rounded-xl transition-all hover:bg-slate-50 active:scale-[0.98] group",
          isCollapsed ? "justify-center" : "px-2"
        )}>
          <div className="relative shrink-0">
            <Avatar className={cn(
              "border-2 border-white shadow-sm ring-1 ring-slate-100",
              isCollapsed ? "w-10 h-10" : "w-12 h-12"
            )}>
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary text-white font-bold text-xs">
                {user.name.substring(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className={cn(
              "absolute bottom-0.5 right-0.5 border-2 border-white rounded-full shadow-sm",
              isCollapsed ? "w-2.5 h-2.5" : "w-3 h-3",
              user.status === 'Office' ? "bg-green-500" : 
              user.status === 'WFH' ? "bg-orange-500" : "bg-slate-300"
            )}></span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden flex-1 text-left">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-slate-900 truncate leading-tight group-hover:text-primary transition-colors">{user.name}</p>
                <Badge className="h-4 px-1 text-[8px] font-black bg-primary/10 text-primary border-primary/20">LVL {user.level || 1}</Badge>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 font-mono">
                {user.systemId}
              </p>
              
              {/* Mini XP Bar */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-tighter text-slate-400">
                  <span>Progress</span>
                  <span>{user.xp || 0} / 1000 XP</span>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((user.xp || 0) % 1000) / 10)}%` }} 
                  />
                </div>
              </div>
            </div>
          )}
        </Link>

        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url}
                tooltip={item.title}
                className={cn(
                  "h-11 rounded-xl transition-all mb-1.5",
                  pathname === item.url 
                    ? 'bg-primary text-white font-bold hover:bg-primary/90 shadow-md' 
                    : 'text-slate-600 hover:bg-slate-100',
                  isCollapsed ? "px-0 justify-center" : "px-3"
                )}
              >
                <Link href={item.url} className="flex items-center gap-3">
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0",
                    pathname === item.url ? 'text-white' : 'text-slate-400'
                  )} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium tracking-tight">
                      {item.title}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
        <Button 
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full text-slate-600 hover:text-primary hover:bg-red-50 font-bold h-11 rounded-xl transition-all flex items-center gap-3 px-3",
            isCollapsed ? "justify-center p-0" : "justify-start"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-xs font-bold">Logout</span>}
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}