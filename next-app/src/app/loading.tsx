import React from 'react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-6">
        {/* Animated Brand Emblem */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-3xl bg-indigo-500/20 animate-ping" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-500/30 ring-1 ring-white/20">
            V
          </div>
        </div>

        {/* Brand Title & Spinner */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>VBridge</span>
            <span className="text-indigo-400">Connect</span>
          </h2>
          <p className="text-xs text-slate-400">
            Loading institutional workspace & security context...
          </p>
        </div>

        {/* Smooth Indeterminate Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full animate-[shimmer_1.4s_infinite_linear] w-full" 
            style={{
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              backgroundSize: '200% 100%'
            }}
          />
        </div>

        {/* Pulse Dots */}
        <div className="flex items-center gap-1.5 pt-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
