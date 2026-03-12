'use client';

import * as React from 'react';
import { 
  LayoutDashboard, 
  UserCircle, 
  BrainCircuit, 
  ShieldCheck, 
  LogOut, 
  Search,
  Video,
  FileText,
  LineChart,
  Settings,
  Bell,
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
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { title: 'Command Center', url: '/dashboard', icon: LayoutDashboard },
  { title: 'AI Curator', url: '/dashboard/curator', icon: BrainCircuit, badge: 'Smart' },
  { title: 'Media Assets', url: '/dashboard/resources', icon: Video },
  { title: 'Strategic Reports', url: '/dashboard/analytics', icon: LineChart },
];

const accountItems = [
  { title: 'Executive Profile', url: '/dashboard/profile', icon: UserCircle },
  { title: 'System Config', url: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <Sidebar collapsible="icon" className="border-r-2 border-border/50 bg-white">
      <SidebarHeader className="h-24 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3 w-full">
          <div className="bg-primary w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Command className="w-7 h-7 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-black text-xl leading-none tracking-tighter uppercase">CONEX</h2>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">MEDIA PRO</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarSeparator />
      
      <SidebarContent className="px-3 py-6">
        <SidebarMenu>
          <div className="px-3 mb-4 text-[10px] uppercase font-black text-muted-foreground/40 tracking-[0.2em] group-data-[collapsible=icon]:hidden">
            Main Intelligence
          </div>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url}
                tooltip={item.title}
                className={`h-12 rounded-xl transition-all mb-1 ${pathname === item.url ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary/90' : 'hover:bg-secondary/20'}`}
              >
                <Link href={item.url}>
                  <item.icon className={pathname === item.url ? 'text-white' : 'text-muted-foreground'} />
                  <span>{item.title}</span>
                  {item.badge && pathname !== item.url && (
                    <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20 text-[10px] h-4 group-data-[collapsible=icon]:hidden">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="mt-10">
          <SidebarMenu>
            <div className="px-3 mb-4 text-[10px] uppercase font-black text-muted-foreground/40 tracking-[0.2em] group-data-[collapsible=icon]:hidden">
              Account Control
            </div>
            {accountItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className={`h-12 rounded-xl transition-all mb-1 ${pathname === item.url ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary/90' : 'hover:bg-secondary/20'}`}
                >
                  <Link href={item.url}>
                    <item.icon className={pathname === item.url ? 'text-white' : 'text-muted-foreground'} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-6 bg-muted/20 border-t">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="w-11 h-11 border-2 border-primary shadow-sm">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="font-bold">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
              <p className="text-sm font-black truncate leading-none mb-1">{user.name}</p>
              <Badge className="text-[9px] h-4 px-1.5 leading-none bg-primary font-bold rounded-sm uppercase">
                {user.role}
              </Badge>
            </div>
          </div>
          <SidebarMenuButton 
            onClick={logout}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-11 rounded-xl transition-colors font-bold"
          >
            <LogOut className="w-5 h-5" />
            <span>Terminate Session</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
