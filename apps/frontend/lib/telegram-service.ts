/**
 * Telegram Integration Utilities
 * Handles Telegram bot connection flow and user data capture
 */

// Telegram user data from bot authentication
export type TelegramUserData = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

// Local storage connection data
export type TelegramConnectionData = {
  chatId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  isConnected: boolean;
  connectedAt?: Date;
};

/**
 * Telegram Service Class
 */
class TelegramService {
  private readonly botUsername: string;
  private readonly botUrl: string;
  private readonly startParam: string;
  private readonly frontendUrl: string;

  constructor() {
    this.botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || '';
    this.botUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || '';
    this.startParam =
      process.env.NEXT_PUBLIC_TELEGRAM_START_PARAM || 'connect_budget_app';
    this.frontendUrl =
      process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Generate Telegram bot connection URL
   */
  generateConnectionUrl(userEmail?: string): string {
    // Use user email if provided, otherwise fallback to default
    let startParam = this.startParam;
    if (userEmail) {
      // Encode email for Telegram start parameter
      const encodedEmail = userEmail
        .replace('@', '_at_')
        .replace(/\./g, '_dot_');
      startParam = `connect_${encodedEmail}`;
    }

    const params = new URLSearchParams({
      start: startParam,
    });

    return `${this.botUrl}?${params.toString()}`;
  }

  /**
   * Open Telegram bot in new window
   */
  openTelegramBot(userEmail?: string): void {
    const url = this.generateConnectionUrl(userEmail);
    console.log('🔗 Opening Telegram with URL:', url);
    console.log('🔗 User email:', userEmail);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Check if user is connected to Telegram
   */
  isConnected(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const connection = localStorage.getItem('telegram_connection');
      if (!connection) return false;

      const data = JSON.parse(connection);
      return data?.isConnected || false;
    } catch {
      return false;
    }
  }

  /**
   * Get stored Telegram connection
   */
  getTelegramConnection(): TelegramConnectionData | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem('telegram_connection');
      if (!stored) return null;

      const data = JSON.parse(stored);
      return {
        ...data,
        connectedAt: data.connectedAt ? new Date(data.connectedAt) : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Store Telegram connection data
   */
  storeTelegramConnection(data: TelegramConnectionData): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        'telegram_connection',
        JSON.stringify({
          ...data,
          connectedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Error storing Telegram connection:', error);
    }
  }

  /**
   * Clear Telegram connection
   */
  clearTelegramConnection(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('telegram_connection');
    } catch (error) {
      console.error('Error clearing Telegram connection:', error);
    }
  }
}

// Export singleton instance
export const telegramService = new TelegramService();

// Export React hook
export const useTelegram = () => {
  return {
    connectToTelegram: telegramService.openTelegramBot.bind(telegramService),
    isConnected: telegramService.isConnected.bind(telegramService),
    getConnection: telegramService.getTelegramConnection.bind(telegramService),
    disconnect: telegramService.clearTelegramConnection.bind(telegramService),
  };
};
