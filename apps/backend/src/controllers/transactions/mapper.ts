import { withId, mapTimestamps } from '../../utils/response';
import { TransactionResponse } from './types';

export type TransactionRecord = Record<string, unknown> & {
  _id: string;
  _created_at?: string;
  _updated_at?: string;
};

/**
 * Maps a raw lsdb `transactions` row to the response contract to preserve
 * (backend-v1's original snake_case shape — no live frontend caller today,
 * see task's response-shape contract). `user_id` is synthesized from the
 * authenticated request rather than read from the row: the `transactions`
 * schema has no stored `user_id` column, actorSheetId already scopes the
 * whole sheet to one user.
 */
export function toTransactionResponse(
  record: TransactionRecord,
  email: string
): TransactionResponse {
  const {
    id,
    name,
    amount,
    category_id,
    category_name,
    date,
    time,
    notes,
    receipt_url,
  } = withId(record) as {
    id: string;
    name: string;
    amount: number;
    category_id: string;
    category_name?: string;
    date: string;
    time?: string;
    notes?: string;
    receipt_url?: string;
  };

  return {
    id,
    name,
    amount,
    category_id,
    category_name,
    date,
    time,
    notes,
    receipt_url,
    user_id: email,
    ...mapTimestamps(record, 'snake'),
  };
}
