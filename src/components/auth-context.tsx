'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/mock-data';
import { useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  const firebaseAuth = useFirebaseAuth();

  useEffect(() => {
    if (!firebaseAuth) return;

    const storedUser = localStorage.getItem('conex_session');
    const storedWfh = localStorage.getItem('conex_wfh') === 'true';
    
    // Robust session restoration listener
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
      if (fbUser) {
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsWfh(storedWfh);
            setIsVerified(!storedWfh);
          } catch (e) {
            console.error('Session corruption detected', e);
          }
        }
        setIsLoading(false);
      } else {
        // Automatically ensure an anonymous session is active if none exists
        signInAnonymously(firebaseAuth).catch((e) => {
          console.error("Critical: Auth node unreachable", e);
          setIsLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, [firebaseAuth]);

  const login = async (email: string, wfhStatus: boolean, roleId?: string) => {
    if (!firestore || !firebaseAuth) {
      throw new Error('Security node not synchronized. Please retry.');
    }
    
    setIsLoading(true);
    try {
      // Ensure we have a valid anonymous session before querying identity
      if (!firebaseAuth.currentUser) {
        await signInAnonymously(firebaseAuth);
      }

      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Access Denied. Identity not found in secure database.');
      }

      const userDoc = querySnapshot.docs[0];
      const foundUser = { id: userDoc.id, ...userDoc.data() } as User;

      if (roleId === 'admin' && foundUser.role !== 'ADMIN') {
        throw new Error('This account does not have Administrator clearance.');
      }

      setUser(foundUser);
      setIsWfh(wfhStatus);
      const verifiedStatus = !wfhStatus;
      setIsVerified(verifiedStatus);
      
      localStorage.setItem('conex_session', JSON.stringify(foundUser));
      localStorage.setItem('conex_wfh', wfhStatus.toString());
      
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

    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    if (Object.keys(sanitizedUpdates).length === 0) return;

    const updatedUser = { ...user, ...sanitizedUpdates };
    setUser(updatedUser);
    localStorage.setItem('conex_session', JSON.stringify(updatedUser));
    
    const userRef = doc(firestore, 'users', user.id);
    updateDoc(userRef, { ...sanitizedUpdates, updatedAt: serverTimestamp() }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: sanitizedUpdates
      }));
    });
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