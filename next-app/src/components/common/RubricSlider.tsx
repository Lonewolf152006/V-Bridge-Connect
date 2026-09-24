'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface RubricSliderProps {
  criterionId: string;
  title: string;
  description?: string;
  maxPoints: number;
  value: number;
  onChange: (value: number) => void;
  descriptors?: string[];
  disabled?: boolean;
}

export const RubricSlider: React.FC<RubricSliderProps> = ({
  title,
  description,
  maxPoints,
  value,
  onChange,
  descriptors,
  disabled = false,
}) => {
  const percentage = (value / maxPoints) * 100;

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 60) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (percentage >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
        <div
          className={cn(
            'px-2.5 py-1 rounded-lg border font-mono font-bold text-sm tracking-tight flex items-baseline gap-1',
            getScoreColor()
          )}
        >
          <span>{value}</span>
          <span className="text-xs text-slate-400 font-normal">/ {maxPoints}</span>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <input
          type="range"
          min="0"
          max={maxPoints}
          step="0.5"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none disabled:opacity-50"
        />
        <div className="flex justify-between text-[11px] font-mono text-slate-400 px-0.5">
          <span>0 pts (Inadequate)</span>
          <span>{(maxPoints / 2).toFixed(1)} pts</span>
          <span>{maxPoints} pts (Exemplary)</span>
        </div>
      </div>

      {descriptors && descriptors.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Performance Criteria
          </span>
          <ul className="text-xs text-slate-600 space-y-1">
            {descriptors.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
