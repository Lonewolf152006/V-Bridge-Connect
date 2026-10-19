'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // default true to avoid flash
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if app is running in standalone PWA / TWA mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(standaloneMode);
    if (standaloneMode) return;

    // Check recent dismissal
    const dismissedAt = localStorage.getItem('vbridge_pwa_install_dismissed');
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (days < 7) {
        setDismissed(true);
      }
    }

    // Android / Chromium beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafariBrowser =
      userAgent.includes('safari') &&
      !userAgent.includes('crios') &&
      !userAgent.includes('fxios') &&
      !userAgent.includes('chrome');

    if (isIPhoneDevice && isSafariBrowser && !standaloneMode) {
      setIsIOS(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('vbridge_pwa_install_dismissed', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  // Never render if running in standalone mode or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  // 1. Android / Chromium Custom Install Button
  if (deferredPrompt) {
    return (
      <div
        id="pwa-android-install-prompt"
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                Install VBridgeConnect
              </h3>
              <p className="text-xs text-slate-400">
                Install as a native app for faster access, offline mode & alerts.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={handleDismiss}
            className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Not Now
          </button>
          <button
            id="btn-install-pwa"
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Install App</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. iOS Safari Instruction Card
  if (isIOS) {
    return (
      <div
        id="pwa-ios-install-prompt"
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-3xl shadow-2xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Smartphone className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white font-display">
                Install VBridge on iPhone
              </h3>
              <p className="text-[11px] text-slate-400">
                Add to your home screen for a full-screen app experience.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss"
            aria-label="Dismiss iOS install card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
              1
            </span>
            <span className="flex items-center gap-1.5 flex-wrap">
              Tap the <Share className="w-3.5 h-3.5 text-indigo-400 inline" /> <strong>Share</strong> button in Safari's toolbar.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
              2
            </span>
            <span className="flex items-center gap-1.5 flex-wrap">
              Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-indigo-400 inline" /> <strong>Add to Home Screen</strong>.
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={handleDismiss}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    );
  }

  return null;
};
