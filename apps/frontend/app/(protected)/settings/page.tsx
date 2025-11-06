'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import {
  Link,
  Eye,
  DollarSign,
  Globe,
  Bell,
  Database,
  Download,
  Trash2,
  Info,
} from 'lucide-react';

interface UserProfile {
  email: string;
  name: string;
  telegram_username?: string;
  chatId?: string;
  spreadsheetId: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [telegramNotifications, setTelegramNotifications] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleRefreshProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/v1/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  // Check for Telegram connection success in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('telegram_connected') === 'true') {
      // Clean up URL first
      window.history.replaceState({}, document.title, window.location.pathname);

      // Use setTimeout to avoid direct setState in effect
      setTimeout(() => {
        setShowSuccessMessage(true);
        handleRefreshProfile();

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }, 100);
    }
  }, []);

  // Fetch user profile to get telegram connection status
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/api/v1/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setUserProfile(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleTelegramConnect = () => {
    // Redirect to Telegram bot with deep linking
    const botUsername =
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'YourBudgetBot';
    const startParam = `connect_${userProfile?.email?.replace('@', '_at_').replace('.', '_dot_')}`;
    const telegramUrl = `https://t.me/${botUsername}?start=${startParam}`;

    // Open Telegram in new tab
    window.open(telegramUrl, '_blank');

    // Optional: Show instructions dialog
    alert(
      'Please click &quot;Start&quot; in Telegram bot and follow the instructions to connect your account.'
    );
  };

  const handleExportBackup = () => {
    console.log('Exporting backup...');
  };

  const handleClearAllData = () => {
    if (
      confirm(
        'Are you sure you want to clear all data? This action cannot be undone.'
      )
    ) {
      console.log('Clearing all data...');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">
            Hello, {user?.name || 'Demo User'} 👋
          </h1>
          <p className="text-sm text-gray-600 mt-1">Manage your preferences</p>
        </div>
      </div>

      {/* Success Message for Telegram Connection */}
      {showSuccessMessage && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-medium text-green-800">
                  Telegram Connected Successfully!
                </h3>
                <p className="text-sm text-green-600">
                  Your Telegram account has been linked. Refreshing your
                  profile...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Linked Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src="/icons/Google.png"
                  alt="Google"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-medium">Google</h3>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.email || user?.email || 'Loading...'}
                </p>
              </div>
            </div>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          </div>

          {/* Telegram Account */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <Image
                  src="/icons/Telegram.png"
                  alt="Telegram"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-medium">Telegram</h3>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.telegram_username
                    ? userProfile.telegram_username
                    : 'Not connected'}
                </p>
              </div>
            </div>
            {userProfile?.telegram_username ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshProfile}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleTelegramConnect}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Connect
              </Button>
            )}
          </div>

          {/* Connection Instructions */}
          {!userProfile?.telegram_username && (
            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Connect Telegram:</strong> Click &quot;Connect&quot;
                    to open our Telegram bot, then click &quot;Start&quot; and
                    follow the instructions to link your account.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Dark Mode</h3>
              <p className="text-sm text-muted-foreground">Toggle dark theme</p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) =>
                setTheme(checked ? 'dark' : 'light')
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Currency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Currency</h3>
              </div>
            </div>
            <span className="text-sm font-medium">USD ($)</span>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Language</h3>
              </div>
            </div>
            <span className="text-sm font-medium">English</span>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Telegram Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Get budget alerts via Telegram
              </p>
            </div>
            <Switch
              checked={telegramNotifications}
              onCheckedChange={setTelegramNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-muted-foreground">
                Download all your data as JSON/CSV backup
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBackup}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Backup
            </Button>
          </div>

          {/* Clear All Data */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-600">Clear All Data</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete all transactions, budgets, and goals
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllData}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">
                Monthly Money Management
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                Version 1.0.0
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                A simple and efficient way to track your spending
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
