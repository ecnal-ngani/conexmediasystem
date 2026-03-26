'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (permissionError: FirestorePermissionError) => {
      console.error('Firestore Permission Error:', permissionError);
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Your clearance level is insufficient for this tactical action.",
      });
      setError(permissionError);
    };

    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  if (error) {
    // Throw error to be caught by global error boundary in dev if necessary
    // For production, we rely on the toast notification
    if (process.env.NODE_ENV === 'development') {
        throw error;
    }
  }

  return null;
}
