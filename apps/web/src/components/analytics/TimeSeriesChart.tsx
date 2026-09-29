import React, { useState } from 'react';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

export interface ChartDataPoint {
  date: string;
  value: number;
  secondaryValue?: number;
  label?: string;
  metadata?: Record<string, any>;
}

interface TimeSeriesChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  loading?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  secondaryLabel?: string;
  colorScheme?: 'indigo' | 'purple' | 'emerald' | 'cyan' | 'amber';
  height?: number;
  emptyMessage?: string;
  chartType?: 'bar' | 'area';
  onPointClick?: (point: ChartDataPoint) => void;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  title,
  subtitle,
  data,
  loading = false,
  valuePrefix = '',
  valueSuffix = '',
  secondaryLabel,
  colorScheme = 'indigo',
  height = 180,
  emptyMessage = 'No data points recorded for this date range.',
  chartType = 'bar',
  onPointClick,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  const colors = {
    indigo: {
      bar: 'bg-indigo-600 hover:bg-indigo-500',
      gradient: 'from-indigo-600 to-indigo-400',
      line: '#6366f1',
      fill: 'rgba(99, 102, 241, 0.15)',
      badge: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    },
    purple: {
      bar: 'bg-purple-600 hover:bg-purple-500',
      gradient: 'from-purple-600 to-purple-400',
      line: '#a855f7',
      fill: 'rgba(168, 85, 247, 0.15)',
      badge: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
    emerald: {
      bar: 'bg-emerald-600 hover:bg-emerald-500',
      gradient: 'from-emerald-600 to-emerald-400',
      line: '#10b981',
      fill: 'rgba(16, 185, 129, 0.15)',
      badge: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    cyan: {
      bar: 'bg-cyan-600 hover:bg-cyan-500',
      gradient: 'from-cyan-600 to-cyan-400',
      line: '#06b6d4',
      fill: 'rgba(6, 182, 212, 0.15)',
      badge: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    },
    amber: {
      bar: 'bg-amber-600 hover:bg-amber-500',
      gradient: 'from-amber-600 to-amber-400',
      line: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.15)',
      badge: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
  }[colorScheme];

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl animate-pulse">
        <div className="h-4 w-1/3 bg-slate-800 rounded mb-2" />
        <div className="h-3 w-1/4 bg-slate-800/60 rounded mb-6" />
        <div className="flex items-end gap-2" style={{ height: `${height}px` }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-800/40 rounded-t"
              style={{ height: `${20 + (i % 5) * 15}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const avgValue = data.length > 0 ? Math.round((totalValue / data.length) * 10) / 10 : 0;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl transition-all">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-white font-heading">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-mono text-slate-300 border border-slate-700/50">
            Total: {valuePrefix}{totalValue.toLocaleString()}{valueSuffix}
          </span>
          <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-mono text-slate-400 border border-slate-700/50">
            Avg: {valuePrefix}{avgValue.toLocaleString()}{valueSuffix}
          </span>
        </div>
      </div>

      {/* Chart Area */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
          <BarChart3 className="h-8 w-8 text-slate-600 mb-2" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-6">
          {/* Visual Container */}
          <div className="relative" style={{ height: `${height}px` }}>
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-slate-700 w-full" />
              <div className="border-b border-slate-700 w-full" />
              <div className="border-b border-slate-700 w-full" />
            </div>

            {chartType === 'bar' ? (
              /* Bar Chart Representation */
              <div className="flex h-full items-end gap-1 sm:gap-1.5 pt-4">
                {data.map((point, index) => {
                  const heightPercent = Math.max(6, (point.value / maxValue) * 100);
                  const isHovered = hoveredPoint?.date === point.date;

                  return (
                    <div
                      key={point.date || index}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => onPointClick?.(point)}
                      className="group relative flex-1 flex flex-col items-center h-full justify-end cursor-pointer"
                    >
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute -top-14 z-30 flex flex-col items-center rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1 text-[11px] text-white shadow-2xl whitespace-nowrap pointer-events-none">
                          <span className="font-semibold text-slate-300">{point.date}</span>
                          <span className="font-bold text-white">
                            {valuePrefix}{point.value.toLocaleString()}{valueSuffix}
                          </span>
                          {point.secondaryValue !== undefined && secondaryLabel && (
                            <span className="text-[10px] text-slate-400">
                              {secondaryLabel}: {point.secondaryValue}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bar Item */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all duration-200 ${
                          point.value > 0
                            ? isHovered
                              ? `bg-gradient-to-t ${colors.gradient} brightness-125 shadow-lg`
                              : `bg-gradient-to-t ${colors.gradient} opacity-90`
                            : 'bg-slate-800/40 hover:bg-slate-700/60'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Area / Line Chart Representation */
              <svg
                viewBox={`0 0 ${data.length * 20} ${height}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={`gradient-${colorScheme}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colors.line} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={colors.line} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area Path */}
                {(() => {
                  const points = data.map((d, i) => {
                    const x = i * 20 + 10;
                    const y = height - (d.value / maxValue) * (height - 20) - 10;
                    return `${x},${y}`;
                  });
                  const pathD = `M 10,${height} L ${points.join(' L ')} L ${data.length * 20 - 10},${height} Z`;
                  const lineD = `M ${points.join(' L ')}`;

                  return (
                    <>
                      <path d={pathD} fill={`url(#gradient-${colorScheme})`} />
                      <path d={lineD} fill="none" stroke={colors.line} strokeWidth="2.5" strokeLinecap="round" />
                    </>
                  );
                })()}
              </svg>
            )}
          </div>

          {/* X-Axis Range Labels */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{data[0]?.date || 'Start'}</span>
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">
              {data.length} data point{data.length !== 1 ? 's' : ''}
            </span>
            <span>{data[data.length - 1]?.date || 'End'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
