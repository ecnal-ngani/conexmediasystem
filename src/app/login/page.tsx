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
  Building2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isWfh, setIsWfh] = useState(false);
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, isWfh);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-xl shadow-primary/20">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl uppercase">
            CONEX MEDIA
          </h1>
          <p className="mt-2 text-muted-foreground font-medium">
            Authorized Personnel Only
          </p>
        </div>

        <Card className="border shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 bg-slate-50/50 p-8 border-b">
            <CardTitle className="text-xl flex items-center gap-2 font-black tracking-tight">
              <Lock className="w-5 h-5 text-primary" />
              Secure Login
            </CardTitle>
            <CardDescription className="font-medium">
              Enter credentials to initialize security check.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 p-8">
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
                  className="bg-white border-slate-200 h-12 rounded-xl focus-visible:ring-primary shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Security Token</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-white border-slate-200 h-12 rounded-xl focus-visible:ring-primary shadow-sm"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isWfh ? 'bg-primary text-white' : 'bg-white border text-slate-400'}`}>
                    {isWfh ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold">WFH Access?</Label>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">Requires Biometric</p>
                  </div>
                </div>
                <Switch 
                  checked={isWfh} 
                  onCheckedChange={setIsWfh} 
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 p-8 pt-0">
              <Button type="submit" className="w-full text-sm h-14 font-black rounded-2xl group bg-primary hover:bg-primary/90 shadow-xl shadow-red-100 transition-all active:scale-[0.98]" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    INITIALIZE ACCESS
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="grid grid-cols-2 gap-4 text-center px-2">
          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Status</div>
            <div className="text-[10px] font-black flex items-center justify-center gap-1.5 text-green-600 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Nominal
            </div>
          </div>
          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="text-[8px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Encrypted</div>
            <div className="text-[10px] font-black text-primary uppercase">AES-256</div>
          </div>
        </div>
      </div>
    </div>
  );
}
