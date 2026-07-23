/**
 * useAuth Hook - reads the shared auth session from AuthContext.
 *
 * Backed by a single context provider (see contexts/AuthContext.tsx) so
 * every consumer shares one session check instead of each mounting its own
 * independent fetch. Kept as a re-export so existing `import { useAuth }
 * from '@/hooks/useAuth'` call sites don't need to change.
 */

export { useAuthContext as useAuth } from '@/contexts/AuthContext';
