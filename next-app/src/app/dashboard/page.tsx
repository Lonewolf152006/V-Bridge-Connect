'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { StudentDashboard } from '@/screens/student/StudentDashboard';
import { MentorDashboard } from '@/screens/mentor/MentorDashboard';
import { DirectoryPermissions } from '@/screens/admin/DirectoryPermissions';

export default function DashboardPage() {
  const { currentUser } = useAppStore();

  // Role-specific dashboard dispatch
  if (currentUser.role === 'COORDINATOR') {
    return <MentorDashboard />;
  }

  if (currentUser.role === 'SUPER_ADMIN') {
    return <DirectoryPermissions />;
  }

  if (currentUser.role === 'INDUSTRY_PARTNER') {
    return <MentorDashboard />;
  }

  // Default: Student Dashboard
  return <StudentDashboard />;
}
