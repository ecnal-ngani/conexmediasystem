
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, UserCircle, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      toast({
        title: "Profile Updated",
        description: "Your system preferences have been synchronized.",
      });
    }, 1000);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 border-b pb-6">
        <UserCircle className="w-10 h-10 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Profile Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 border-2">
          <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-lg">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-2xl">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge className="bg-primary hover:bg-primary/90">
              {user.role} ACCESS LEVEL
            </Badge>
            <div className="w-full pt-4 space-y-2 border-t text-left">
              <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Clearance Status</p>
              <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Active Perimeter
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-xl border-2">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Update your public-facing profile and resource consumption preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Encrypted Email</Label>
                <Input id="email" defaultValue={user.email} disabled className="bg-muted/50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferences">AI Recommendation Preferences</Label>
              <Textarea 
                id="preferences" 
                placeholder="What kind of content should the AI curate for you?"
                defaultValue={user.preferences}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This information is used by the CONEX AI Curator to suggest relevant resources.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t flex justify-end px-6 py-4">
            <Button onClick={handleSave} disabled={isUpdating} className="gap-2 bg-primary h-11 px-8 font-semibold">
              {isUpdating ? "Synchronizing..." : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
