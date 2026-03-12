
'use client';

import * as React from 'react';
import { 
  Home, 
  Layers, 
  Calendar, 
  BarChart3, 
  Users, 
  User,
  ChevronLeft,
  Command
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
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Production', url: '/dashboard/production', icon: Layers },
  { title: 'Calendar', url: '/dashboard/calendar', icon: Calendar },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3 },
  { title: 'Admin & HR', url: '/dashboard/admin', icon: Users },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
];

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <Sidebar collapsible="none" className="border-r bg-white w-64">
      <SidebarHeader className="h-20 flex flex-row items-center px-6 justify-between border-b">
        <div className="flex items-center gap-2">
          <div className="bg-[#722F37] w-8 h-8 rounded flex items-center justify-center">
            <Command className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">conex</span>
        </div>
        <button className="text-destructive">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </SidebarHeader>
      
      <SidebarContent className="px-0 py-6">
        {/* Profile Card Section */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary text-white font-bold">{user.name.substring(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-bold leading-none mb-1">{user.name}</p>
              <p className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1 rounded inline-block mb-1">{user.systemId}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 rounded">In Office</span>
              </div>
            </div>
          </div>
        </div>

        <SidebarMenu className="px-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url}
                className={`h-11 rounded-lg transition-all mb-1 px-4 ${pathname === item.url ? 'bg-[#E11D48] text-white font-medium hover:bg-[#E11D48]/90' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Link href={item.url} className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${pathname === item.url ? 'text-white' : 'text-slate-400'}`} />
                  <span className="text-sm">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 mt-auto">
        <SidebarMenuButton 
          onClick={logout}
          className="text-slate-400 hover:bg-slate-100 h-10 rounded-lg transition-colors text-xs"
        >
          <span>Terminate Session</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
