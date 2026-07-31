'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, Barcode, Volume2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface MobileScannerClientProps {
  orderId?: string;
}

export default function MobileScannerClient({ orderId: initialOrderId }: MobileScannerClientProps) {
  const [orderId, setOrderId] = useState<string>(initialOrderId || '');
  const [manualSku, setManualSku] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [lastScanResult, setLastScanResult] = useState<{
    type: 'success' | 'warning' | 'error';
    title: string;
    detail: string;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play haptic + audio feedback on scan
  const triggerFeedbackSound = (type: 'success' | 'error') => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(type === 'success' ? [80, 50, 80] : [200, 100, 200]);
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current && AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== 'closed') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'success') {
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
          osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1); // E6
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.25);
        } else {
          osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.4);
        }
      }
    } catch {
      // Audio or vibration unavailable
    }
  };

  const handleBarcodeSubmit = async (scannedSku: string) => {
    if (!orderId || !scannedSku.trim() || isPending) return;

    const sku = scannedSku.trim().toUpperCase();
    setIsPending(true);

    try {
      const res = await fetch('/api/packing/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, sku }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        triggerFeedbackSound('success');
        setLastScanResult({
          type: 'success',
          title: 'Item Packed!',
          detail: `${data.itemName} (${data.sku}) verified and packed.${data.orderFullyPacked ? ' Order complete!' : ''}`,
        });
      } else if (data.alreadyPacked) {
        triggerFeedbackSound('success');
        setLastScanResult({
          type: 'warning',
          title: 'Already Packed',
          detail: data.message || `"${data.itemName}" has already been packed.`,
        });
      } else {
        triggerFeedbackSound('error');
        setLastScanResult({
          type: 'error',
          title: 'Scan Warning',
          detail: data.error || `SKU "${sku}" mismatch.`,
        });
      }
    } catch (err: any) {
      triggerFeedbackSound('error');
      setLastScanResult({
        type: 'error',
        title: 'Connection Error',
        detail: 'Failed to communicate with warehouse packing station.',
      });
    } finally {
      setIsPending(false);
      setManualSku('');
    }
  };

  // Initialize camera scanner
  const startCamera = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }
      const html5Qrcode = new Html5Qrcode('phone-camera-reader');
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleBarcodeSubmit(decodedText);
        },
        () => {
          // Frame scan error — harmless
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.warn('[Camera Scanner Error]:', err);
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (orderId) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [orderId]);

  return (
    <div className="min-h-screen bg-jetblack text-white flex flex-col font-sans selection:bg-papaya selection:text-jetblack">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-papaya flex items-center justify-center text-jetblack font-black">
            <Barcode className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white leading-none">IoT Barcode Scanner</h1>
            <span className="text-[10px] text-papaya font-bold">Mobile Warehouse Device</span>
          </div>
        </div>
        <Link href="/" className="text-gray-400 hover:text-white p-1 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Active Order Context Card */}
          {!orderId ? (
            <div className="bg-gray-900 rounded-2xl p-5 border border-amber-900/30 space-y-3">
              <h2 className="text-sm font-bold text-papaya flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                Enter Packing Order ID
              </h2>
              <p className="text-xs text-gray-400">
                Scan the QR code on the desktop packing station, or enter the order reference ID below to pair this device.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Order ID (e.g. P4P-...)"
                  className="flex-1 rounded-xl bg-gray-800 border border-gray-700 px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-papaya"
                />
                <button
                  onClick={() => startCamera()}
                  className="bg-papaya text-jetblack px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-caramel transition-colors"
                >
                  Pair
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Connected Session</span>
                <span className="text-xs font-mono font-bold text-papaya">{orderId}</span>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setOrderId('');
                }}
                className="text-[10px] font-bold text-gray-400 underline hover:text-white"
              >
                Change Session
              </button>
            </div>
          )}

          {/* Camera Viewfinder */}
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-gray-800 shadow-2xl min-h-[260px] flex items-center justify-center">
            <div id="phone-camera-reader" className="w-full h-full" />

            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gray-900/90 backdrop-blur-xs">
                <Camera className="h-10 w-10 text-papaya animate-pulse" />
                <p className="text-xs text-gray-300 font-medium max-w-xs">
                  Tap below to start your smartphone camera scanner
                </p>
                <button
                  onClick={startCamera}
                  className="bg-papaya text-jetblack font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-caramel transition-all"
                >
                  Start Camera Scanner
                </button>
              </div>
            )}
          </div>

          {/* Result Alert Feedback */}
          {lastScanResult && (
            <div
              className={`rounded-2xl p-4 border text-xs leading-relaxed space-y-1 animate-in fade-in slide-in-from-top-2 ${
                lastScanResult.type === 'success'
                  ? 'bg-green-950/80 border-green-500/50 text-green-200'
                  : lastScanResult.type === 'warning'
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                  : 'bg-red-950/80 border-red-500/50 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {lastScanResult.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <span>{lastScanResult.title}</span>
              </div>
              <p className="text-xs text-white/90">{lastScanResult.detail}</p>
            </div>
          )}
        </div>

        {/* Manual SKU Fallback Form */}
        <div className="pt-4 border-t border-gray-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            Manual Barcode / SKU Input
          </span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleBarcodeSubmit(manualSku);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value)}
              placeholder="e.g. SKU / P4P-..."
              className="flex-1 rounded-xl bg-gray-900 border border-gray-800 px-3 py-3 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-papaya"
            />
            <button
              type="submit"
              disabled={isPending || !manualSku.trim()}
              className="bg-jetblack border border-papaya text-papaya hover:bg-papaya hover:text-jetblack px-5 py-3 rounded-xl font-black text-xs transition-all disabled:opacity-50"
            >
              {isPending ? 'Verifying...' : 'Submit SKU'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
