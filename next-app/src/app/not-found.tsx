import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl flex flex-col items-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            404
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            The page you are looking for might have been moved, renamed, or is temporarily unavailable.
          </p>
        </div>

        <div className="w-full flex items-center justify-center gap-2 pt-2">
          <Link
            href="/login"
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
