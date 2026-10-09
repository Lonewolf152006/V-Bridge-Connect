'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { Home, Compass, FolderGit2, MessageSquare, Award, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileBottomNavProps {
  isSimulation?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ isSimulation = false }) => {
  const currentUser = useAppStore((state) => state.currentUser);
  const activeWorkspace = useAppStore((state) => state.activeWorkspace);
  const pathname = usePathname();

  const getHomePath = () => {
    switch (currentUser.role) {
      case 'COORDINATOR':
        return '/coordinator/dashboard';
      case 'SUPER_ADMIN':
        return '/admin/reports';
      default:
        return '/dashboard';
    }
  };

  const homePath = getHomePath();
  const workspacePath = activeWorkspace?.teamId
    ? `/projects/${activeWorkspace.teamId}`
    : '/projects/team-mini-6';

  return (
    <nav
      className={cn(
        'bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 flex items-center justify-around select-none transition-all',
        isSimulation
          ? 'absolute bottom-0 left-0 right-0 z-40 shadow-lg pt-1.5 pb-4'
          : 'lg:hidden fixed bottom-0 left-0 right-0 z-40 py-2'
      )}
    >
      <Link
        href={homePath}
        className={cn(
          'flex flex-col items-center gap-1 text-[10px] font-medium p-1 transition-colors',
          pathname === homePath ? 'text-indigo-600 font-bold' : 'text-slate-500'
        )}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </Link>

      {currentUser.role === 'COORDINATOR' || currentUser.role === 'SUPER_ADMIN' ? (
        <Link
          href="/coordinator/roster-upload"
          className={cn(
            'flex flex-col items-center gap-1 text-[10px] font-medium p-1 transition-colors',
            pathname === '/coordinator/roster-upload' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          )}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Roster</span>
        </Link>
      ) : (
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center gap-1 text-[10px] font-medium p-1 transition-colors',
            pathname === '/dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          )}
        >
          <FolderGit2 className="w-5 h-5" />
          <span>Projects</span>
        </Link>
      )}

      <Link
        href={workspacePath}
        className={cn(
          'flex flex-col items-center gap-1 text-[10px] font-medium p-1 transition-colors',
          pathname.startsWith('/projects') ? 'text-indigo-600 font-bold' : 'text-slate-500'
        )}
      >
        <FolderGit2 className="w-5 h-5" />
        <span>Workspace</span>
      </Link>

      <Link
        href="/messages"
        className={cn(
          'flex flex-col items-center gap-1 text-[10px] font-medium p-1 transition-colors',
          pathname === '/messages' ? 'text-indigo-600 font-bold' : 'text-slate-500'
        )}
      >
        <MessageSquare className="w-5 h-5" />
        <span>Chat</span>
      </Link>

      {currentUser.role === 'STUDENT' && (
        <Link
          href="/certificates"
          className={cn(
            'flex flex-col items-center gap-1 text-[10px] font-medium p-1 transition-colors',
            pathname === '/certificates' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          )}
        >
          <Award className="w-5 h-5" />
          <span>Ledger</span>
        </Link>
      )}
    </nav>
  );
};
