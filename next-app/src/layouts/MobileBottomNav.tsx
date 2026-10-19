'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';
import { Home, Folder, MessageSquare, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileBottomNavProps {
  isSimulation?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ isSimulation = false }) => {
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

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        'border-t border-slate-800 bg-slate-900 select-none transition-all flex h-16 items-center justify-around z-50',
        isSimulation ? 'absolute bottom-0 left-0 right-0' : 'fixed bottom-0 left-0 right-0 md:hidden'
      )}
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
  );
};
