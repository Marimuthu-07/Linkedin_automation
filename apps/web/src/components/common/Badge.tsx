import React from 'react';
import { cn, getStatusColor } from '../../lib/utils.js';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'status' | 'default' | 'outline' | 'tech';
  status?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  status,
  className,
  size = 'sm',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (variant === 'status' && status) {
    const { bg, text, border } = getStatusColor(status);
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border font-medium tracking-wide uppercase',
          sizeClasses,
          bg,
          text,
          border,
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {children}
      </span>
    );
  }

  if (variant === 'tech') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md border border-slate-700/60 bg-slate-800/60 font-mono text-slate-300',
          sizeClasses,
          className
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-slate-700/50 bg-slate-800/40 text-slate-300 font-medium',
        sizeClasses,
        className
      )}
    >
      {children}
    </span>
  );
};
