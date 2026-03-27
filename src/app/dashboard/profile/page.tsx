'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

/**
 * Tactical Profile Sector - DECOMMISSIONED
 * Identity management has been moved to Command Central.
 */
export default function ProfilePage() {
  return (
    <div className="max-w-2xl mx-auto py-20 animate-in fade-in duration-700">
      <Card className="border-2 border-dashed border-slate-200 bg-white shadow-none rounded-3xl overflow-hidden">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Section Decommissioned</h1>
            <p className="text-slate-500 font-medium max-w-sm">
              The internal Profile Node is currently offline for tactical maintenance. 
              Identity oversight is now handled exclusively by Operations Command.
            </p>
          </div>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
              Security Protocol: Lockdown Active
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
