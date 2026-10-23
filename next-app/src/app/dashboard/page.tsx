import React, { Suspense } from 'react';
import { getOptionalSession } from '@/lib/auth/get-session';
import { StudentDashboard } from '@/screens/student/StudentDashboard';
import { MentorDashboard } from '@/screens/mentor/MentorDashboard';
import { DirectoryPermissions } from '@/screens/admin/DirectoryPermissions';
import { DashboardSkeleton } from '@/components/common/DashboardSkeleton';

export const metadata = {
  title: 'Dashboard — VBridgeConnect',
};

export default async function DashboardPage() {
  const sessionUser = await getOptionalSession();
  const role = sessionUser?.role?.toLowerCase() || 'student';

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {role === 'coordinator' ? (
        <MentorDashboard />
      ) : role === 'super_admin' ? (
        <DirectoryPermissions />
      ) : role === 'industry_partner' ? (
        <MentorDashboard />
      ) : (
        <StudentDashboard />
      )}
    </Suspense>
  );
}
