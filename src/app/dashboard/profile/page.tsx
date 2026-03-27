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
  CalendarDays,
  History,
  Camera,
  Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [course, setCourse] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setSchool(user.school || '');
      setCourse(user.course || '');
    }
  }, [user]);

  const personalAttendanceQuery = useMemoFirebase(() => {
    if (!firestore || !user?.id) return null;
    return query(
      collection(firestore, 'verifications'),
      where('userId', '==', user.id),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore, user?.id]);

  const { data: attendance, loading: aLoading } = useCollection<any>(personalAttendanceQuery);

  if (!user) return null;

  const handleSave = () => {
    const isIntern = user.role === 'INTERN';
    const updates: any = { name, email };

    if (isIntern) {
      updates.school = school;
      updates.course = course;
    }

    updateUser(updates);
    setIsEditing(false);
    toast({
      title: "Identity Updated",
      description: "Your system profile has been successfully re-synchronized.",
    });
  };

  const isIntern = user.role === 'INTERN';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
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

      <Card className="border shadow-none rounded-xl overflow-hidden bg-white">
        <div className="h-32 md:h-40 bg-[#E11D48]" />
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

      {isIntern && (
        <Card className="border shadow-none rounded-xl bg-white overflow-hidden">
          <CardHeader className="py-4 border-b bg-slate-50/50 flex flex-row items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">Internship Records</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Institution</p>
                  {isEditing ? (
                    <Input value={school} onChange={(e) => setSchool(e.target.value)} className="h-8 text-sm" />
                  ) : (
                    <p className="text-sm font-bold text-slate-900">{user.school || 'University of Santo Tomas'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Degree / Course</p>
                  {isEditing ? (
                    <Input value={course} onChange={(e) => setCourse(e.target.value)} className="h-8 text-sm" />
                  ) : (
                    <p className="text-sm font-bold text-slate-900">{user.course || 'BS Multimedia Arts'}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance History Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-1">
          <History className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">My Attendance Record</h3>
        </div>
        <Card className="border shadow-none rounded-xl bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-0">
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 pl-6">Timestamp</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4">Verification Type</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 text-center">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-4 pr-6 text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aLoading ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
              ) : !attendance || attendance.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-400 font-medium italic">No attendance records synchronized.</TableCell></TableRow>
              ) : (
                attendance.map((log) => (
                  <TableRow key={log.id} className="border-0 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 pl-6 font-medium text-slate-600">
                      {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PP p') : 'Recent'}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                        <Camera className="w-3 h-3" />
                        Biometric Sync
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <Badge className="bg-green-50 text-green-600 border-none font-bold text-[9px] uppercase">Verified</Badge>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6 font-mono text-[10px] text-slate-400">
                      {(log.confidence * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

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
