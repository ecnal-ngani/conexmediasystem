'use client';

import { useState } from 'react';
import { 
  Bell, 
  Zap, 
  Plus, 
  HelpCircle, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
  Trash2
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
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

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'Rush Deadline Approaching',
    description: 'CJC Eco Bag project due in 2 hours - Final review needed',
    time: '5 minutes ago',
    type: 'rush',
    icon: ShieldAlert,
  },
  {
    id: '2',
    title: 'Project Approved',
    description: 'Shimmer & Shield tutorial reel has been approved by QA',
    time: '1 hour ago',
    type: 'approved',
    icon: CheckCircle2,
    canDelete: true
  },
  {
    id: '3',
    title: 'Client Revision Requested',
    description: 'Keto Lifestyle animation needs color adjustments',
    time: '3 hours ago',
    type: 'revision',
    icon: Clock,
  },
  {
    id: '4',
    title: 'New Shoot Scheduled',
    description: 'Solarmaxx shoot assigned for Feb 12, 2026 at Studio A',
    time: '5 hours ago',
    type: 'info',
    icon: Bell,
  },
  {
    id: '5',
    title: 'Team Member Update',
    description: 'Clark Tadeo marked as "In Office" for today',
    time: '1 day ago',
    type: 'info',
    icon: Bell,
  },
];

export function QuickActions() {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'rush':
        return 'bg-red-50 border-red-500';
      case 'approved':
        return 'bg-green-50 border-green-500';
      case 'revision':
        return 'bg-orange-50 border-orange-500';
      default:
        return 'bg-white border-slate-100';
    }
  };

  const getIconStyles = (type: string) => {
    switch (type) {
      case 'rush':
        return 'text-red-500 bg-white';
      case 'approved':
        return 'text-green-500 bg-white';
      case 'revision':
        return 'text-orange-500 bg-white';
      default:
        return 'text-blue-500 bg-white';
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
        {/* Notifications Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="pointer-events-auto relative w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95 group">
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              <span className="absolute -top-1 -right-1 bg-red-800 border-2 border-white text-[9px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">3</span>
            </button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md p-0 border-none rounded-l-3xl overflow-hidden">
            <div className="flex flex-col h-full bg-white">
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-red-200">
                    <Bell className="w-6 h-6 text-white" />
                    <span className="absolute top-6 left-14 bg-red-800 border-2 border-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center text-white">3</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
                    <p className="text-sm text-slate-500 font-medium">3 unread notifications</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-none font-bold text-xs hover:bg-blue-100">
                  Mark all as read
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {NOTIFICATIONS.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all relative group",
                      getNotificationStyles(notif.type)
                    )}
                  >
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-100 shadow-sm",
                        getIconStyles(notif.type)
                      )}>
                        <notif.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 leading-none">{notif.title}</h4>
                          {notif.canDelete && (
                            <Trash2 className="w-4 h-4 text-red-300 hover:text-red-500 cursor-pointer transition-colors" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-tight pr-4">
                          {notif.description}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[10px] text-slate-400 font-medium">{notif.time}</span>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 rounded-lg">
                            Mark as read
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick Actions Trigger */}
        <Dialog open={isActionsOpen} onOpenChange={setIsActionsOpen}>
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
                    onClick={() => setIsActionsOpen(false)}
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
        
        <button className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95">
          <Plus className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      <div className="fixed bottom-4 left-4 z-30">
        <button className="w-7 h-7 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
