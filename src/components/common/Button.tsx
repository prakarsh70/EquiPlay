import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'amber' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold tracking-wide rounded-xl select-none transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 min-h-[48px] px-5 py-3 shadow-sm';

  const variants = {
    primary:
      'bg-emerald-500 hover:bg-emerald-400 text-slate-950 focus:ring-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:active:scale-100 shadow-emerald-950/20',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-400 disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed disabled:active:scale-100',
    amber:
      'bg-amber-400 hover:bg-amber-300 text-slate-950 focus:ring-amber-300 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:active:scale-100 shadow-amber-950/20',
    danger:
      'bg-rose-500 hover:bg-rose-400 text-white focus:ring-rose-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:active:scale-100 shadow-rose-950/20',
    ghost:
      'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white focus:ring-slate-600 disabled:text-slate-600 disabled:active:scale-100 shadow-none',
    outline:
      'border-2 border-emerald-500/80 hover:bg-emerald-500/10 text-emerald-400 focus:ring-emerald-400 disabled:border-slate-800 disabled:text-slate-600 disabled:active:scale-100',
  };

  const sizes = {
    sm: 'text-sm min-h-[48px] px-3 py-2',
    md: 'text-base min-h-[48px] px-5 py-3',
    lg: 'text-lg min-h-[56px] px-6 py-4',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

