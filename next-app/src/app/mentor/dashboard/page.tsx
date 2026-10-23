import { Suspense } from 'react';
import { MentorDashboard } from '@/screens/mentor/MentorDashboard';
import { DashboardSkeleton } from '@/components/common/DashboardSkeleton';

export const metadata = {
  title: 'Mentor Cohort Health — VBridgeConnect',
};

export default function MentorDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <MentorDashboard />
    </Suspense>
  );
}
