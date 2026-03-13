'use client';

import { useState } from 'react';
import { 
  Bell, 
  Zap, 
  Plus, 
  HelpCircle, 
  Calendar, 
  FileText, 
  Users, 
  TrendingUp, 
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const QUICK_ACTIONS = [
  {
    title: 'New Project',
    description: 'Create a new production item',
    icon: Plus,
    color: 'text-red-500',
    bg: 'bg-red-50',
    href: '/dashboard/production'
  },
  {
    title: 'Schedule Shoot',
    description: 'Add a new shoot to calendar',
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    href: '/dashboard/calendar'
  },
  {
    title: 'View Reports',
    description: 'Access analytics and reports',
    icon: FileText,
    color: 'text-green-600',
    bg: 'bg-green-50',
    href: '/dashboard/curator'
  },
  {
    title: 'Team Management',
    description: 'Manage staff and roles',
    icon: Users,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    href: '/dashboard/admin'
  },
  {
    title: 'Performance',
    description: 'Check team performance',
    icon: TrendingUp,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    href: '/dashboard'
  },
  {
    title: 'Production Matrix',
    description: 'View all projects',
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    href: '/dashboard/production'
  }
];

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Global Quick Action FABs */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
        {/* Notifications */}
        <button className="pointer-events-auto relative w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95 group">
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          <span className="absolute -top-1 -right-1 bg-red-800 border-2 border-white text-[9px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">3</span>
        </button>

        {/* Quick Actions Triggered by Lightning */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95">
              <Zap className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[90vw] p-0 overflow-hidden border-none rounded-3xl">
            <div className="p-6 space-y-6">
              <DialogHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-red-200">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">Quick Actions</DialogTitle>
                </div>
                <DialogDescription className="text-sm font-medium text-slate-500">
                  Shortcuts to frequently used features
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                {QUICK_ACTIONS.map((action, i) => (
                  <Link 
                    key={i} 
                    href={action.href}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary/20 hover:shadow-md transition-all group"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", action.bg)}>
                      <action.icon className={cn("w-5 h-5", action.color)} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{action.title}</h4>
                      <p className="text-[10px] font-medium text-slate-400 leading-tight">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <DialogClose asChild>
                  <Button className="bg-primary hover:bg-primary/90 font-bold px-8 h-11 rounded-xl shadow-lg shadow-red-100">
                    Close
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Regular Add Button */}
        <button className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95">
          <Plus className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Help FAB (Bottom Left) */}
      <div className="fixed bottom-4 left-4 z-30">
        <button className="w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
