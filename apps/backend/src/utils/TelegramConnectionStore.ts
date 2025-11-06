/**
 * Temporary connection storage for Telegram links
 * In production, this should be replaced with database or Google Sheets storage
 */

interface TelegramConnection {
  email: string;
  telegram_username: string;
  chat_id: string;
  connected_at: string;
  status: 'connected' | 'pending' | 'disconnected';
}

// In-memory storage (for development/testing only)
const connections = new Map<string, TelegramConnection>();

export class TelegramConnectionStore {
  /**
   * Store a new Telegram connection
   */
  static storeConnection(
    email: string,
    username: string,
    chatId: string
  ): void {
    const connection: TelegramConnection = {
      email,
      telegram_username: username,
      chat_id: chatId,
      connected_at: new Date().toISOString(),
      status: 'connected',
    };

    // Store by email and by chat_id for easy lookup
    connections.set(email, connection);
    connections.set(`chat_${chatId}`, connection);
  }

  /**
   * Get connection by email
   */
  static getConnectionByEmail(email: string): TelegramConnection | null {
    return connections.get(email) || null;
  }

  /**
   * Get connection by chat ID
   */
  static getConnectionByChatId(chatId: string): TelegramConnection | null {
    return connections.get(`chat_${chatId}`) || null;
  }

  /**
   * Check if user is connected via Telegram
   */
  static isUserConnected(emailOrChatId: string): boolean {
    const connection =
      connections.get(emailOrChatId) ||
      connections.get(`chat_${emailOrChatId}`);
    return connection?.status === 'connected';
  }

  /**
   * Remove connection
   */
  static removeConnection(email: string, chatId: string): void {
    connections.delete(email);
    connections.delete(`chat_${chatId}`);
  }

  /**
   * Get all connections (for debugging)
   */
  static getAllConnections(): TelegramConnection[] {
    const uniqueConnections = new Map<string, TelegramConnection>();

    for (const [key, connection] of connections.entries()) {
      if (!key.startsWith('chat_')) {
        uniqueConnections.set(connection.email, connection);
      }
    }

    return Array.from(uniqueConnections.values());
  }
}
