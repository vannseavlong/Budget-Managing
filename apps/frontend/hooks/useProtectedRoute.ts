/**
 * useProtectedRoute Hook - Protects routes and redirects unauthenticated users
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  return {
    isAuthenticated,
    isLoading,
  };
}
