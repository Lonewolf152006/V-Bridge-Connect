'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const AnalyticsAuditReports: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/people');
  }, [router]);

  return null;
};
