import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
}) => {
  return (
    <Card variant="raised" className="relative overflow-hidden group hover:scale-[1.015] transition-all duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] truncate">
            {title}
          </p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {value}
          </h4>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] font-medium pt-0.5">{subtitle}</p>
          )}
          {trend && (
            <p
              className={`text-xs font-semibold pt-1 truncate ${
                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div className="w-12 h-12 shrink-0 rounded-2xl neu-inset text-[var(--accent)] flex items-center justify-center border border-[var(--border-subtle)]">
          {icon}
        </div>
      </div>
    </Card>
  );
};
