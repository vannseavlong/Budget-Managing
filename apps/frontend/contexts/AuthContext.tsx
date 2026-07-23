/**
 * AuthProvider - single shared source of auth state for the whole app.
 *
 * Previously useAuth() was a plain hook with its own local state, called
 * independently by ProtectedRoute, the dashboard page, Sidebar, and Topbar
 * — all mounting together on a protected page. Each instance ran its own
 * getCurrentUser() fetch on mount (several parallel /profile requests per
 * page load), and any single failure among them (a network blip, a slow
 * cold-start response) cleared the shared localStorage session for all of
 * them, bouncing the user back to login even though their token was fine.
 *
 * This context fetches/verifies the session exactly once per app load, and
 * only clears it on an actual 401/403 (a truly invalid/expired token) — a
 * transient error just skips the background refresh and keeps the
 * cached session.
 */
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authService, User } from '@/lib/auth-service';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isAuthError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  return status === 401 || status === 403;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || initialized.current) return;
    initialized.current = true;

    const cachedUser = authService.getUser();
    if (cachedUser && authService.isAuthenticated()) {
      // Render with the cached identity immediately — don't block the UI
      // on a network round-trip for a session we already have. Verify in
      // the background and only act on a confirmed-invalid token.
      setUser(cachedUser);
      setIsLoading(false);

      authService
        .getCurrentUser()
        .then(setUser)
        .catch(async (error) => {
          if (isAuthError(error)) {
            await authService.logout();
            setUser(null);
          }
          // Transient error (network, rate limit, cold start): keep the
          // cached session as-is.
        });
      return;
    }

    setIsLoading(false);
  }, [isHydrated]);

  const login = useCallback(async () => {
    await authService.redirectToGoogle();
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authService.getCurrentUser();
      setUser(fresh);
      return fresh;
    } catch (error) {
      if (isAuthError(error)) {
        await authService.logout();
        setUser(null);
      }
      return null;
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: isHydrated && !!user,
    isLoading: !isHydrated || isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}
