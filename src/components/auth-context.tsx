
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, MOCK_USERS } from '@/lib/mock-data';

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
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      // If roleId is specified, ensure user has that capability (mapping UI roles to data roles)
      if (roleId === 'admin' && foundUser.role !== 'ADMIN' && foundUser.role !== 'CEO') {
        throw new Error('This account does not have Administrator clearance.');
      }
      if (roleId === 'employee' && foundUser.role === 'ADMIN') {
        // Allow admins to login as employee for testing? Or keep strict. 
        // For demo, let's just foundUser.
      }

      setUser(foundUser);
      setIsWfh(wfhStatus);
      // Non-WFH users are automatically "verified" for the dashboard
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
    } else {
      throw new Error('Invalid credentials. Access denied.');
    }
    setIsLoading(false);
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('conex_session', JSON.stringify(updatedUser));
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
