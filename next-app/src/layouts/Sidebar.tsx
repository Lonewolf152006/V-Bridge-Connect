'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import {
  LayoutDashboard,
  Compass,
  FolderGit2,
  Award,
  MessageSquare,
  ClipboardCheck,
  FilePlus,
  Users2,
  ShieldCheck,
  BarChart3,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface SidebarItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
}

const NAV_ITEMS: SidebarItem[] = [
  {
    label: 'Overview',
    to: '/dashboard',
    icon: LayoutDashboard,
    roles: ['STUDENT'],
  },
  {
    label: 'Opportunities',
    to: '/activities',
    icon: Compass,
    roles: ['STUDENT', 'FACULTY_MENTOR', 'COORDINATOR', 'INDUSTRY_PARTNER', 'SUPER_ADMIN'],
  },
  {
    label: 'Workspace Hub',
    to: '/projects/team-001',
    icon: FolderGit2,
    roles: ['STUDENT', 'FACULTY_MENTOR', 'INDUSTRY_PARTNER'],
    badge: 'Live',
  },
  {
    label: 'Certificates & Ledger',
    to: '/certificates',
    icon: Award,
    roles: ['STUDENT'],
  },
  {
    label: 'Messages',
    to: '/messages',
    icon: MessageSquare,
    roles: ['STUDENT', 'FACULTY_MENTOR', 'COORDINATOR'],
  },
  {
    label: 'Cohort Health',
    to: '/mentor/dashboard',
    icon: LayoutDashboard,
    roles: ['FACULTY_MENTOR'],
  },
  {
    label: 'Rubric Grading',
    to: '/mentor/submissions/sub-001-v2/grade',
    icon: ClipboardCheck,
    roles: ['FACULTY_MENTOR', 'EXTERNAL_REVIEWER'],
    badge: '1 pending',
  },
  {
    label: 'Activity Builder',
    to: '/coordinator/activities',
    icon: FilePlus,
    roles: ['COORDINATOR'],
  },
  {
    label: 'Applications',
    to: '/coordinator/activities/activity-001/applications',
    icon: Users2,
    roles: ['COORDINATOR'],
    badge: '12 new',
  },
  {
    label: 'Directory & Roles',
    to: '/admin/people',
    icon: ShieldCheck,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Institutional Reports',
    to: '/admin/reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN'],
  },
];

export const Sidebar: React.FC = () => {
  const { currentUser, sidebarOpen, toggleSidebar } = useAppStore();
  const pathname = usePathname();

  const accessibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-2xs"
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 lg:top-16 left-0 z-40 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-sm font-display">
              Navigation
            </span>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Active Workspace
            </div>
            <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
              Team NexGen (Hackathon)
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Next: M2 Prototype</span>
              <span className="font-semibold text-amber-600">36h left</span>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Main Menu
            </div>
            {accessibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.to;

              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>NAAC / ABET Audit Ready</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            System v2.4 • Academic Year 2026
          </p>
        </div>
      </aside>
    </>
  );
};
