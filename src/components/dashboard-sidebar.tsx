'use client';

import * as React from 'react';
import { 
  Home, 
  Layers, 
  Calendar, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Command,
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
  useSidebar
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Production', url: '/dashboard/production', icon: Layers },
  { title: 'Calendar', url: '/dashboard/calendar', icon: Calendar },
  { title: 'Admin & HR', url: '/dashboard/admin', icon: Users },
];

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (!user) return null;

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      <SidebarHeader className={cn(
        "h-24 flex flex-row items-center border-b transition-all duration-300 relative",
        isCollapsed ? "px-0 justify-center" : "px-6 justify-between"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-[#722F37] min-w-[44px] w-11 h-11 rounded-lg flex items-center justify-center shrink-0 shadow-md">
            <Command className="w-7 h-7 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-black text-lg tracking-tighter truncate uppercase animate-in fade-in duration-500 text-slate-900">
              conex media
            </span>
          )}
        </div>
        {!isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-10 bg-white border rounded-full p-1 shadow-md hover:text-red-500 z-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-0 py-8 overflow-x-hidden">
        {/* Centralized Profile Section */}
        <SidebarMenu className="px-3 mb-10">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => router.push('/dashboard/profile')}
              className={cn(
                "h-auto py-3 transition-all duration-300 group hover:bg-slate-50 rounded-xl",
                isCollapsed ? "justify-center px-0" : "px-3"
              )}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="relative shrink-0 flex items-center justify-center">
                  <Avatar className={cn(
                    "border-2 border-white shadow-lg transition-all duration-300",
                    isCollapsed ? "w-10 h-10" : "w-14 h-14"
                  )}>
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="bg-primary text-white font-black text-sm">
                      {user.name.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full transition-all duration-300",
                    isCollapsed ? "w-2.5 h-2.5" : "w-3.5 h-3.5"
                  )}></span>
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500 flex-1">
                    <p className="text-sm font-black leading-none mb-2 truncate group-hover:text-[#E11D48] transition-colors">{user.name}</p>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded inline-block truncate w-fit max-w-full">
                        {user.systemId}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded leading-none w-fit">
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

        <SidebarMenu className="px-3">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url}
                tooltip={item.title}
                className={cn(
                  "h-14 rounded-xl transition-all mb-2",
                  pathname === item.url 
                    ? 'bg-primary text-white font-bold hover:bg-primary/90 shadow-xl shadow-red-200' 
                    : 'text-slate-600 hover:bg-slate-100',
                  isCollapsed ? "px-0 justify-center" : "px-4"
                )}
              >
                <Link href={item.url} className="flex items-center gap-4">
                  <item.icon className={cn(
                    "w-6 h-6 shrink-0",
                    pathname === item.url ? 'text-white' : 'text-slate-400'
                  )} />
                  {!isCollapsed && <span className="text-base font-bold truncate tracking-tight">{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t bg-slate-50/30">
        <Button 
          variant="default"
          onClick={logout}
          className={cn(
            "w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-xl shadow-xl shadow-red-200 transition-all active:scale-[0.97] flex items-center gap-4 px-4",
            isCollapsed ? "justify-center p-0" : "justify-start"
          )}
        >
          <LogOut className="w-6 h-6 shrink-0" />
          {!isCollapsed && <span className="text-base uppercase tracking-wider">Log Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
