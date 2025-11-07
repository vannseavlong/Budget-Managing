'use client';

import { Card } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { cn } from '@/lib/utils';

interface DashboardHeroCardProps {
  title: string;
  amount: string;
  totalBudget: string;
  remaining: string;
  percentage: number;
  className?: string;
}

export function DashboardHeroCard({
  title,
  amount,
  totalBudget,
  remaining,
  percentage,
  className,
}: DashboardHeroCardProps) {
  return (
    <Card
      className={cn(
        'bg-linear-to-br from-slate-900 to-slate-800 text-white border-none p-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-white/80 text-sm font-medium mb-2">{title}</h3>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-bold">{amount}</span>
              <span className="text-white/60 text-sm">/ {totalBudget}</span>
            </div>
            <p className="text-white/70 text-sm">{remaining}</p>
          </div>
        </div>

        <div className="ml-6">
          <CircularProgress value={percentage} size={80} strokeWidth={6}>
            <div className="text-center">
              <span className="text-lg font-bold text-white">
                {percentage}%
              </span>
            </div>
          </CircularProgress>
        </div>
      </div>
    </Card>
  );
}
