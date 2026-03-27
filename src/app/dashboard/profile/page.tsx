'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Calendar as CalendarIcon, 
  MapPin, 
  Edit2,
  Save,
  X,
  GraduationCap,
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
  const [isMounted, setIsMounted] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [school, setSchool] = useState('');
  const [course, setCourse] = useState('');

  useEffect(() => {
    setIsMounted(true);
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
      limit(10)
    );
  }, [firestore, user?.id]);

  const { data: attendance, loading: aLoading } = useCollection<any>(personalAttendanceQuery);

  if (!isMounted || !user) return null;

  const handleSave = () => {
    const updates: any = { name, email };

    if (user.role === 'INTERN') {
      updates.school = school;
      updates.course = course;
    }

    updateUser(updates);
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your information has been saved successfully.",
    });
  };

  const isIntern = user.role === 'INTERN';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="ghost">
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white font-bold gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 text-center space-y-4">
            <Avatar className="w-24 h-24 mx-auto border-4 border-white shadow-lg">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-primary text-white text-xl">
                {user.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">{user.role}</Badge>
              <Badge variant="outline" className="font-mono">{user.systemId}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personnel Details</CardTitle>
            <CardDescription>View and manage your core identity information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                {isEditing ? (
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                ) : (
                  <p className="text-sm font-medium border p-2 rounded-md bg-muted/20">{user.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                {isEditing ? (
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                ) : (
                  <p className="text-sm font-medium border p-2 rounded-md bg-muted/20">{user.email}</p>
                )}
              </div>
              
              {isIntern && (
                <>
                  <div className="space-y-2">
                    <Label>Institution / School</Label>
                    {isEditing ? (
                      <Input value={school} onChange={(e) => setSchool(e.target.value)} />
                    ) : (
                      <p className="text-sm font-medium border p-2 rounded-md bg-muted/20">{user.school || 'Not specified'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Course / Program</Label>
                    {isEditing ? (
                      <Input value={course} onChange={(e) => setCourse(e.target.value)} />
                    ) : (
                      <p className="text-sm font-medium border p-2 rounded-md bg-muted/20">{user.course || 'Not specified'}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Attendance Log
              </CardTitle>
              <CardDescription>Recent biometric verification events.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : !attendance || attendance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No attendance records found.
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-xs">
                      {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPP p') : 'Recent'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <Camera className="w-3 h-3 text-muted-foreground" />
                        BIOMETRIC
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[10px] font-bold">
                        VERIFIED
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {(log.confidence * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
