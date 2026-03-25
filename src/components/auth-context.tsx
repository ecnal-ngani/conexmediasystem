
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Role } from '@/lib/mock-data';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (email: string, isWfh: boolean, roleId?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isWfh: boolean;
  isVerified: boolean;
  setVerified: (status: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWfh, setIsWfh] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    const storedUser = localStorage.getItem('conex_session');
    const storedWfh = localStorage.getItem('conex_wfh') === 'true';
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsWfh(storedWfh);
        // Force re-verification for WFH users on every new app initialization
        // Only Office users (non-WFH) are considered pre-verified
        setIsVerified(!storedWfh);
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, wfhStatus: boolean, roleId?: string) => {
    if (!firestore) {
      throw new Error('Database not initialized. Please try again in a few seconds.');
    }
    
    setIsLoading(true);
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      
      let foundUser: User | null = null;

      if (querySnapshot.empty) {
        // AUTO-PROVISIONING LOGIC FOR DEMO ACCOUNTS
        const normalizedEmail = email.toLowerCase();
        let provisionedData = null;

        if (normalizedEmail === 'admin@conex.private') {
          provisionedData = {
            systemId: 'CX-AD-01',
            name: 'Command Administrator',
            email: normalizedEmail,
            role: 'ADMIN',
            status: 'Office',
            badges: ['🛡️'],
            avatarUrl: 'https://picsum.photos/seed/admin-master/200/200'
          };
        } else if (normalizedEmail === 'employee@conex.private') {
          provisionedData = {
            systemId: 'CX-ED-01',
            name: 'Production Editor',
            email: normalizedEmail,
            role: 'EDITOR',
            status: 'Office',
            points: 500,
            xp: 2500,
            badges: ['⚡'],
            avatarUrl: 'https://picsum.photos/seed/employee-lead/200/200'
          };
        } else if (normalizedEmail === 'intern@conex.private') {
          provisionedData = {
            systemId: 'CX-IN-01',
            name: 'Creative Intern',
            email: normalizedEmail,
            role: 'INTERN',
            status: 'Office',
            points: 100,
            xp: 500,
            badges: [],
            avatarUrl: 'https://picsum.photos/seed/intern-user/200/200',
            school: 'University of Santo Tomas',
            course: 'BS Multimedia Arts',
            startDate: '2025-11-01',
            expectedCompletionDate: '2026-03-15'
          };
        }

        if (provisionedData) {
          const docRef = await addDoc(usersRef, { ...provisionedData, createdAt: serverTimestamp() });
          foundUser = { id: docRef.id, ...provisionedData } as any;
        } else {
          throw new Error('Invalid credentials. Identity not found in secure database.');
        }
      } else {
        const userDoc = querySnapshot.docs[0];
        foundUser = { id: userDoc.id, ...userDoc.data() } as User;
      }

      if (!foundUser) throw new Error('Authentication failed.');

      // Access Control validation
      if (roleId === 'admin' && foundUser.role !== 'ADMIN') {
        throw new Error('This account does not have Administrator clearance.');
      }

      setUser(foundUser);
      setIsWfh(wfhStatus);
      // Biometric check is required if WFH is enabled
      const verifiedStatus = !wfhStatus;
      setIsVerified(verifiedStatus);
      
      localStorage.setItem('conex_session', JSON.stringify(foundUser));
      localStorage.setItem('conex_wfh', wfhStatus.toString());
      // We no longer persist 'isVerified' to local storage to ensure fresh checks
      
      if (wfhStatus) {
        router.push('/verify');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    }
    setIsLoading(false);
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user || !firestore) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('conex_session', JSON.stringify(updatedUser));
    
    // Sync to Firestore
    const userRef = doc(firestore, 'users', user.id);
    updateDoc(userRef, updates).catch(e => console.error('Failed to sync profile:', e));
  };

  const setVerified = (status: boolean) => {
    setIsVerified(status);
  };

  const logout = () => {
    setUser(null);
    setIsWfh(false);
    setIsVerified(false);
    localStorage.removeItem('conex_session');
    localStorage.removeItem('conex_wfh');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isWfh, isVerified, setVerified, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
