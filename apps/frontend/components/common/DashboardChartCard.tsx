'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardChartCard({
  title,
  children,
  className,
}: DashboardChartCardProps) {
  return (
    <Card className={cn('bg-white border border-gray-200', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg font-semibold text-gray-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
