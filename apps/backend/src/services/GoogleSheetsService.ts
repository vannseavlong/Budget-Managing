// Thin wrapper that delegates to the refactored googleSheets modules.
import * as gs from './googleSheets';

export { gs };
// Re-export commonly used types for backward compatibility with callers that import
// them from `services/GoogleSheetsService` (controllers and utilities expect these).
export type {
  UserCredentials,
  TableSchema,
  DatabaseRecord,
  RecordFilters,
} from './googleSheets';

export class GoogleSheetsService {
  // Keep constructor for compatibility with existing controllers
  constructor() {}

  getAuthUrl(): string {
    return gs.getAuthUrl();
  }

  async getTokens(code: string) {
    return gs.getTokens(code);
  }

  setCredentials(credentials: gs.UserCredentials) {
    return gs.setCredentials(credentials);
  }

  async getOrCreateUserDatabase(userEmail: string, userName?: string) {
    return gs.getOrCreateUserDatabase(userEmail, userName);
  }

  async createNewUserDatabase(userEmail: string, userName?: string) {
    return gs.createNewUserDatabase(userEmail, userName);
  }

  async ensureTableExists(
    spreadsheetId: string,
    table: { name: string; columns: string[] }
  ) {
    return gs.ensureTableExists(spreadsheetId, table);
  }

  async createSheet(spreadsheetId: string, schema: gs.TableSchema) {
    return gs.createSheet(spreadsheetId, schema);
  }

  async insert(
    spreadsheetId: string,
    tableName: string,
    data: gs.DatabaseRecord
  ) {
    return gs.insert(spreadsheetId, tableName, data);
  }

  async find(
    spreadsheetId: string,
    tableName: string,
    filters?: gs.RecordFilters
  ) {
    return gs.find(spreadsheetId, tableName, filters);
  }

  async findById(spreadsheetId: string, tableName: string, id: string) {
    return gs.findById(spreadsheetId, tableName, id);
  }

  async update(
    spreadsheetId: string,
    tableName: string,
    id: string,
    data: gs.DatabaseRecord
  ) {
    return gs.update(spreadsheetId, tableName, id, data);
  }

  async delete(spreadsheetId: string, tableName: string, id: string) {
    return gs.remove(spreadsheetId, tableName, id);
  }

  async getHeaders(spreadsheetId: string, tableName: string) {
    return gs.getHeaders(spreadsheetId, tableName);
  }

  async ensureCategoriesSchema(spreadsheetId: string) {
    return gs.ensureCategoriesSchema(spreadsheetId);
  }

  async validateUserDatabase(spreadsheetId: string) {
    return gs.validateUserDatabase(spreadsheetId);
  }

  async getUserInfo() {
    return gs.getUserInfo();
  }

  async updateUserTelegramInfo(
    userEmail: string,
    telegramUsername: string,
    chatId: string
  ) {
    return gs.updateUserTelegramInfo(userEmail, telegramUsername, chatId);
  }

  async recreateDatabase(
    spreadsheetId: string,
    userEmail: string,
    userName?: string
  ) {
    return gs.recreateDatabase(spreadsheetId, userEmail, userName);
  }

  async createDatabaseSchema(spreadsheetId: string) {
    return gs.createDatabaseSchema(spreadsheetId);
  }

  async validateDatabaseSchema(spreadsheetId: string) {
    return gs.validateDatabaseSchema(spreadsheetId);
  }
}
