'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Layers, 
  Calendar, 
  ShieldCheck,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth-context';

const navItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Hub', url: '/dashboard/production', icon: Layers },
  { title: 'Calendar', url: '/dashboard/calendar', icon: Calendar },
  { title: 'Profile', url: '/dashboard/profile', icon: User },
  { title: 'Admin', url: '/dashboard/admin', icon: ShieldCheck, adminOnly: true },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && user.role !== 'ADMIN') return false;
    return true;
  });

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <nav className="flex items-center justify-around h-16 px-2">
        {filteredItems.map((item) => {
          const isActive = pathname === item.url;
          return (
            <Link 
              key={item.url} 
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 relative",
                isActive ? "text-primary" : "text-slate-400"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full animate-in fade-in slide-in-from-top-1" />
              )}
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
