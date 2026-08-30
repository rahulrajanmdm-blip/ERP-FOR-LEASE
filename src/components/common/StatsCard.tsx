import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'sky';
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'indigo',
  onClick,
}) => {
  const schemeClasses = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };

  const iconBgClasses = {
    indigo: 'bg-indigo-600/20 text-indigo-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    amber: 'bg-amber-600/20 text-amber-400',
    rose: 'bg-rose-600/20 text-rose-400',
    purple: 'bg-purple-600/20 text-purple-400',
    sky: 'bg-sky-600/20 text-sky-400',
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border bg-slate-800/80 backdrop-blur-sm p-5 transition-all duration-200 hover:border-slate-600 ${
        onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg' : ''
      } border-slate-700/60`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${iconBgClasses[colorScheme]} ${schemeClasses[colorScheme]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isNeutral
                ? 'text-slate-400'
                : trend.isPositive
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">vs last cycle</span>
        </div>
      )}
    </div>
  );
};
