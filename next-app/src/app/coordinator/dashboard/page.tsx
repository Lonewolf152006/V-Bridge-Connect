import { Suspense } from 'react';
import { MentorDashboard } from '@/screens/mentor/MentorDashboard';
import { DashboardSkeleton } from '@/components/common/DashboardSkeleton';

export const metadata = {
  title: 'Cohort Risk & Health — VBridgeConnect',
};

export default function CoordinatorDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MentorDashboard />
    </Suspense>
  );
}
