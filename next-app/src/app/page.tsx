'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';

export default function HomePage() {
  const router = useRouter();
  const { currentUser } = useAppStore();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (currentUser.role === 'STUDENT') {
      router.replace('/dashboard');
    } else if (currentUser.role === 'COORDINATOR') {
      router.replace('/coordinator/activities');
    } else if (currentUser.role === 'SUPER_ADMIN') {
      router.replace('/admin/people');
    } else {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
        <span>Routing to persona dashboard...</span>
      </div>
    </div>
  );
}
