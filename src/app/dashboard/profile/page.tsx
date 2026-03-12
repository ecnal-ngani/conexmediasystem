'use client';

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
  Dumbbell
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 px-1">My Profile</h1>

      {/* Main Profile Header Card */}
      <Card className="border shadow-none rounded-xl overflow-hidden bg-white">
        <div className="h-32 bg-[#FF5A5F]" /> {/* Signature Red Banner */}
        <CardContent className="relative px-8 pb-10">
          <div className="absolute -top-12 left-8">
            <Avatar className="w-24 h-24 border-4 border-white shadow-md text-2xl font-bold">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-[#1E293B] text-white">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="mt-16 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <p className="text-slate-400 font-medium text-sm mt-0.5">{user.role}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-500">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Employee ID</p>
                  <p className="text-sm font-bold text-slate-800">{user.systemId}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-500">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Email</p>
                  <p className="text-sm font-bold text-slate-800">kyle.jarque@conex.ph</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-500">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Join Date</p>
                  <p className="text-sm font-bold text-slate-800">January 15, 2024</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Location</p>
                  <p className="text-sm font-bold text-slate-800">Manila, Philippines</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Card */}
      <Card className="border shadow-none rounded-xl bg-white">
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-bold text-slate-800">Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Badge className="bg-[#E6F4EA] text-[#1E8E3E] border-none font-bold py-1 px-3">
            <Clock className="w-3.5 h-3.5 mr-2" />
            In Office
          </Badge>
          <p className="text-xs text-slate-400">
            Clocked in at 3/12/2026, 3:19:57 PM
          </p>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Award className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-bold text-slate-800">Achievements</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
            { icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50' },
            { icon: Dumbbell, color: 'text-yellow-500', bg: 'bg-yellow-50' },
          ].map((item, i) => (
            <Card key={i} className="border shadow-none rounded-xl flex items-center justify-center py-10">
              <div className={`p-4 rounded-full ${item.bg}`}>
                <item.icon className={`w-8 h-8 ${item.color}`} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
