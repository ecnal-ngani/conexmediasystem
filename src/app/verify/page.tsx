'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Loader2, ShieldCheck, ShieldAlert, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyFace } from '@/ai/flows/face-verification-flow';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type VerificationStage = 'idle' | 'capturing' | 'compressing' | 'analyzing' | 'success' | 'failed';
type CameraState = 'loading' | 'active' | 'denied' | 'unavailable';

export default function VerifyPage() {
  const { user, isWfh, setVerified, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [cameraState, setCameraState] = useState<CameraState>('loading');
  const [stage, setStage] = useState<VerificationStage>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [hasAutoCaptured, setHasAutoCaptured] = useState(false);
  const [progress, setProgress] = useState(0);

  const isVerifying = stage === 'capturing' || stage === 'compressing' || stage === 'analyzing';

  // Stop all camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Attempt to start the camera — works on both PC and mobile (HTTPS required for mobile)
  const requestCamera = useCallback(async () => {
    setCameraState('loading');

    // Check if getUserMedia is available at all
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[Camera] getUserMedia not available — likely non-secure context');
      setCameraState('unavailable');
      return;
    }

    try {
      // This triggers the browser's native permission popup
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      streamRef.current = stream;
      setCameraState('active');

      // Bind stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      // Use console.warn instead of console.error to avoid triggering Next.js dev overlays for expected permission denials
      console.warn('[Camera] Access warning:', error?.name, error?.message);

      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        // User explicitly denied camera — show denied state
        setCameraState('denied');
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        // No camera hardware found
        setCameraState('unavailable');
      } else if (error?.name === 'NotReadableError' || error?.name === 'AbortError') {
        // Camera is in use by another app or hardware error
        setCameraState('unavailable');
      } else {
        // Catch-all: SecurityError (non-HTTPS), OverconstrainedError, etc.
        setCameraState('unavailable');
      }
    }
  }, []);

  // Auth redirect guards
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && !isWfh) {
      router.push('/dashboard');
      return;
    }
  }, [user, isWfh, authLoading, router]);

  // Initialize camera on mount
  useEffect(() => {
    if (authLoading || !user || !isWfh) return;

    requestCamera();

    return () => stopCamera();
  }, [authLoading, user, isWfh, requestCamera, stopCamera]);

  // Bind stream to video when videoRef becomes available
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  });

  // Optimized image compression
  const compressImage = useCallback((dataUri: string, maxWidth = 480, quality = 0.4): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressed = canvas.toDataURL('image/jpeg', quality);
        canvas.width = 0;
        canvas.height = 0;
        
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUri);
      img.src = dataUri;
    });
  }, []);

  const processVerification = useCallback(async (dataUri: string) => {
    if (!user || !firestore) return;
    
    setCapturedImage(dataUri);
    setStage('compressing');
    setProgress(20);
    
    const compressedUri = await compressImage(dataUri);
    setStage('analyzing');
    setProgress(50);
    
    try {
      const progressTimer = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 800);

      const result = await verifyFace({ photoDataUri: compressedUri });
      
      clearInterval(progressTimer);
      setProgress(100);
      
      if (result.isVerified) {
        setStage('success');
        
        const verificationsRef = collection(firestore, 'verifications');
        const verificationData = {
          userId: user.id,
          userName: user.name,
          userSystemId: user.systemId,
          timestamp: serverTimestamp(),
          isVerified: true,
          confidence: result.confidence,
        };

        addDoc(verificationsRef, verificationData).catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: verificationsRef.path,
            operation: 'create',
            requestResourceData: verificationData
          }));
        });

        toast({
          title: "✅ Identity Verified",
          description: result.message,
        });

        stopCamera();
        setVerified(true);
        
        setTimeout(() => router.push('/dashboard'), 800);
      } else {
        setStage('failed');
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.message || "Face could not be verified. Please retake.",
        });
        
        setTimeout(() => {
          setCapturedImage(null);
          setStage('idle');
          setProgress(0);
        }, 2000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStage('failed');
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Could not complete biometric analysis. Please try again.",
      });
      
      setTimeout(() => {
        setCapturedImage(null);
        setStage('idle');
        setProgress(0);
      }, 2000);
    }
  }, [user, firestore, compressImage, stopCamera, setVerified, router, toast]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !user || !firestore) return;

    setStage('capturing');
    setProgress(10);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg', 0.5);
      canvas.width = 0;
      canvas.height = 0;
      await processVerification(dataUri);
    }
  }, [user, firestore, processVerification]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !firestore) return;

    setStage('capturing');
    setProgress(10);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      await processVerification(dataUri);
    };
    reader.readAsDataURL(file);
  }, [user, firestore, processVerification]);

  // Auto-capture when camera is ready
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cameraState === 'active' && !isVerifying && !capturedImage && !hasAutoCaptured) {
      setHasAutoCaptured(true);
      timer = setTimeout(() => {
        handleCapture();
      }, 1500);
    }
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraState, isVerifying, capturedImage, hasAutoCaptured]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setStage('idle');
    setProgress(0);
    setHasAutoCaptured(false);
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const stageLabel: Record<VerificationStage, string> = {
    idle: '',
    capturing: 'Capturing image...',
    compressing: 'Optimizing image...',
    analyzing: 'AI biometric analysis in progress...',
    success: 'Identity confirmed!',
    failed: 'Verification failed — retrying...',
  };

  if (authLoading || !user) return null;

  const showLiveCamera = cameraState === 'active' || cameraState === 'loading';
  const showFallback = cameraState === 'denied' || cameraState === 'unavailable';

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

        <Card className="border-2 shadow-2xl overflow-hidden rounded-[32px]">
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
            {/* Video element — always present, hidden when not active or when image is captured */}
            <video 
              ref={videoRef} 
              className={`w-full h-full object-cover ${(!showLiveCamera || capturedImage) ? 'hidden' : 'block'}`} 
              autoPlay 
              muted 
              playsInline
            />

            {/* Captured photo preview */}
            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}

            {/* Loading state — waiting for camera permission popup */}
            {cameraState === 'loading' && !capturedImage && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-10 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="space-y-2">
                  <h3 className="text-white font-bold text-lg">Requesting Camera Access</h3>
                  <p className="text-slate-400 text-sm max-w-xs">
                    Please tap <strong>&quot;Allow&quot;</strong> when your browser asks for camera permission.
                  </p>
                </div>
              </div>
            )}

            {/* Camera denied — user blocked permission */}
            {cameraState === 'denied' && !capturedImage && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-10 gap-5">
                <Alert variant="destructive" className="max-w-sm bg-slate-800 border-red-500/50">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Camera Permission Denied</AlertTitle>
                  <AlertDescription className="text-slate-300">
                    You blocked camera access. You can either enable it in your browser settings and reload, or use the button below to take a photo.
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button onClick={() => { stopCamera(); requestCamera(); }} variant="outline" className="w-full text-white border-slate-600 hover:bg-slate-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Camera Access
                  </Button>
                  <div className="relative">
                    <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={isVerifying} />
                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold pointer-events-none" disabled={isVerifying}>
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo Instead
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Camera unavailable — no hardware, non-HTTPS, or other system issue */}
            {cameraState === 'unavailable' && !capturedImage && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-10 gap-5">
                <div className="space-y-3 max-w-xs">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg">Camera Not Available</h3>
                  <p className="text-slate-400 text-sm">
                    Your browser couldn&apos;t access the camera. This usually happens on mobile over a non-HTTPS connection, or if no camera is detected.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button onClick={() => { stopCamera(); requestCamera(); }} variant="outline" className="w-full text-white border-slate-600 hover:bg-slate-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Camera
                  </Button>
                  <div className="relative">
                    <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={isVerifying} />
                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold pointer-events-none" disabled={isVerifying}>
                      <Upload className="w-4 h-4 mr-2" />
                      Take Photo or Upload
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Progress / Status Overlay */}
            {isVerifying && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4 z-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="font-bold text-lg">{stageLabel[stage]}</p>
                  <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/50">{progress}%</p>
                </div>
              </div>
            )}

            {/* Success overlay */}
            {stage === 'success' && (
              <div className="absolute inset-0 bg-green-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 z-20">
                <CheckCircle2 className="w-16 h-16 text-green-400 animate-in zoom-in duration-300" />
                <p className="font-bold text-lg">Access Granted</p>
                <p className="text-sm text-green-300/80">Redirecting to dashboard...</p>
              </div>
            )}

            {/* Failed overlay */}
            {stage === 'failed' && (
              <div className="absolute inset-0 bg-red-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 z-20">
                <AlertTriangle className="w-16 h-16 text-red-400 animate-in zoom-in duration-300" />
                <p className="font-bold text-lg">Verification Failed</p>
                <p className="text-sm text-red-300/80">Resetting in a moment...</p>
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
              {capturedImage && stage !== 'success' ? (
                <Button 
                  variant="outline" 
                  onClick={handleRetake} 
                  disabled={isVerifying}
                  className="w-full sm:w-auto h-12 rounded-2xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake Photo
                </Button>
              ) : stage !== 'success' && cameraState === 'active' ? (
                <Button 
                  onClick={handleCapture} 
                  disabled={isVerifying}
                  className="w-full sm:w-auto bg-primary font-bold h-12 px-8 rounded-2xl shadow-lg shadow-red-100 text-white"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  Capture and Verify
                </Button>
              ) : null}
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
