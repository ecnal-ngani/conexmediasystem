'use client';

import { Bell, Zap, Plus, HelpCircle } from 'lucide-react';

export function QuickActions() {
  return (
    <>
      {/* Main Quick Actions (Bottom Right) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-30 pointer-events-none">
        <button className="pointer-events-auto relative w-10 h-10 md:w-12 md:h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95 group">
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          <span className="absolute -top-1 -right-1 bg-red-800 border-2 border-white text-[9px] font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center">3</span>
        </button>
        <button className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform active:scale-95">
          <Zap className="w-4 h-4 md:w-5 md:h-5" />
        </button>
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
