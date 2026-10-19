'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('[Root Error Boundary caught exception]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Warning Icon Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Unable to load page
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            A temporary connection or render issue occurred while loading this section.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload & Try Again</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/login"
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800/80 text-slate-300 font-medium text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>

            <Link
              href="/dashboard"
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800/80 text-slate-300 font-medium text-xs transition-all border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Collapsible Error Digest */}
        {error?.message && (
          <details className="w-full text-left text-xs bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-400">
            <summary className="cursor-pointer font-mono text-[11px] text-slate-500 hover:text-slate-400 select-none">
              Diagnostic details
            </summary>
            <div className="mt-2 font-mono text-[11px] text-rose-400 break-words leading-relaxed">
              {error.message}
              {error.digest && (
                <div className="mt-1 text-slate-500 text-[10px]">
                  Digest: {error.digest}
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
