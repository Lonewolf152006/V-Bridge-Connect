'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { Home, Compass, FolderGit2, MessageSquare, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileBottomNavProps {
  isSimulation?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ isSimulation = false }) => {
  const { currentUser } = useAppStore();
  const pathname = usePathname();

  const getHomePath = () => {
    switch (currentUser.role) {
      case 'FACULTY_MENTOR':
        return '/mentor/dashboard';
      case 'COORDINATOR':
        return '/coordinator/activities';
      case 'SUPER_ADMIN':
        return '/admin/reports';
      default:
        return '/dashboard';
    }
  };

  const homePath = getHomePath();

  return (
    <nav
      className={cn(
        'bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-2 flex items-center justify-around select-none',
        isSimulation
          ? 'absolute bottom-0 left-0 right-0 z-40 shadow-lg'
          : 'lg:hidden fixed bottom-0 left-0 right-0 z-40'
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

      <Link
        href="/activities"
        className={cn(
          'flex flex-col items-center gap-1 text-[10px] font-medium p-1 transition-colors',
          pathname === '/activities' ? 'text-indigo-600 font-bold' : 'text-slate-500'
        )}
      >
        <Compass className="w-5 h-5" />
        <span>Catalog</span>
      </Link>

      <Link
        href="/projects/team-001"
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
