'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldAlert, Lock, ArrowRight, Loader2, Home, Building2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 shadow-xl shadow-primary/20">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            CONEX MEDIA
          </h1>
          <p className="mt-2 text-muted-foreground">
            Authorized Personnel Only
          </p>
        </div>

        <Card className="border-2 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Secure Login
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the private network.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@conex.private" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Security Token</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-muted/30"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isWfh ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {isWfh ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold">Work From Home?</Label>
                    <p className="text-xs text-muted-foreground">Requires biometric check</p>
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
              <Button type="submit" className="w-full text-lg h-12 font-semibold group" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Initialize System Access
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              
              <Alert className="bg-muted/30 border-dashed">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-[10px] leading-tight text-muted-foreground">
                  <strong>DEMO ACCESS:</strong><br />
                  CEO: s.jenkins@conex.private<br />
                  Analyst: m.chen@conex.private
                </AlertDescription>
              </Alert>

              <p className="text-xs text-center text-muted-foreground px-6">
                By signing in, you agree to the <span className="underline cursor-pointer">Classified Media Policy</span>.
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Status</div>
            <div className="text-sm font-semibold flex items-center justify-center gap-1.5 text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              All Systems Nominal
            </div>
          </div>
          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
            <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Encrypted</div>
            <div className="text-sm font-semibold text-primary">AES-256 E2EE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
