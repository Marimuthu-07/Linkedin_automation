import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { MetricComparison } from '@linkedin-growth/shared';

interface MetricDeltaBadgeProps {
  comparison?: MetricComparison | null;
  suffix?: string;
  className?: string;
}

export const MetricDeltaBadge: React.FC<MetricDeltaBadgeProps> = ({
  comparison,
  suffix = 'vs prev',
  className = '',
}) => {
  if (!comparison) return null;

  const { percentageChange, absoluteChange, previous, current } = comparison;

  if (previous === 0 && current > 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400 border border-indigo-500/20 ${className}`}
        title={`Current: ${current.toLocaleString()}, Previous: 0`}
      >
        <ArrowUpRight className="h-3 w-3" />
        <span>+{current.toLocaleString()} new</span>
      </span>
    );
  }

  if (percentageChange === null || percentageChange === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700/40 ${className}`}
        title={`Current: ${current.toLocaleString()}, Previous: ${previous.toLocaleString()}`}
      >
        <Minus className="h-3 w-3" />
        <span>0.0% {suffix}</span>
      </span>
    );
  }

  const isPositive = percentageChange > 0;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-semibold border transition-colors ${
        isPositive
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      } ${className}`}
      title={`Current: ${current.toLocaleString()}, Previous: ${previous.toLocaleString()} (${isPositive ? '+' : ''}${absoluteChange.toLocaleString()})`}
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3 shrink-0" /> : <ArrowDownRight className="h-3 w-3 shrink-0" />}
      <span>
        {isPositive ? '+' : ''}
        {percentageChange}%
      </span>
      {suffix && <span className="opacity-70 font-normal ml-0.5">{suffix}</span>}
    </span>
  );
};
