import { withId, mapTimestamps } from '../../utils/response';
import { CategoryResponse } from './types';

export type CategoryRecord = Record<string, unknown> & {
  _id: string;
  _created_at?: string;
  _updated_at?: string;
};

/**
 * Maps a raw lsdb `categories` row to the frontend contract
 * (`apps/frontend/types/categories.ts`): camelCase, `userId` synthesized
 * from the authenticated request rather than read from the row — the
 * `categories` schema deliberately has no `user_id`/`userId` column since
 * `actorSheetId` already scopes the whole sheet to one user.
 */
export function toCategoryResponse(
  record: CategoryRecord,
  email: string
): CategoryResponse {
  const { id, name, emoji, color } = withId(record) as {
    id: string;
    name: string;
    emoji?: string;
    color?: string;
  };

  return {
    id,
    name,
    emoji,
    color,
    userId: email,
    ...mapTimestamps(record, 'camel'),
  };
}
