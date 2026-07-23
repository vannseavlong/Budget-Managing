import { withId, mapTimestamps } from '../../utils/response';
import {
  BudgetResponse,
  BudgetItemResponse,
  BudgetIncomeResponse,
} from './types';

type LsdbRecord = Record<string, unknown> & {
  _id: string;
  _created_at?: string;
  _updated_at?: string;
  _deleted_at?: string | null;
};

/**
 * None of budgets/budget_items/budget_incomes store a `user_id` column
 * (actorSheetId already scopes the whole sheet to one user — see
 * apps/backend/src/services/sheetDb/schemas/user/*). `user_id` in the
 * response is synthesized from the authenticated request instead of read
 * off the record.
 */
export function toBudgetResponse(
  record: LsdbRecord,
  email: string
): BudgetResponse {
  return {
    ...(withId(record) as unknown as Omit<
      BudgetResponse,
      'user_id' | 'created_at' | 'updated_at'
    >),
    user_id: email,
    ...mapTimestamps(record, 'snake'),
  };
}

export function toBudgetItemResponse(
  record: LsdbRecord,
  email: string
): BudgetItemResponse {
  const mapped = withId(record) as unknown as Omit<
    BudgetItemResponse,
    'user_id' | 'created_at' | 'updated_at'
  >;
  return {
    ...mapped,
    spent: mapped.spent ?? 0,
    user_id: email,
    ...mapTimestamps(record, 'snake'),
  };
}

export function toBudgetIncomeResponse(
  record: LsdbRecord,
  email: string
): BudgetIncomeResponse {
  const mapped = withId(record) as unknown as Omit<
    BudgetIncomeResponse,
    'user_id' | 'created_at' | 'updated_at'
  >;
  return {
    ...mapped,
    source: mapped.source || '',
    user_id: email,
    ...mapTimestamps(record, 'snake'),
  };
}
