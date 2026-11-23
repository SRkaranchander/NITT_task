// ==============================================================================
// NOIR — FACTORY INTELLIGENCE OS
// Common Status Badge Component
// ==============================================================================

import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'blue' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const variantStyles = {
    default: 'bg-[#1C2129] text-[#E8EBF0] border-[#282E37]',
    success: 'bg-[#63D39B]/10 text-[#63D39B] border-[#63D39B]/30',
    warning: 'bg-[#F0B44D]/10 text-[#F0B44D] border-[#F0B44D]/30',
    critical: 'bg-[#F06B6B]/10 text-[#F06B6B] border-[#F06B6B]/30',
    blue: 'bg-[#72A9E8]/10 text-[#72A9E8] border-[#72A9E8]/30',
    muted: 'bg-[#15191F] text-[#8993A1] border-[#282E37]',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded border font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};
