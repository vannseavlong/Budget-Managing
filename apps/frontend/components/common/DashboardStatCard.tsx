'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  trendColor?: 'green' | 'red' | 'blue' | 'gray';
  className?: string;
}

export function DashboardStatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendColor = 'gray',
  className,
}: DashboardStatCardProps) {
  const trendColorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600',
  };

  return (
    <Card className={cn('bg-white border border-gray-200', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {value}
            </p>
            {trend && (
              <p className={cn('text-xs mt-1', trendColorClasses[trendColor])}>
                {trend}
              </p>
            )}
          </div>
          {Icon && (
            <div className="ml-3">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
