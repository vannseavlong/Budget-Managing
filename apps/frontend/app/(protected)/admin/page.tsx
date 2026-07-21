'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { DashboardStatCard } from '@/components/common/DashboardStatCard';
import { AdminService, AdminStats } from '@/lib/admin-service';
import { Users, UserCheck } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const { isLoading: isAuthLoading } = useProtectedRoute();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side enforcement is the real guard (requireAdmin on
  // /api/v1/admin/*) — this is just UX so a non-admin doesn't sit on a
  // blank/erroring page.
  useEffect(() => {
    if (!isAuthLoading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (isAuthLoading || !user || user.role !== 'admin') return;

    let cancelled = false;
    setIsLoadingStats(true);
    setError(null);

    AdminService.getStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load stats');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, user]);

  if (isAuthLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-gray-900">
          Admin
        </h1>
        <p className="text-sm text-gray-500">
          Aggregate account stats. No user's budget data is shown here.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DashboardStatCard
          title="Total users"
          value={isLoadingStats ? '—' : (stats?.totalUsers ?? 0)}
          icon={Users}
        />
        <DashboardStatCard
          title={`Active users (last ${stats?.activeWindowDays ?? 30} days)`}
          value={isLoadingStats ? '—' : (stats?.activeUsers ?? 0)}
          icon={UserCheck}
        />
      </div>
    </div>
  );
}
