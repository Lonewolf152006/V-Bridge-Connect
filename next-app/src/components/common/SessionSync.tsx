'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/appStore';
import type { UserRole } from '@/types';

export function SessionSync() {
  const { data: session, status } = useSession();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const u = session.user as any;
      const roleStr = (u.role || 'student').toUpperCase() as UserRole;
      
      setCurrentUser({
        id: u.id || 'user-live',
        name: u.name || u.email?.split('@')[0] || 'Authenticated User',
        email: u.email || '',
        role: roleStr,
        department: u.departmentName || 'Electronics and Computer Science',
        avatarUrl: u.avatarUrl || u.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(u.name || 'User')}`,
        institutionalId: u.institutionalId || undefined,
        isOnline: true,
      });
    }
  }, [session, status, setCurrentUser]);

  return null;
}
