/**
 * useAuth Hook - React hook for authentication state management
 */

import { useState, useEffect, useCallback } from 'react';
import { authService, User } from '@/lib/auth-service';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isHydrated) return;

    const initializeAuth = async () => {
      try {
        const storedUser = authService.getUser();
        if (storedUser && authService.isAuthenticated()) {
          // Verify token is still valid by fetching current user
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Token might be expired, clear auth data
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [isHydrated]);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.redirectToGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!isHydrated) return;

    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  }, [isHydrated]);

  return {
    user,
    isAuthenticated: isHydrated && !!user && authService.isAuthenticated(),
    isLoading: !isHydrated || isLoading,
    login,
    logout,
    refreshUser,
  };
}
