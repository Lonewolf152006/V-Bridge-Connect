'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans antialiased">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-2xl font-bold">
            !
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Application Error
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              An unexpected system error occurred. Please reload to restore your session.
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              Reload Application
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/login'; }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all border border-slate-700 cursor-pointer"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
