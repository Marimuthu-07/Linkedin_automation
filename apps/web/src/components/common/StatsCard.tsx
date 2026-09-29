import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils.js';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose';
  onClick?: () => void;
}

const colorMap = {
  indigo: {
    bg: 'from-indigo-500/10 to-indigo-500/5',
    border: 'border-indigo-500/20',
    iconBg: 'bg-indigo-500/20 text-indigo-400',
    accent: 'text-indigo-400',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    accent: 'text-emerald-400',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20 text-amber-400',
    accent: 'text-amber-400',
  },
  cyan: {
    bg: 'from-cyan-500/10 to-cyan-500/5',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    accent: 'text-cyan-400',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-500/5',
    border: 'border-purple-500/20',
    iconBg: 'bg-purple-500/20 text-purple-400',
    accent: 'text-purple-400',
  },
  rose: {
    bg: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/20 text-rose-400',
    accent: 'text-rose-400',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'indigo',
  onClick,
}) => {
  const scheme = colorMap[colorScheme];

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 backdrop-blur-md transition-all duration-200',
        scheme.bg,
        scheme.border,
        onClick && 'cursor-pointer hover:border-slate-500/50 hover:shadow-lg hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white font-heading">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={cn('rounded-lg p-2.5', scheme.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'font-semibold',
              trend.positive ? 'text-emerald-400' : 'text-slate-400'
            )}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">vs last period</span>
        </div>
      )}
    </div>
  );
};
