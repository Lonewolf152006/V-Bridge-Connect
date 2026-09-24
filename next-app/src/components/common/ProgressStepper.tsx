'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string | number;
  title: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface ProgressStepperProps {
  steps: Step[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onStepClick?: (step: Step, index: number) => void;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  orientation = 'horizontal',
  className,
  onStepClick,
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={cn('relative pl-6 space-y-6', className)}>
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-200 -z-0" />

        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';

          return (
            <div
              key={step.id}
              onClick={() => onStepClick?.(step, idx)}
              className={cn(
                'relative flex items-start gap-4 group',
                onStepClick && 'cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all -ml-6 z-10',
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-white border-2 border-slate-300 text-slate-400 group-hover:border-slate-400'
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
              </div>

              <div className="pt-0.5">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isCurrent
                      ? 'text-indigo-600'
                      : isCompleted
                      ? 'text-slate-900'
                      : 'text-slate-500'
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />

        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';

          return (
            <div
              key={step.id}
              onClick={() => onStepClick?.(step, idx)}
              className={cn(
                'flex flex-col items-center relative z-10 group',
                onStepClick && 'cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm'
                    : 'bg-white border-2 border-slate-300 text-slate-400 group-hover:border-slate-400'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>

              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center max-w-[100px] truncate',
                  isCurrent
                    ? 'text-indigo-600 font-bold'
                    : isCompleted
                    ? 'text-slate-800'
                    : 'text-slate-400'
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
