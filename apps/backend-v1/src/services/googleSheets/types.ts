import { OAuth2Client } from 'google-auth-library';

export interface UserCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface TableSchema {
  name: string;
  columns: string[];
  primaryKey?: string;
  foreignKeys?: {
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }[];
}

export type DatabaseRecord = Record<string, unknown>;
export type RecordFilters = Record<string, unknown>;

export type AuthClient = OAuth2Client;
