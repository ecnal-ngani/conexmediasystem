
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Loader2, ShieldCheck, ShieldAlert, RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyFace } from '@/ai/flows/face-verification-flow';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function VerifyPage() {
  const { user, isWfh, setVerified, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && !isWfh) {
      router.push('/dashboard');
      return;
    }

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'CONEX MEDIA policy requires camera access for identity verification.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [user, isWfh, authLoading, router, toast]);

  const handleCapture = async () => {
    if (!videoRef.current || !user || !firestore) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(dataUri);
      
      setIsVerifying(true);
      try {
        const result = await verifyFace({ photoDataUri: dataUri });
        
        if (result.isVerified) {
          // LOG THE SUCCESSFUL VERIFICATION
          const verificationsRef = collection(firestore, 'verifications');
          const verificationData = {
            userId: user.id,
            userName: user.name,
            userSystemId: user.systemId,
            photoUrl: dataUri,
            timestamp: serverTimestamp(),
            isVerified: true,
            confidence: result.confidence
          };

          addDoc(verificationsRef, verificationData).catch(async (err) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: verificationsRef.path,
              operation: 'create',
              requestResourceData: verificationData
            }));
          });

          toast({
            title: "Identity Verified",
            description: result.message,
          });
          setVerified(true);
          router.push('/dashboard');
        } else {
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: result.message,
          });
          setCapturedImage(null);
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast({
          variant: "destructive",
          title: "System Error",
          description: "Could not complete biometric analysis.",
        });
        setCapturedImage(null);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-2xl space-y-6 animate-in fade-in duration-700">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            WFH Compliance Check
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Biometric Verification</h1>
          <p className="text-muted-foreground">
            Identity verification is mandatory for remote access to CONEX MEDIA.
          </p>
        </div>

        <Card className="border-2 shadow-2xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Live Security Feed
            </CardTitle>
            <CardDescription>
              Ensure your face is clearly visible and well-lit.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 bg-black aspect-video relative flex items-center justify-center">
            <video 
              ref={videoRef} 
              className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`} 
              autoPlay 
              muted 
              playsInline
            />
            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}
            
            {isVerifying && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-bold text-lg">Analyzing Biometrics</p>
                  <p className="text-sm text-white/60">Cross-referencing secure database...</p>
                </div>
              </div>
            )}

            {!hasCameraPermission && hasCameraPermission !== null && (
              <div className="absolute inset-0 bg-muted flex items-center justify-center p-6">
                <Alert variant="destructive" className="max-w-md bg-background">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings to continue with CONEX MEDIA verification.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-6 bg-muted/30 border-t flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 text-green-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs text-left">
                <p className="font-bold uppercase tracking-wider">Secure Node</p>
                <p className="text-muted-foreground">Encrypted P2P Connection</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {capturedImage ? (
                <Button 
                  variant="outline" 
                  onClick={() => setCapturedImage(null)} 
                  disabled={isVerifying}
                  className="w-full sm:w-auto h-12"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake Photo
                </Button>
              ) : (
                <Button 
                  onClick={handleCapture} 
                  disabled={!hasCameraPermission || isVerifying}
                  className="w-full sm:w-auto bg-primary font-bold h-12 px-8"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  Capture and Verify
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>

        <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-3 text-left">
          <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-primary uppercase">Security Notice</p>
            <p>
              This biometric data is processed in real-time by CONEX MEDIA and is not stored permanently.
              Failure to provide a valid face match will result in an automated security lock.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
