'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';

    const variants = {
      primary:
        'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow focus-visible:ring-indigo-500 shadow-indigo-200',
      secondary:
        'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 focus-visible:ring-slate-400',
      outline:
        'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus-visible:ring-indigo-500 hover:border-slate-400',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow focus-visible:ring-rose-500 shadow-rose-200',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-400',
      success:
        'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow focus-visible:ring-emerald-500 shadow-emerald-200',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-12',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
