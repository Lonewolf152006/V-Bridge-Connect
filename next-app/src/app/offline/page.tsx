'use client';

import React from 'react';
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <WifiOff className="w-8 h-8 text-indigo-400 animate-pulse" />
        </div>

        <h1 className="text-2xl font-black text-white font-display tracking-tight mb-2">
          You're Offline
        </h1>
        
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
          VBridgeConnect requires an active internet connection to securely access project data, rubric evaluations, and credentials.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleReload}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Check Connection & Retry</span>
          </button>

          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-slate-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-slate-700/80"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-[11px] text-slate-500">
          Cached static assets remain intact. Check your Wi-Fi or cellular network.
        </div>
      </div>
    </div>
  );
}
