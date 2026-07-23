/** A raw lsdb record: `_id` + optional `_created_at`/`_updated_at`/`_deleted_at`. */
type LsdbRecord = Record<string, unknown> & {
  _id: string;
  _created_at?: string;
  _updated_at?: string;
  _deleted_at?: string | null;
};

/** Strips lsdb's internal `_id`/`_created_at`/`_updated_at`/`_deleted_at` and exposes `id`. */
export function withId<T extends LsdbRecord>(
  record: T
): { id: string } & Omit<
  T,
  '_id' | '_created_at' | '_updated_at' | '_deleted_at'
> {
  const { _id, _created_at, _updated_at, _deleted_at, ...rest } = record;
  return { id: _id, ...rest } as { id: string } & Omit<
    T,
    '_id' | '_created_at' | '_updated_at' | '_deleted_at'
  >;
}

/**
 * Response field casing is inconsistent per-domain in the existing frontend
 * (categories are camelCase, budgets/transactions/goals are snake_case) —
 * that's an existing contract to match exactly, not something to normalize.
 */
// Overloaded so the return type is narrowed by the literal `style` argument
// at each call site — a single union-returning signature would force every
// caller to deal with both shapes even though they only ever pass one.
// eslint's base `no-redeclare` doesn't understand TS overload syntax, hence
// the disables below (there's no type-aware version enabled in this repo's
// shared root .eslintrc.json to swap in instead).
// eslint-disable-next-line no-redeclare
export function mapTimestamps(
  record: Pick<LsdbRecord, '_created_at' | '_updated_at'>,
  style: 'camel'
): { createdAt: string | undefined; updatedAt: string | undefined };
// eslint-disable-next-line no-redeclare
export function mapTimestamps(
  record: Pick<LsdbRecord, '_created_at' | '_updated_at'>,
  style: 'snake'
): { created_at: string | undefined; updated_at: string | undefined };
// eslint-disable-next-line no-redeclare
export function mapTimestamps(
  record: Pick<LsdbRecord, '_created_at' | '_updated_at'>,
  style: 'camel' | 'snake'
) {
  return style === 'camel'
    ? { createdAt: record._created_at, updatedAt: record._updated_at }
    : { created_at: record._created_at, updated_at: record._updated_at };
}
