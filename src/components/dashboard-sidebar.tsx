'use client';

import * as React from 'react';
import { 
  Home, 
  Layers, 
  Calendar, 
  BarChart3, 
  Users, 
  ChevronLeft,
  Command,
  LogOut,
  Sparkles
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
  useSidebar
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'AI Curator', url: '/dashboard/curator', icon: Sparkles },
  { title: 'Production', url: '/dashboard/production', icon: Layers },
  { title: 'Calendar', url: '/dashboard/calendar', icon: Calendar },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
  { title: 'Admin & HR', url: '/dashboard/admin', icon: Users },
];

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();

  if (!user) return null;

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      <SidebarHeader className="h-20 flex flex-row items-center px-4 justify-between border-b">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-[#722F37] min-w-[32px] w-8 h-8 rounded flex items-center justify-center shrink-0">
            <Command className="w-5 h-5 text-white" />
          </div>
          {state === 'expanded' && (
            <span className="font-bold text-sm tracking-tight truncate uppercase">conex media</span>
          )}
        </div>
        {state === 'expanded' && (
          <button 
            onClick={toggleSidebar}
            className="hidden lg:flex text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </SidebarHeader>
      
      <SidebarContent className="px-0 py-6">
        {/* Centralized Profile Section */}
        <div className="px-4 mb-8 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-primary text-white font-bold">{user.name.substring(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            {state === 'expanded' && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold leading-none mb-1 truncate">{user.name}</p>
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
                className={`h-11 rounded-lg transition-all mb-1 px-3 ${pathname === item.url ? 'bg-[#E11D48] text-white font-medium hover:bg-[#E11D48]/90 shadow-md shadow-red-100' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Link href={item.url} className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 shrink-0 ${pathname === item.url ? 'text-white' : 'text-slate-400'}`} />
                  {state === 'expanded' && <span className="text-sm">{item.title}</span>}
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
          className={`w-full bg-[#E11D48] hover:bg-[#E11D48]/90 text-white font-bold h-11 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-[0.98] flex items-center gap-3 px-3 ${state === 'collapsed' ? 'justify-center p-0' : 'justify-start'}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {state === 'expanded' && <span className="text-sm">Log Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
