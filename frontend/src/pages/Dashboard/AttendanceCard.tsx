import React from 'react';
import { Users, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: 'users' | 'check' | 'x' | 'clock' | 'trend';
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'indigo';
}

const iconMap = {
  users: Users,
  check: CheckCircle2,
  x: XCircle,
  clock: Clock,
  trend: TrendingUp,
};

const variantStyles: Record<
  NonNullable<AttendanceCardProps['variant']>,
  { card: string; icon: string; iconBg: string; value: string }
> = {
  default: {
    card: 'border-gray-200',
    icon: 'text-gray-500',
    iconBg: 'bg-gray-100',
    value: 'text-gray-900',
  },
  success: {
    card: 'border-green-200',
    icon: 'text-green-600',
    iconBg: 'bg-green-100',
    value: 'text-green-700',
  },
  danger: {
    card: 'border-red-200',
    icon: 'text-red-600',
    iconBg: 'bg-red-100',
    value: 'text-red-700',
  },
  warning: {
    card: 'border-yellow-200',
    icon: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    value: 'text-yellow-700',
  },
  indigo: {
    card: 'border-indigo-200',
    icon: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
    value: 'text-indigo-700',
  },
};

export function AttendanceCard({
  title,
  value,
  description,
  icon = 'users',
  variant = 'default',
}: AttendanceCardProps) {
  const Icon = iconMap[icon];
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-5 shadow-sm flex items-center gap-4',
        styles.card
      )}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', styles.iconBg)}>
        <Icon className={cn('h-6 w-6', styles.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className={cn('text-2xl font-bold', styles.value)}>{value}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{description}</p>
        )}
      </div>
    </div>
  );
}
