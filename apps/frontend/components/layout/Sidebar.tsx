'use client';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Wallet,
  Target,
  Tags,
  Settings,
  LogOut,
  Calendar,
  PieChart,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    current: false,
  },
  {
    name: 'Budget',
    href: '/budget',
    icon: Wallet,
    current: false,
  },
  {
    name: 'Tracker',
    href: '/tracker',
    icon: Calendar,
    current: false,
  },
  {
    name: 'Goals',
    href: '/goals',
    icon: Target,
    current: false,
  },
  {
    name: 'Categories',
    href: '/categories',
    icon: Tags,
    current: false,
  },
  {
    name: 'Summary',
    href: '/summary',
    icon: PieChart,
    current: false,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    current: false,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      // Force redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force local logout if there's an error
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div
      className={cn('flex h-full w-64 flex-col bg-white border-r', className)}
    >
      {/* Header / Brand */}
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-white">
            <Image
              src="/images/MMS-Logo.png"
              alt="MMS Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </div>
          <span className="text-lg font-semibold text-slate-900">MMS</span>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-11',
                  isActive
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t bg-slate-50 p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.picture} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-slate-200 text-slate-700">
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.name || 'Demo User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || 'demo@example.com'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full mt-3 justify-start gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
