'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  LogOut,
  Shield,
  Bell,
  Globe,
  Fingerprint,
  User,
  ChevronRight,
  Smartphone,
  Lock,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!user || !mounted) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    toast({ title: "Signed Out", description: "You have been logged out successfully." });
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={cn(
        "w-12 h-6 rounded-full transition-colors relative shrink-0",
        enabled ? "bg-primary" : "bg-slate-200"
      )}
    >
      <span className={cn(
        "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
        enabled ? "translate-x-7" : "translate-x-1"
      )} />
    </button>
  );

  const SettingRow = ({ icon: Icon, label, description, children, onClick }: any) => (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl transition-colors",
        onClick ? "hover:bg-slate-50 cursor-pointer" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{label}</p>
          {description && <p className="text-xs text-slate-500 font-medium mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {children}
        {onClick && <ChevronRight className="w-4 h-4 text-slate-300" />}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-red-100">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Settings</h1>
          <p className="text-xs text-slate-400 font-medium">System preferences & account controls</p>
        </div>
      </div>

      {/* Account Info */}
      <Card className="border shadow-none rounded-[28px] bg-white overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-primary" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-1">
          <SettingRow
            icon={User}
            label={user.name}
            description={user.email}
            onClick={() => router.push('/dashboard/profile')}
          >
            <Badge className="bg-primary/10 text-primary font-black text-[9px] border-none uppercase">
              {user.role.replace('_', ' ')}
            </Badge>
          </SettingRow>
          <SettingRow icon={Fingerprint} label="System ID" description={user.systemId || 'Not assigned'} />
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border shadow-none rounded-[28px] bg-white overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-primary" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-1">
          <SettingRow icon={Bell} label="Notifications" description="Activity alerts and system updates">
            <Toggle enabled={notifications} onChange={() => {
              setNotifications(!notifications);
              toast({ title: notifications ? "Notifications Off" : "Notifications On" });
            }} />
          </SettingRow>
          <SettingRow icon={Globe} label="Language" description="English (Default)" />
          <SettingRow icon={Smartphone} label="Mobile App" description="Access from any device" />
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border shadow-none rounded-[28px] bg-white overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-1">
          <SettingRow icon={Lock} label="Authentication" description="Firebase Auth — Secure Session" />
          <SettingRow icon={Shield} label="Access Level">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-black text-[9px]">VERIFIED</Badge>
          </SettingRow>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border shadow-none rounded-[28px] bg-white overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-primary" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-1">
          <SettingRow icon={Info} label="Conex Media System" description="Production Management Platform v1.0" />
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button
        onClick={handleLogout}
        variant="destructive"
        className="w-full h-14 rounded-2xl text-base font-black shadow-lg shadow-red-100 gap-3"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </Button>
    </div>
  );
}
