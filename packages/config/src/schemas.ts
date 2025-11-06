// Zod schemas for validation
import { z } from 'zod';

export const ConfigSchema = z.object({
  database: z
    .object({
      url: z.string().optional(),
      host: z.string().optional(),
      port: z.number().optional(),
      name: z.string().optional(),
    })
    .optional(),

  server: z
    .object({
      port: z.number().optional(),
      host: z.string().optional(),
    })
    .optional(),

  api: z
    .object({
      baseUrl: z.string().optional(),
      version: z.string().optional(),
    })
    .optional(),
});

export const AppConfigSchema = ConfigSchema.extend({
  environment: z.enum(['development', 'production', 'test']),
});
