
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
 * 7. Session persistence using LocalStorage.
 * 8. Automatic status synchronization (Office/WFH/Offline).
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/mock-data';
import { useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp, addDoc, onSnapshot } from 'firebase/firestore';
import { checkAndAwardBadges } from '@/lib/badges';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import staffData from '@/app/lib/initial-staff.json';

interface AuthContextType {
  user: User | null;
  login: (email: string, securityToken: string, isWfh: boolean) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isWfh: boolean;
  isVerified: boolean;
  setVerified: (status: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  xp: number;
  points: number;
  level: number;
  badges: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// MASTER BOOTSTRAP CREDENTIALS FROM REGISTRY FILE
const MASTER_EMAIL = staffData.bootstrap.email;
const MASTER_TOKEN = staffData.bootstrap.token;

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
    const storedVerified = localStorage.getItem('conex_verified') === 'true';
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
      if (fbUser) {
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsWfh(storedWfh);
            setIsVerified(storedWfh ? storedVerified : true);
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

  // SESSION HEARTBEAT SYSTEM
  // Periodically updates 'lastSeen' to handle mobile browser backgrounding/restarts
  useEffect(() => {
    if (!user || !firestore || !isVerified) return;

    const pulseHeartbeat = async () => {
      try {
        const userRef = doc(firestore, 'users', user.id);
        await setDoc(userRef, { 
          lastSeen: serverTimestamp(),
          // Automatically recover status if it was accidentally set to Offline
          status: isWfh ? 'WFH' : 'Office',
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (e) {
        console.warn("Heartbeat pulse failed", e);
      }
    };

    // Initial pulse on mount/verified
    pulseHeartbeat();

    // Pulse every 5 minutes (300,000 ms)
    const heartbeatInterval = setInterval(pulseHeartbeat, 5 * 60 * 1000);

    // Visibility change listener to pulse immediately when coming back from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pulseHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, firestore, isVerified, isWfh]);

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
          const adminRoleInfo = staffData.roles.find(r => r.id === 'ADMIN');
          const newAdmin = {
            systemId: 'CX-AD-01',
            name: 'System Administrator',
            email: MASTER_EMAIL,
            securityToken: MASTER_TOKEN,
            role: 'ADMIN',
            hourlyRate: adminRoleInfo?.rate || 500,
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

        // AUTOMATIC STATUS SYNCHRONIZATION
        // Use setDoc with merge to handle cases where the doc might have been purged
        const userRef = doc(firestore, 'users', userId);
        const newStatus = wfhStatus ? 'WFH' : 'Office';
        
        await setDoc(userRef, { 
          status: newStatus,
          updatedAt: serverTimestamp(),
          // Auto-initialize gamification data if missing
          xp: userData.xp ?? 0,
          points: userData.points ?? 0,
          level: userData.level ?? 1,
          badges: userData.badges ?? []
        }, { merge: true });
        
        userData.status = newStatus;
        userData.xp = userData.xp ?? 0;
        userData.points = userData.points ?? 0;
        userData.level = userData.level ?? 1;
        userData.badges = userData.badges ?? [];
      }
      
      const updatedUser = { id: userId, ...userData } as User;

      setUser(updatedUser);
      setIsWfh(wfhStatus);
      const verifiedStatus = !wfhStatus;
      setIsVerified(verifiedStatus);
      
      localStorage.setItem('conex_session', JSON.stringify(updatedUser));
      localStorage.setItem('conex_wfh', wfhStatus.toString());
      localStorage.setItem('conex_verified', verifiedStatus.toString());
      
        // Log check-in for attendance records
        const verificationsRef = collection(firestore, 'verifications');
        const checkInData = {
          userId: userId,
          userName: userData.name,
          userSystemId: userData.systemId,
          email: userData.email || '',
          timestamp: serverTimestamp(),
          isVerified: true,
          method: wfhStatus ? 'Biometric WFH' : 'Office Terminal',
          status: wfhStatus ? 'Logged (WFH)' : 'Logged (Office)',
          devicePlatform: navigator.userAgent
        };
        addDoc(verificationsRef, checkInData).catch(console.error);

        // Check for Early Bird badge
        const newBadges = await checkAndAwardBadges({ id: userId, ...userData } as User, firestore, 'clock-in');
        if (newBadges) {
          userData.badges = newBadges;
        }

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
    // Use setDoc with merge: true to avoid "No document to update" error
    setDoc(userRef, { ...sanitizedUpdates, updatedAt: serverTimestamp() }, { merge: true }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: sanitizedUpdates
      }));
    });
  };

  const setVerified = (status: boolean) => {
    setIsVerified(status);
    localStorage.setItem('conex_verified', status.toString());
  };

  const logout = async () => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.id);
      try {
        // 1. Log Clock Out for attendance
        const verificationsRef = collection(firestore, 'verifications');
        await addDoc(verificationsRef, {
          userId: user.id,
          userName: user.name,
          userSystemId: user.systemId,
          email: user.email || '',
          timestamp: serverTimestamp(),
          isVerified: true,
          method: 'System Logout',
          status: 'Logged (Offline)',
          devicePlatform: navigator.userAgent
        });

        // Check for Night Owl badge
        await checkAndAwardBadges(user, firestore, 'clock-out');

        // 2. Sync Offline status
        await setDoc(userRef, { 
          status: 'Offline',
          updatedAt: serverTimestamp() 
        }, { merge: true });
      } catch (e) {
        console.warn("Could not sync logout status", e);
      }
    }

    setUser(null);
    setIsWfh(false);
    setIsVerified(false);
    localStorage.removeItem('conex_session');
    localStorage.removeItem('conex_wfh');
    localStorage.removeItem('conex_verified');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      isWfh, 
      isVerified, 
      setVerified, 
      updateUser,
      xp: user?.xp ?? 0,
      points: user?.points ?? 0,
      level: user?.level ?? 1,
      badges: user?.badges ?? []
    }}>
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
