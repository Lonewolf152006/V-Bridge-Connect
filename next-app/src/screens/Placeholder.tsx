'use client';

import React from 'react';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Construction, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface PlaceholderProps {
  title: string;
  description?: string;
}

export const Placeholder: React.FC<PlaceholderProps> = ({
  title,
  description = 'This view is currently in development according to task.md milestones.',
}) => {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card padding="lg" className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mx-auto mb-4">
          <Construction className="w-8 h-8 stroke-[1.75]" />
        </div>

        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
          Module In Progress
        </span>

        <h2 className="text-2xl font-bold text-slate-900 mt-4 font-display">
          {title}
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          {description}
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.back()}
          >
            Back to Safety
          </Button>
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard')}
          >
            Go to Student Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};
