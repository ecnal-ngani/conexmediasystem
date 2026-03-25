
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { 
  ShieldAlert, 
  Lock, 
  ArrowRight, 
  Loader2, 
  Home, 
  Building2, 
  Info, 
  ShieldCheck, 
  User as UserIcon, 
  GraduationCap, 
  ChevronLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

type RoleId = 'admin' | 'employee' | 'intern';

export default function LoginPage() {
  const [view, setView] = useState<'welcome' | 'role' | 'login'>('welcome');
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isWfh, setIsWfh] = useState(false);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, isWfh, selectedRole || undefined);
      toast({
        title: "Initial Check Passed",
        description: isWfh ? "Please proceed to biometric verification." : "Welcome back to the CONEX MEDIA secure perimeter.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: err.message || "Please check your credentials and try again.",
      });
    }
  };

  const roles = [
    { id: 'admin' as RoleId, title: 'Administrator', icon: ShieldCheck, description: 'Command & Staff Control' },
    { id: 'employee' as RoleId, title: 'Employee', icon: UserIcon, description: 'Operations & Production' },
    { id: 'intern' as RoleId, title: 'Intern', icon: GraduationCap, description: 'Support & Training' },
  ];

  const handleRoleSelect = (roleId: RoleId) => {
    setSelectedRole(roleId);
    // Removed auto-filling of demo emails to prevent unintended "auto-login" feel
    setEmail(''); 
    setPassword('');
    setView('login');
  };

  if (view === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 animate-in fade-in duration-1000">
        <div className="flex flex-col items-center text-center space-y-2 mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">CONEX Media</h1>
          <p className="text-slate-500 font-medium">Private Network</p>
        </div>

        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-red-100 mb-12">
          <Lock className="w-10 h-10 text-white" />
        </div>

        <Button 
          onClick={() => setView('role')}
          className="w-full max-w-[320px] h-14 bg-primary hover:bg-primary/90 text-white font-medium text-lg rounded-none transition-all active:scale-[0.98]"
        >
          Initialize Login
        </Button>

        <p className="mt-12 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
          Authorized Personnel Only
        </p>
      </div>
    );
  }

  if (view === 'role') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Access Node</h1>
          <p className="text-slate-500 font-medium text-lg">Identify your clearance level to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className="flex flex-col items-center justify-center aspect-square bg-white border border-slate-100 rounded-none shadow-sm p-12 space-y-6 hover:border-primary/20 hover:shadow-2xl hover:shadow-slate-100 transition-all group relative overflow-hidden"
            >
              <div className="w-20 h-20 rounded-full border border-slate-100 flex items-center justify-center bg-slate-50 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-500">
                <role.icon className="w-10 h-10 text-slate-600 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors block">{role.title}</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2 block">{role.description}</span>
              </div>
            </button>
          ))}
        </div>

        <button 
          className="mt-20 text-slate-400 text-sm font-medium flex items-center gap-2 hover:text-primary transition-colors"
          onClick={() => setView('welcome')}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Welcome
        </button>
      </div>
    );
  }

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-xl shadow-primary/20">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl uppercase">
            {selectedRole === 'admin' ? 'Command Access' : 'Private Network'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {selectedRoleData?.title} Authentication Node
          </p>
        </div>

        <Card className="border shadow-2xl bg-white">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Secure Login
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setView('role')} 
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:bg-primary/5 h-8 px-2"
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                Switch Role
              </Button>
            </div>
            <CardDescription>
              Enter credentials for {selectedRoleData?.title} clearance.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authorized Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@conex.private" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200 h-11 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Token</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200 h-11 focus-visible:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isWfh ? 'bg-primary/10 text-primary' : 'bg-white border text-slate-400'}`}>
                    {isWfh ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">Remote Node Access?</Label>
                    <p className="text-[9px] font-medium text-slate-400">Requires biometric sync</p>
                  </div>
                </div>
                <Switch 
                  checked={isWfh} 
                  onCheckedChange={setIsWfh} 
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full text-sm h-12 font-bold group bg-primary hover:bg-primary/90 shadow-lg shadow-red-100" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Initialize Security Check
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              
              <Alert className="bg-slate-50 border-dashed border-slate-200">
                <Info className="h-4 w-4 text-slate-400" />
                <AlertDescription className="text-[10px] leading-tight text-slate-500">
                  <strong>DEMO ACCESS:</strong> Use <code>admin@conex.private</code>, <code>employee@conex.private</code>, or <code>intern@conex.private</code>.
                </AlertDescription>
              </Alert>

              <p className="text-[10px] text-center text-slate-400 px-6 font-medium">
                By signing in, you agree to the <span className="underline cursor-pointer hover:text-primary transition-colors">Classified Media Policy</span>.
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-white border border-slate-100 rounded-xl">
            <div className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Status</div>
            <div className="text-xs font-bold flex items-center justify-center gap-1.5 text-green-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              All Systems Nominal
            </div>
          </div>
          <div className="p-3 bg-white border border-slate-100 rounded-xl">
            <div className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Encrypted</div>
            <div className="text-xs font-bold text-primary">AES-256 E2EE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
