import React from 'react';
import type { TeamRiskLevel } from '@/types';
import { getRiskConfig, cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface RiskBadgeProps {
  level: TeamRiskLevel;
  className?: string;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  className,
  showIcon = true,
}) => {
  const config = getRiskConfig(level);

  const icons = {
    ON_TRACK: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    NEEDS_ATTENTION: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
    AT_RISK: <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs select-none',
        config.classes,
        className
      )}
    >
      {showIcon && icons[level]}
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      <span>{config.label}</span>
    </span>
  );
};
