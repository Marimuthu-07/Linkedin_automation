import React from 'react';

export interface DistributionItem {
  label: string;
  count: number;
  subValue?: string | number;
  color?: string;
  badge?: string;
}

interface DistributionBarProps {
  title: string;
  subtitle?: string;
  items: DistributionItem[];
  emptyMessage?: string;
}

export const DistributionBar: React.FC<DistributionBarProps> = ({
  title,
  subtitle,
  items,
  emptyMessage = 'No distribution data available.',
}) => {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  const defaultColors = [
    'bg-indigo-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-cyan-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-blue-500',
    'bg-teal-500',
  ];

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white font-heading">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-mono text-slate-400 border border-slate-700/50">
          {total} Total
        </span>
      </div>

      {items.length === 0 || total === 0 ? (
        <p className="py-8 text-center text-xs text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Multi-segment Progress Bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-slate-800">
            {items.map((item, idx) => {
              const pct = (item.count / total) * 100;
              if (pct === 0) return null;
              const colorClass = item.color || defaultColors[idx % defaultColors.length];
              return (
                <div
                  key={item.label}
                  style={{ width: `${pct}%` }}
                  title={`${item.label}: ${item.count} (${Math.round(pct)}%)`}
                  className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 ${colorClass}`}
                />
              );
            })}
          </div>

          {/* Detailed Item List */}
          <div className="space-y-2.5 pt-2">
            {items.map((item, idx) => {
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              const colorClass = item.color || defaultColors[idx % defaultColors.length];
              return (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${colorClass}`} />
                    <span className="font-medium text-slate-300 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    {item.subValue && <span className="text-slate-400">{item.subValue}</span>}
                    <span className="text-slate-200 font-semibold">{item.count}</span>
                    <span className="text-[11px] text-slate-500 w-9 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
