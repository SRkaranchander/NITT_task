// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// KPI Metric Card Component
// ==============================================================================

import React from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'critical' | 'muted' | 'blue';
  };
  highlightColor?: 'amber' | 'green' | 'red' | 'blue' | 'default';
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  highlightColor = 'default',
  onClick,
  className,
}) => {
  const borderHighlight = {
    default: 'hover:border-[#363E4A]',
    amber: 'border-l-2 border-l-[#E5AC58] hover:border-l-[#E5AC58]',
    green: 'border-l-2 border-l-[#63D39B] hover:border-l-[#63D39B]',
    red: 'border-l-2 border-l-[#F06B6B] hover:border-l-[#F06B6B]',
    blue: 'border-l-2 border-l-[#72A9E8] hover:border-l-[#72A9E8]',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'metric-card bg-[#15191F] border border-[#282E37] p-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-[#1C2129]',
        borderHighlight[highlightColor],
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wide text-[#8993A1]">
          {title}
        </span>
        {Icon && <span className="metric-icon"><Icon className="w-[18px] h-[18px] text-[#2F7551]" /></span>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="metric-value text-2xl font-bold tracking-tight text-[#E8EBF0]">
          {value}
        </div>
        {badge && (
          <span
            className={clsx(
              'text-[10px] font-mono px-1.5 py-0.5 rounded border',
              badge.variant === 'success' && 'bg-[#63D39B]/10 text-[#63D39B] border-[#63D39B]/30',
              badge.variant === 'warning' && 'bg-[#F0B44D]/10 text-[#F0B44D] border-[#F0B44D]/30',
              badge.variant === 'critical' && 'bg-[#F06B6B]/10 text-[#F06B6B] border-[#F06B6B]/30',
              badge.variant === 'blue' && 'bg-[#72A9E8]/10 text-[#72A9E8] border-[#72A9E8]/30',
              badge.variant === 'muted' && 'bg-[#1C2129] text-[#8993A1] border-[#282E37]'
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-[#8993A1] mt-1.5 flex items-center gap-1">
          {subtitle}
        </div>
      )}
    </div>
  );
};
