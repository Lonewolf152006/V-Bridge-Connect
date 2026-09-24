import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white border border-slate-200/80',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-bold text-slate-900 font-display">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
