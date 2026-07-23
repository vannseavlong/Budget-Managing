import type { TokenStore, OAuthTokens } from 'longcelot-sheet-db';
import { getRedisClient } from '../redisClient';
import { logger } from '../../utils/logger';

const KEY_PREFIX = 'lsdb:user-tokens:';

/**
 * Redis-backed implementation of lsdb's `tokenStore` interface, keyed by
 * email. Captures a user's Google OAuth tokens at signup/login so
 * `adapter.createUserSheet(..., { actorTokens })` can create their sheet in
 * their own Drive. This is the only place a user's Google tokens are ever
 * persisted — never in the app JWT (see docs/BACKEND_REBUILD_PLAN.md §4.5).
 */
export const redisTokenStore: TokenStore = {
  async get(actorId: string): Promise<OAuthTokens | null> {
    try {
      const redis = await getRedisClient();
      const raw = await redis.get(`${KEY_PREFIX}${actorId}`);
      return raw ? (JSON.parse(raw) as OAuthTokens) : null;
    } catch (error) {
      logger.error(
        `Failed to read stored Google tokens for ${actorId}:`,
        error
      );
      return null;
    }
  },

  async set(actorId: string, tokens: OAuthTokens): Promise<void> {
    try {
      const redis = await getRedisClient();
      await redis.set(`${KEY_PREFIX}${actorId}`, JSON.stringify(tokens));
    } catch (error) {
      logger.error(`Failed to store Google tokens for ${actorId}:`, error);
    }
  },
};
