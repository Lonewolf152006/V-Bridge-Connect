import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, padding = 'md', children, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-2xl border border-slate-200/80 shadow-xs transition-all duration-200',
          hoverEffect &&
            'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 cursor-pointer',
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
