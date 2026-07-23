/**
 * Transactions Types - matches the backend's snake_case response contract
 * (see apps/backend/src/controllers/transactions/types.ts) directly, same
 * convention as create/update request payloads.
 */

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category_id: string;
  category_name?: string;
  date: string;
  time?: string;
  notes?: string;
  receipt_url?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTransactionRequest {
  name: string;
  amount: number;
  category_id: string;
  category_name: string;
  date: string;
  time?: string;
  notes?: string;
  receipt_url?: string;
}

export type UpdateTransactionRequest = Partial<CreateTransactionRequest>;

export interface TransactionFilters {
  page?: number;
  per_page?: number;
  category_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type TransactionsListResponse = ApiResponse<Transaction[]> & {
  pagination?: Pagination;
};
export type TransactionResponse = ApiResponse<Transaction>;
