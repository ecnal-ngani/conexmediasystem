
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Award,
  Zap,
  Palette,
  Dumbbell,
  Edit2,
  Save,
  X,
  GraduationCap,
  BookOpen,
  CalendarDays
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (!user) return null;

  const handleSave = () => {
    updateUser({ name, email });
    setIsEditing(false);
    toast({
      title: "Identity Updated",
      description: "Your system profile has been successfully re-synchronized.",
    });
  };

  const isIntern = user.role === 'INTERN';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
        {!isEditing ? (
          <Button 
            onClick={() => setIsEditing(true)} 
            variant="outline" 
            className="border-primary/20 text-primary hover:bg-primary/5 font-bold gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsEditing(false)} 
              variant="ghost" 
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-primary hover:bg-primary/90 font-bold gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Main Profile Header Card */}
      <Card className="border shadow-none rounded-xl overflow-hidden bg-white">
        <div className="h-32 md:h-40 bg-[#E11D48]" /> {/* Signature Red Banner */}
        <CardContent className="relative px-6 md:px-8 pb-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 md:-mt-16">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-lg text-2xl font-bold shrink-0">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-[#1E293B] text-white">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left space-y-1 pb-2 flex-1">
              {isEditing ? (
                <div className="space-y-1 max-w-sm mx-auto md:mx-0">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Name</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="h-10 text-xl font-bold"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{user.name}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <p className="text-slate-500 font-medium text-sm">{user.role}</p>
                    <span className="text-slate-300 hidden md:block">•</span>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none font-mono text-[10px] px-2 py-0">
                      {user.systemId}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 border-t pt-10">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-500 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">System Identifier</p>
                <p className="text-sm font-bold text-slate-800">{user.systemId}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-500 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Corporate Email</p>
                {isEditing ? (
                  <Input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-8 text-sm"
                  />
                ) : (
                  <p className="text-sm font-bold text-slate-800">{user.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-500 shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Join Date</p>
                <p className="text-sm font-bold text-slate-800">January 15, 2024</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-50 rounded-xl text-red-500 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Deployment Hub</p>
                <p className="text-sm font-bold text-slate-800">Manila, Philippines</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intern-Specific Academic Records Card */}
      {isIntern && (
        <Card className="border shadow-none rounded-xl bg-white overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
          <CardHeader className="py-4 border-b bg-slate-50/50 flex flex-row items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">Internship Academic Records</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">School / Institution</p>
                  <p className="text-sm font-bold text-slate-900">{user.school || 'University of Santo Tomas'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Academic Course</p>
                  <p className="text-sm font-bold text-slate-900">{user.course || 'BS Multimedia Arts'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Program Start Date</p>
                  <p className="text-sm font-bold text-slate-900">{user.startDate || 'November 1, 2025'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-green-50 rounded-xl text-green-600 shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Expected Completion</p>
                  <p className="text-sm font-bold text-slate-900">{user.expectedCompletionDate || 'March 15, 2026'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Clearance Status Card */}
      <Card className="border shadow-none rounded-xl bg-white">
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Security Clearance Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-4">
            <Badge className="bg-green-100 text-green-700 border-none font-bold py-1.5 px-4 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Status: ACTIVE
            </Badge>
            <div className="h-8 w-px bg-slate-100 hidden sm:block" />
            <p className="text-xs text-slate-500 font-medium">
              Last synchronized: {new Date().toLocaleDateString()}
            </p>
          </div>
          <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold px-3 py-1">
            NODE: CONEX-INTERNAL-HQ
          </Badge>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-1">
          <Award className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Service Achievements</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Strategic Lead', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Creative Vision', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50' },
            { label: 'Performance Max', icon: Dumbbell, color: 'text-blue-500', bg: 'bg-blue-50' },
          ].map((item, i) => (
            <Card key={i} className="border shadow-none rounded-xl group hover:border-red-100 transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className={`p-5 rounded-2xl ${item.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                </div>
                <p className="text-xs font-bold text-slate-700 tracking-wide">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
