import { createClient, type RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (client) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const newClient: RedisClientType = createClient({ url });
    newClient.on('error', (err) => logger.error('Redis client error:', err));
    await newClient.connect();
    client = newClient;
    return newClient;
  })();

  return connecting;
}
