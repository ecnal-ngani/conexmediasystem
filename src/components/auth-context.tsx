
'use client';

/**
 * Authentication Context Provider
 * 
 * This file manages the user session, handling:
 * 1. Firebase Anonymous sign-in as a baseline.
 * 2. Lookup of authorized user profiles from Firestore.
 * 3. Security Token validation (Gate 1) with Master Bootstrap.
 * 4. Session persistence using LocalStorage.
 * 5. Biometric verification gating for WFH users.
 * 6. Automatic status synchronization (Office/WFH/Offline).
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/mock-data';
import { useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AuthContextType {
  user: User | null;
  login: (email: string, securityToken: string, isWfh: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isWfh: boolean;
  isVerified: boolean;
  setVerified: (status: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MASTER BOOTSTRAP CREDENTIALS
const MASTER_EMAIL = 'admin@conex.media';
const MASTER_TOKEN = 'CONEX-ADMIN-INIT';

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
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
      if (fbUser) {
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsWfh(storedWfh);
            setIsVerified(!storedWfh);
          } catch (e) {
            console.error('Session restoration failed', e);
          }
        }
        setIsLoading(false);
      } else {
        signInAnonymously(firebaseAuth).catch((e) => {
          console.error("Auth initialization error", e);
          setIsLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, [firebaseAuth]);

  /**
   * Validates credentials and automatically synchronizes operational status.
   */
  const login = async (email: string, securityToken: string, wfhStatus: boolean) => {
    if (!firestore || !firebaseAuth) {
      throw new Error('Database connection not established.');
    }
    
    setIsLoading(true);
    try {
      if (!firebaseAuth.currentUser) {
        await signInAnonymously(firebaseAuth);
      }

      const cleanEmail = email.toLowerCase().trim();
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail), limit(1));
      const querySnapshot = await getDocs(q);
      
      let userData: any = null;
      let userId: string = '';

      if (querySnapshot.empty) {
        // CHECK FOR MASTER BOOTSTRAP
        if (cleanEmail === MASTER_EMAIL && securityToken === MASTER_TOKEN) {
          // AUTO-ENROLL FIRST ADMIN
          const newAdmin = {
            systemId: 'CX-AD-01',
            name: 'System Administrator',
            email: MASTER_EMAIL,
            securityToken: MASTER_TOKEN,
            role: 'ADMIN',
            status: wfhStatus ? 'WFH' : 'Office',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            avatarUrl: 'https://picsum.photos/seed/admin/200/200'
          };
          const docRef = await addDoc(usersRef, newAdmin);
          userData = newAdmin;
          userId = docRef.id;
        } else {
          throw new Error('Unauthorized: Email not found in the staff registry.');
        }
      } else {
        const userDoc = querySnapshot.docs[0];
        userData = userDoc.data();
        userId = userDoc.id;

        // SECURITY TOKEN VALIDATION (Gate 1)
        if (userData.securityToken !== securityToken) {
          throw new Error('Invalid Security Token: Access denied.');
        }
      }
      
      // AUTOMATIC STATUS SYNCHRONIZATION
      const userRef = doc(firestore, 'users', userId);
      const newStatus = wfhStatus ? 'WFH' : 'Office';
      
      await updateDoc(userRef, { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });

      const updatedUser = { id: userId, ...userData, status: newStatus } as User;

      setUser(updatedUser);
      setIsWfh(wfhStatus);
      const verifiedStatus = !wfhStatus;
      setIsVerified(verifiedStatus);
      
      localStorage.setItem('conex_session', JSON.stringify(updatedUser));
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

  const logout = async () => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.id);
      try {
        await updateDoc(userRef, { 
          status: 'Offline',
          updatedAt: serverTimestamp() 
        });
      } catch (e) {
        console.error("Failed to sync offline status", e);
      }
    }

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
