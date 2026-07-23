import { z } from 'zod';

export const authCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
  name: z.string().min(1, 'Name is required'),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Matches apps/frontend's http-client.ts interceptor exactly: it POSTs
// `{ refreshToken }` (camelCase) and reads `{ token }` back.
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshRequest = z.infer<typeof refreshSchema>;
