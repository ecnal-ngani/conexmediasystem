
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/mock-data';
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
    const storedVerified = localStorage.getItem('conex_verified') === 'true';
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsWfh(storedWfh);
      setIsVerified(storedVerified);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, wfhStatus: boolean, roleId?: string) => {
    if (!firestore) return;
    
    setIsLoading(true);
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      
      let foundUser: User | null = null;

      if (querySnapshot.empty) {
        // AUTO-PROVISION MASTER ADMIN IF NOT EXISTS
        if (email.toLowerCase() === 'admin@conex.private') {
          const adminData = {
            systemId: 'CX-AD-01',
            name: 'System Administrator',
            email: 'admin@conex.private',
            role: 'ADMIN',
            status: 'Office',
            points: 1000,
            xp: 5000,
            salary: '₱150,000',
            badges: ['🏆', '🛡️'],
            createdAt: serverTimestamp(),
            avatarUrl: 'https://picsum.photos/seed/admin-master/200/200'
          };
          const docRef = await addDoc(usersRef, adminData);
          foundUser = { id: docRef.id, ...adminData } as any;
        } else {
          throw new Error('Invalid credentials. Identity not found in secure database.');
        }
      } else {
        const userDoc = querySnapshot.docs[0];
        foundUser = { id: userDoc.id, ...userDoc.data() } as User;
      }

      if (!foundUser) throw new Error('Authentication failed.');

      // Role validation logic
      if (roleId === 'admin' && foundUser.role !== 'ADMIN' && foundUser.role !== 'CEO') {
        throw new Error('This account does not have Administrator clearance.');
      }

      setUser(foundUser);
      setIsWfh(wfhStatus);
      const verifiedStatus = !wfhStatus;
      setIsVerified(verifiedStatus);
      
      localStorage.setItem('conex_session', JSON.stringify(foundUser));
      localStorage.setItem('conex_wfh', wfhStatus.toString());
      localStorage.setItem('conex_verified', verifiedStatus.toString());
      
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
    localStorage.setItem('conex_verified', status.toString());
  };

  const logout = () => {
    setUser(null);
    setIsWfh(false);
    setIsVerified(false);
    localStorage.removeItem('conex_session');
    localStorage.removeItem('conex_wfh');
    localStorage.removeItem('conex_verified');
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
