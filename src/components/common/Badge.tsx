import React from 'react';

interface BadgeProps {
  variant?: 'emerald' | 'amber' | 'slate' | 'rose' | 'blue';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  children,
  className = '',
  dot = false,
}) => {
  const variants = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    blue: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  };

  const dotColors = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400 animate-pulse',
    slate: 'bg-slate-500',
    rose: 'bg-rose-400',
    blue: 'bg-sky-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${variants[variant]} ${className}`}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

