'use client';

import * as React from 'react';
import { 
  Home, 
  Layers, 
  Calendar, 
  BarChart3, 
  Users, 
  ChevronLeft,
  ChevronRight,
  Command,
  LogOut,
  UserCircle
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
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
  { title: 'Admin & HR', url: '/dashboard/admin', icon: Users },
  { title: 'Profile', url: '/dashboard/profile', icon: UserCircle },
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
        "h-20 flex flex-row items-center border-b transition-all duration-300",
        isCollapsed ? "px-2 justify-center" : "px-4 justify-between"
      )}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-[#722F37] min-w-[32px] w-8 h-8 rounded flex items-center justify-center shrink-0 shadow-sm">
            <Command className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-sm tracking-tight truncate uppercase animate-in fade-in duration-500">
              conex media
            </span>
          )}
        </div>
        {!isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {isCollapsed && (
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-8 bg-white border rounded-full p-0.5 shadow-md hover:text-red-500 z-50"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-0 py-6">
        {/* Centralized Profile Section */}
        <div 
          onClick={() => router.push('/dashboard/profile')}
          className={cn(
            "mb-8 transition-all duration-300 cursor-pointer group hover:bg-slate-50 rounded-lg mx-2 p-2",
            isCollapsed ? "flex justify-center" : ""
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className={cn(
                "border-2 border-white shadow-md transition-all duration-300",
                isCollapsed ? "w-8 h-8" : "w-10 h-10"
              )}>
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-primary text-white font-bold text-xs">
                  {user.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <span className={cn(
                "absolute bottom-0 right-0 bg-green-500 border-2 border-white rounded-full transition-all duration-300",
                isCollapsed ? "w-2 h-2" : "w-2.5 h-2.5"
              )}></span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500">
                <p className="text-xs font-bold leading-none mb-1 truncate group-hover:text-[#E11D48] transition-colors">{user.name}</p>
                <p className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1 rounded inline-block mb-1 truncate max-w-full">
                  {user.systemId}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded leading-none">
                    In Office
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <SidebarMenu className="px-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url}
                tooltip={item.title}
                className={cn(
                  "h-11 rounded-lg transition-all mb-1",
                  pathname === item.url 
                    ? 'bg-[#E11D48] text-white font-medium hover:bg-[#E11D48]/90 shadow-md shadow-red-100' 
                    : 'text-slate-600 hover:bg-slate-100',
                  isCollapsed ? "px-0 justify-center" : "px-3"
                )}
              >
                <Link href={item.url} className="flex items-center gap-3">
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0",
                    pathname === item.url ? 'text-white' : 'text-slate-400'
                  )} />
                  {!isCollapsed && <span className="text-sm truncate">{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t bg-slate-50/30">
        <Button 
          variant="default"
          onClick={logout}
          className={cn(
            "w-full bg-[#E11D48] hover:bg-[#E11D48]/90 text-white font-bold h-11 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-[0.98] flex items-center gap-3 px-3",
            isCollapsed ? "justify-center p-0" : "justify-start"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm">Log Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
