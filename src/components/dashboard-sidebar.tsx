
'use client';

import * as React from 'react';
import { 
  LayoutDashboard, 
  UserCircle, 
  BrainCircuit, 
  ShieldCheck, 
  LogOut, 
  Search,
  BookOpen,
  PieChart,
  Settings
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
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'AI Curator', url: '/dashboard/curator', icon: BrainCircuit, badge: 'Smart' },
  { title: 'Resources', url: '/dashboard/resources', icon: BookOpen },
  { title: 'Analytics', url: '/dashboard/analytics', icon: PieChart },
];

const accountItems = [
  { title: 'My Profile', url: '/dashboard/profile', icon: UserCircle },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="h-20 flex items-center px-4">
        <div className="flex items-center gap-3 w-full">
          <div className="bg-primary p-2 rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-bold text-lg leading-tight">CONEX</h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Gateway Access</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarSeparator />
      
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          <div className="px-2 mb-2 text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider group-data-[collapsible=icon]:hidden">
            Navigation
          </div>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url}
                tooltip={item.title}
                className={`h-11 transition-all ${pathname === item.url ? 'bg-secondary/20 text-primary font-semibold' : ''}`}
              >
                <Link href={item.url}>
                  <item.icon className={pathname === item.url ? 'text-primary' : ''} />
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20 text-[10px] h-4 group-data-[collapsible=icon]:hidden">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="mt-8">
          <SidebarMenu>
            <div className="px-2 mb-2 text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider group-data-[collapsible=icon]:hidden">
              System
            </div>
            {accountItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className={`h-11 transition-all ${pathname === item.url ? 'bg-secondary/20 text-primary font-semibold' : ''}`}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 bg-muted/30">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="w-9 h-9 border border-primary/20">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <Badge variant="secondary" className="text-[10px] h-4 px-1 leading-none bg-accent text-accent-foreground">
                {user.role}
              </Badge>
            </div>
          </div>
          <SidebarMenuButton 
            onClick={logout}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-10 transition-colors"
          >
            <LogOut />
            <span>Sign Out Gateway</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
