import type { TableSchema } from 'longcelot-sheet-db';
import categoriesSchema from '../../services/sheetDb/schemas/user/categories';
import transactionsSchema from '../../services/sheetDb/schemas/user/transactions';
import budgetsSchema from '../../services/sheetDb/schemas/user/budgets';
import budgetItemsSchema from '../../services/sheetDb/schemas/user/budgetItems';
import budgetIncomesSchema from '../../services/sheetDb/schemas/user/budgetIncomes';
import goalsSchema from '../../services/sheetDb/schemas/user/goals';
import telegramConnectionsSchema from '../../services/sheetDb/schemas/user/telegramConnections';
import telegramMessagesSchema from '../../services/sheetDb/schemas/user/telegramMessages';
import settingsSchema from '../../services/sheetDb/schemas/user/settings';

/**
 * Every table schema that lives on a *user*-actor sheet, i.e. everything
 * `POST /sheets/sync` needs to walk to bring a user's spreadsheet's tabs
 * and headers up to date. Mirrors the user-schema half of the registration
 * list in `services/sheetDb/adapter.ts` — kept as a local, read-only copy
 * here rather than importing something out of adapter.ts, since adapter.ts
 * is out of scope for this build pass and doesn't currently export its
 * registered schema list.
 */
export const USER_SCHEMAS: TableSchema[] = [
  categoriesSchema,
  transactionsSchema,
  budgetsSchema,
  budgetItemsSchema,
  budgetIncomesSchema,
  goalsSchema,
  telegramConnectionsSchema,
  telegramMessagesSchema,
  settingsSchema,
];
