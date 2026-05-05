'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CameraState = 'loading' | 'active' | 'denied' | 'unavailable';
type CaptureStage = 'idle' | 'capturing' | 'compressing' | 'success' | 'failed';

interface ClockOutCameraProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCaptureComplete: (photoData: string) => void;
}

export function ClockOutCamera({ open, onOpenChange, onCaptureComplete }: ClockOutCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraState, setCameraState] = useState<CameraState>('loading');
  const [stage, setStage] = useState<CaptureStage>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const isProcessing = stage === 'capturing' || stage === 'compressing';

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera
  const requestCamera = useCallback(async () => {
    setCameraState('loading');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unavailable');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      setCameraState('active');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      console.warn('[ClockOut Camera]', error?.name, error?.message);
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setCameraState('denied');
      } else {
        setCameraState('unavailable');
      }
    }
  }, []);

  // Compress image
  const compressImage = useCallback((dataUri: string, maxWidth = 400, quality = 0.5): Promise<string> => {
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

  // Process captured photo
  const processCapture = useCallback(async (dataUri: string) => {
    setCapturedImage(dataUri);
    setStage('compressing');
    setProgress(50);

    const compressed = await compressImage(dataUri);
    setProgress(90);

    // Brief processing feel
    await new Promise(r => setTimeout(r, 500));

    setProgress(100);
    setStage('success');
    stopCamera();

    // Deliver the compressed photo back to the parent
    setTimeout(() => {
      onCaptureComplete(compressed);
    }, 800);
  }, [compressImage, stopCamera, onCaptureComplete]);

  // Camera capture from live feed
  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;
    setStage('capturing');
    setProgress(20);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUri = canvas.toDataURL('image/jpeg', 0.9);
      canvas.width = 0;
      canvas.height = 0;
      await processCapture(dataUri);
    }
  }, [processCapture]);

  // File upload fallback
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStage('capturing');
    setProgress(20);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      await processCapture(dataUri);
    };
    reader.readAsDataURL(file);
  }, [processCapture]);

  // Reset state
  const resetState = useCallback(() => {
    setCapturedImage(null);
    setStage('idle');
    setProgress(0);
    setCameraState('loading');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      resetState();
      requestCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, requestCamera, stopCamera, resetState]);

  // Bind stream to video when ref becomes available
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
    }
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isProcessing && stage !== 'success') onOpenChange(v); }}>
      <DialogContent className="max-w-[520px] p-0 rounded-[32px] overflow-hidden border-none shadow-2xl">
        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-xl shadow-red-100">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div className="pt-1">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Clock Out Verification</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium">Capture a photo to confirm your session logout.</DialogDescription>
            </div>
          </DialogHeader>

          {/* Camera Feed */}
          <div className="aspect-video bg-black rounded-2xl overflow-hidden border-4 border-slate-100 relative">
            {/* Live video */}
            <video
              ref={videoRef}
              className={cn(
                "w-full h-full object-cover",
                (cameraState !== 'active' || capturedImage) ? 'hidden' : 'block'
              )}
              autoPlay
              muted
              playsInline
            />

            {/* Captured preview */}
            {capturedImage && (
              <img src={capturedImage} alt="Clock Out Capture" className="w-full h-full object-cover" />
            )}

            {/* Loading */}
            {cameraState === 'loading' && !capturedImage && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4 z-10">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="text-center space-y-1">
                  <h3 className="text-white font-bold">Requesting Camera Access</h3>
                  <p className="text-slate-400 text-sm">Please allow camera permission.</p>
                </div>
              </div>
            )}

            {/* Denied / Unavailable */}
            {(cameraState === 'denied' || cameraState === 'unavailable') && !capturedImage && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 gap-5 z-10">
                <div className="space-y-2 text-center">
                  <AlertTriangle className="w-10 h-10 text-orange-400 mx-auto" />
                  <h3 className="text-white font-bold">Camera {cameraState === 'denied' ? 'Denied' : 'Unavailable'}</h3>
                  <p className="text-slate-400 text-sm max-w-xs">
                    {cameraState === 'denied' 
                      ? 'Camera access was blocked. Use the button below to take a photo instead.' 
                      : 'No camera detected. You can upload a photo as proof.'}
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button onClick={() => { stopCamera(); requestCamera(); }} variant="outline" className="w-full text-white border-slate-600 hover:bg-slate-700">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Camera
                  </Button>
                  <div className="relative">
                    <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={isProcessing} />
                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold pointer-events-none" disabled={isProcessing}>
                      <Upload className="w-4 h-4 mr-2" />
                      Take Photo / Upload
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Processing overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4 z-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="font-bold text-lg">{stage === 'capturing' ? 'Capturing...' : 'Processing...'}</p>
                  <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Success overlay */}
            {stage === 'success' && (
              <div className="absolute inset-0 bg-green-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3 z-20">
                <CheckCircle2 className="w-16 h-16 text-green-400 animate-in zoom-in duration-300" />
                <p className="font-bold text-lg">Clock Out Verified</p>
                <p className="text-sm text-green-300/80">Session ended successfully.</p>
              </div>
            )}

            {/* Security badge */}
            {capturedImage && stage === 'success' && (
              <div className="absolute bottom-4 left-4 z-30">
                <div className="flex items-center gap-2 bg-green-600 text-white font-black text-[10px] px-3 py-1.5 rounded-full shadow-lg">
                  <ShieldCheck className="w-3 h-3" />
                  VERIFIED CAPTURE
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {cameraState === 'active' && !capturedImage && stage === 'idle' && (
              <Button
                onClick={handleCapture}
                disabled={isProcessing}
                className="w-full h-14 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-100 gap-2 text-base"
              >
                <Camera className="w-5 h-5" />
                Capture & Clock Out
              </Button>
            )}

            {stage !== 'success' && (
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                disabled={isProcessing}
                className="w-full h-12 rounded-2xl font-bold border-slate-200"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
