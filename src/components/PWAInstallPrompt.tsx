import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, MonitorSmartphone, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed/standalone
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // No need to show installation banner if already installed
    }

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    // Check if Safari (Chrome on iOS has userAgent with CriOS and doesn't support PWA install from share sheet)
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    
    setIsIOS(isIOSDevice);

    // 3. Handle standard Chrome/Android installation prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has already dismissed it in this session
      const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. For iOS devices, show a custom prompt if not dismissed
    if (isIOSDevice && isSafari) {
      const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!isDismissed) {
        // Show after a brief delay so the user settles in
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    // Trigger standard browser prompt
    await deferredPrompt.prompt();
    
    // Wait for the user response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    
    // Clean up
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) {
    // Render iOS Guide modal even if main prompt is hidden, in case user clicks later
    if (showIOSGuide) {
      return <IOSGuideModal onClose={() => setShowIOSGuide(false)} />;
    }
    return null;
  }

  return (
    <>
      {/* Floating Installation Banner */}
      <div 
        id="pwa-install-banner"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="glass-panel bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[24px] p-4.5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 text-white p-2.5 rounded-2xl shadow-[0_4px_12px_rgba(99,102,241,0.3)] shrink-0">
              <MonitorSmartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white leading-none">install task manager</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-tight">
                add to your home screen for full-screen offline access
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-[14px] shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center space-x-1"
            >
              <Download className="h-3 w-3" />
              <span>INSTALL</span>
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && <IOSGuideModal onClose={() => setShowIOSGuide(false)} />}
    </>
  );
}

// iOS Safari Installation Instruction Modal
function IOSGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[32px] w-full max-w-sm overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] p-6 relative text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto h-12 w-12 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(99,102,241,0.4)] mb-4">
          <Smartphone className="h-6 w-6" />
        </div>

        <h3 className="text-sm font-bold text-white font-display">Install on iOS Device</h3>
        <p className="text-[11px] text-slate-400 mt-1">Follow these simple steps to install this app on your iPhone or iPad:</p>

        <div className="mt-5 space-y-4 text-left">
          {/* Step 1 */}
          <div className="flex items-start space-x-3">
            <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
              1
            </div>
            <div className="text-[11px] text-slate-300 leading-normal">
              Tap the <span className="font-bold text-white">Share</span> button in Safari browser's bottom toolbar.
              <div className="mt-1 flex items-center space-x-1 text-slate-400 font-mono text-[9px] bg-black/20 px-2 py-1 rounded-md w-fit">
                <Share className="h-3.5 w-3.5 text-indigo-400" />
                <span>usually represented by an arrow up box</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-3">
            <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
              2
            </div>
            <div className="text-[11px] text-slate-300 leading-normal">
              Scroll down the sharing menu and select <span className="font-bold text-white">"Add to Home Screen"</span>.
              <div className="mt-1 flex items-center space-x-1 text-slate-400 font-mono text-[9px] bg-black/20 px-2 py-1 rounded-md w-fit">
                <PlusSquare className="h-3.5 w-3.5 text-emerald-400" />
                <span>labeled as 'Add to Home Screen'</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-3">
            <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
              3
            </div>
            <div className="text-[11px] text-slate-300 leading-normal">
              Tap <span className="font-bold text-white">"Add"</span> in the top-right corner to complete!
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-[16px] border border-white/5 transition-all cursor-pointer"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
