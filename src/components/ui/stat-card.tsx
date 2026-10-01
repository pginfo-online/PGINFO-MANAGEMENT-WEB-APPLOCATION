import * as React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  accentColor?: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'purple';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'emerald',
  className,
}: StatCardProps) {
  const colorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:border-emerald-500/40',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:border-amber-500/40',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:border-rose-500/40',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20 group-hover:border-sky-500/40',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/40',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/80 shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</div>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('rounded-xl border p-2.5 transition-colors', colorMap[accentColor])}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center font-medium',
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
            )}
            {trend.value}%
          </span>
          <span className="text-slate-500">{trend.label || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
}
