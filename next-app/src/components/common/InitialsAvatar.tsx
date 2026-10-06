'use client';

import React from 'react';

interface InitialsAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function getInitials(name: string): string {
  if (!name) return '??';
  // Strip prefixes like Dr., Prof., etc.
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '??';
  if (words.length === 1) {
    const word = words[0];
    if (word.length === 1) return word.toUpperCase();
    return (word[0] + word[word.length - 1]).toUpperCase();
  }
  const first = words[0][0];
  const last = words[words.length - 1][0];
  return (first + last).toUpperCase();
}

const BG_COLORS = [
  'bg-indigo-600 text-white',
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
  'bg-cyan-600 text-white',
  'bg-purple-600 text-white',
  'bg-slate-700 text-white',
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BG_COLORS.length;
  return BG_COLORS[index];
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-14 h-14 text-base',
};

export const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  name,
  size = 'md',
  className = '',
}) => {
  const initials = getInitials(name);
  const colorClass = getColorForName(name || 'User');
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold tracking-tight select-none shadow-2xs flex-shrink-0 ${colorClass} ${sizeClass} ${className}`}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
};
