'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTelegram } from '@/lib/telegram-service';

type TelegramConnectionData = {
  chatId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  isConnected: boolean;
  connectedAt?: Date;
};

export function TelegramConnectionCard() {
  const [connectionData, setConnectionData] =
    useState<TelegramConnectionData | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { connectToTelegram, disconnect } = useTelegram();

  // Function to fetch connection status from backend
  const fetchConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token'); // Fixed: was 'token', should be 'auth_token'
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      console.log(
        '🔍 Fetching connection status with token:',
        token ? 'Present' : 'Missing'
      );
      console.log(
        '🔍 Token value:',
        token ? `${token.substring(0, 20)}...` : 'NULL'
      );
      console.log('🔍 API URL:', `${apiUrl}/api/v1/telegram/status`);

      // First test the no-auth debug endpoint
      try {
        const debugResponse = await fetch(
          `${apiUrl}/api/v1/telegram/debug-no-auth`
        );
        const debugData = await debugResponse.json();
        console.log('🧪 Debug endpoint (no auth):', debugData);
      } catch (debugError) {
        console.error('🧪 Debug endpoint failed:', debugError);
      }

      const response = await fetch(`${apiUrl}/api/v1/telegram/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('📊 API Response data:', result);

        if (result.success && result.data.is_connected) {
          setConnectionData({
            chatId: result.data.chat_id || '',
            username: result.data.telegram_username,
            firstName: result.data.telegram_username || 'Unknown',
            isConnected: true,
            connectedAt: result.data.connected_at
              ? new Date(result.data.connected_at)
              : undefined,
          });
        } else {
          console.log('❌ No connection found or not connected');
          setConnectionData(null);
        }
      } else {
        console.error(
          '❌ API Response failed:',
          response.status,
          response.statusText
        );

        // Try to read the error response
        try {
          const errorData = await response.text();
          console.error('❌ Error response body:', errorData);
        } catch (e) {
          console.error('❌ Could not read error response');
        }
      }
    } catch (error) {
      console.error('Error fetching connection status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch connection status from backend on mount
    fetchConnectionStatus();

    // Check for connection success callback from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('telegram_connected') === 'true') {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Refresh connection status after a short delay
      setTimeout(() => {
        fetchConnectionStatus();
      }, 1000);
    }
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    try {
      // Get user email from stored user object
      let userEmail = 'demo@example.com';
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          userEmail = user.email || 'demo@example.com';
        }
      } catch (e) {
        console.warn('Could not parse stored user data');
      }

      console.log('🔗 Connecting with user email:', userEmail);

      // This opens Telegram in a new tab/window with connection parameter
      connectToTelegram(userEmail);

      // Set a timeout to reset the connecting state and check for connection
      setTimeout(() => {
        setIsConnecting(false);
        fetchConnectionStatus(); // Check if connection was successful
      }, 10000);
    } catch (error) {
      console.error('Error connecting to Telegram:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      confirm(
        'Are you sure you want to disconnect from Telegram? You will lose access to bot notifications.'
      )
    ) {
      try {
        const token = localStorage.getItem('auth_token');
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const response = await fetch(`${apiUrl}/api/v1/telegram/disconnect`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          disconnect(); // Clear from localStorage (if any)
          setConnectionData(null);
          console.log('✅ Telegram disconnected successfully');
        } else {
          console.error('❌ Failed to disconnect from backend');
        }
      } catch (error) {
        console.error('Error disconnecting from Telegram:', error);
      }
    }
  };

  const connected = connectionData?.isConnected || false;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Telegram Integration</h3>
              <p className="text-sm text-gray-600">
                Loading connection status...
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Telegram Integration</h3>
            <p className="text-sm text-gray-600">
              Connect your Telegram account to receive budget notifications and
              interact with your data via our bot.
            </p>
          </div>
          <Switch checked={connected} disabled />
        </div>

        <Separator />

        {connected && connectionData ? (
          <div className="space-y-3">
            <div className="text-sm">
              <span className="font-medium text-green-600">✅ Connected</span>
              <p className="text-gray-600 mt-1">
                Connected as <strong>{connectionData.firstName}</strong>
                {connectionData.username && ` (@${connectionData.username})`}
              </p>
              {connectionData.connectedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Connected on {connectionData.connectedAt.toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => connectToTelegram()}
              >
                Open Bot
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700"
              >
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm">
              <span className="font-medium text-gray-500">
                ❌ Not Connected
              </span>
              <p className="text-gray-600 mt-1">
                Connect your Telegram account to receive budget alerts, spending
                summaries, and manage your finances through our bot.
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <h4 className="font-medium text-blue-900 mb-1">
                What you'll get:
              </h4>
              <ul className="text-blue-800 space-y-1 text-xs">
                <li>• Daily/weekly budget summaries</li>
                <li>• Overspending alerts</li>
                <li>• Quick expense logging via chat</li>
                <li>• Goal progress notifications</li>
              </ul>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? 'Opening Telegram...' : 'Connect to Telegram'}
            </Button>

            {isConnecting && (
              <p className="text-xs text-gray-500 text-center">
                Please complete the connection in the Telegram app that just
                opened
              </p>
            )}
          </div>
        )}

        <Separator />

        <div className="text-xs text-gray-500">
          <p>
            <strong>Privacy Note:</strong> We only access your chat ID to send
            you notifications. Your personal messages remain private.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default TelegramConnectionCard;
