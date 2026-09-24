'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

import { usePathname } from 'next/navigation';

export interface DesktopShellProps {
  children: React.ReactNode;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({ children }) => {
  const { viewportMode } = useAppStore();
  const pathname = usePathname();

  if (pathname === '/login') {
    if (viewportMode === 'mobile') {
      return (
        <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col items-center justify-center">
          <div className="text-center mb-3">
            <span className="text-xs font-mono text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800 shadow-sm">
              📱 Mobile Simulation • iPhone 15 Viewport (390 × 844 px)
            </span>
          </div>
          <div className="w-[390px] h-[844px] max-h-[88vh] bg-slate-900 rounded-[50px] p-3 shadow-2xl ring-1 ring-white/10 border-4 border-slate-800 flex flex-col relative overflow-hidden">
            <div className="flex-1 bg-slate-900 rounded-[40px] overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      );
    }
    return <div className="min-h-screen bg-slate-900">{children}</div>;
  }

  if (viewportMode === 'mobile') {
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col items-center justify-center">
        <div className="text-center mb-3">
          <span className="text-xs font-mono text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800 shadow-sm">
            📱 Mobile Simulation • iPhone 15 Viewport (390 × 844 px)
          </span>
        </div>

        <div className="w-[390px] h-[844px] max-h-[88vh] bg-slate-900 rounded-[50px] p-3 shadow-2xl ring-1 ring-white/10 border-4 border-slate-800 flex flex-col relative overflow-hidden">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-end px-3 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          </div>

          <div className="flex-1 bg-slate-50 rounded-[40px] overflow-hidden flex flex-col relative shadow-inner">
            <TopNavbar />

            <div className="flex-1 overflow-y-auto pb-16">
              <Sidebar />
              <main className="p-3 pb-8">{children}</main>
            </div>

            <MobileBottomNav />

            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400/50 rounded-full z-50 pointer-events-none" />
          </div>
        </div>
      </div>
    );
  }

  if (viewportMode === 'tablet') {
    return (
      <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col items-center justify-center">
        <div className="text-center mb-3">
          <span className="text-xs font-mono text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800 shadow-sm">
            📟 Tablet Simulation • iPad Air Viewport (768 × 1024 px)
          </span>
        </div>

        <div className="w-[768px] h-[920px] max-h-[88vh] bg-slate-900 rounded-[38px] p-3 shadow-2xl ring-1 ring-white/10 border-4 border-slate-800 flex flex-col relative overflow-hidden">
          <div className="flex-1 bg-slate-50 rounded-[28px] overflow-hidden flex flex-col relative shadow-inner">
            <TopNavbar />
            <div className="flex-1 overflow-y-auto pb-16">
              <main className="p-4 pb-8">{children}</main>
            </div>
            <MobileBottomNav />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <TopNavbar />

      <div className="flex-1 flex max-w-[1920px] w-full mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
