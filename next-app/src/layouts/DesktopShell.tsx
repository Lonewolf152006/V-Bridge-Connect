'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Home, Folder, MessageSquare, Award } from 'lucide-react';

export interface DesktopShellProps {
  children: React.ReactNode;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({ children }) => {
  const viewportMode = useAppStore((state) => state.viewportMode);
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const pathname = usePathname();

  const teamId = activeWorkspace?.teamId;
  const projectsHref = teamId ? `/projects/${teamId}` : '/opportunities';

  const bottomNavItems = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: Home,
      isActive: pathname === '/dashboard',
    },
    {
      name: 'Projects',
      href: projectsHref,
      icon: Folder,
      isActive: pathname.startsWith('/projects') || pathname === '/opportunities',
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      isActive: pathname.startsWith('/messages'),
    },
    {
      name: 'Certificates',
      href: '/certificates',
      icon: Award,
      isActive: pathname.startsWith('/certificates'),
    },
  ];

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
      <div className="min-h-screen bg-slate-950 py-4 px-4 flex flex-col items-center justify-center">
        <div className="text-center mb-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800 shadow-sm">
            📱 Mobile Simulation • iPhone 15 Viewport (390 × 844 px)
          </span>
        </div>

        <div className="w-[390px] h-[844px] max-h-[92vh] bg-slate-900 rounded-[50px] p-3 shadow-2xl ring-1 ring-white/10 border-4 border-slate-800 flex flex-col relative overflow-hidden select-none">
          {/* Dynamic Island Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-end px-3 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          </div>

          <div className="flex-1 bg-slate-50 rounded-[40px] overflow-hidden flex flex-col relative shadow-inner">
            {/* Native Mobile Status Bar simulation */}
            <div className="h-10 pt-3 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-800 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-100">
              <span className="font-mono">9:41</span>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="text-[10px] font-bold">5G</span>
                <div className="w-5 h-2.5 rounded-sm border border-slate-700 p-0.5 flex items-center">
                  <div className="w-full h-full bg-slate-800 rounded-2xs" />
                </div>
              </div>
            </div>

            {/* Mobile-optimized Header */}
            <TopNavbar isSimulation={true} />

            {/* Scrollable Mobile Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 pb-24 phone-viewport-content">
              {children}
            </div>

            {/* Docked Mobile Bottom Navigation Bar */}
            <MobileBottomNav isSimulation={true} />

            {/* Home Bar Indicator */}
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
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile-Only Bottom Tab Navigation (Fixed PWA Bar with Safe Area Support) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] items-center justify-around border-t border-slate-800 bg-slate-900 md:hidden"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[11px] font-medium transition-colors ${
                item.isActive
                  ? 'text-indigo-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
