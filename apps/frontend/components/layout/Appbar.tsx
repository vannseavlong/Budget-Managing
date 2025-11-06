'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, Calendar, Wallet, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppbarProps {
  className?: string;
}

const navigationItems = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Track',
    href: '/tracker',
    icon: Calendar,
  },
  {
    name: 'Budget',
    href: '/budget',
    icon: Wallet,
  },
  {
    name: 'Summary',
    href: '/summary',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Appbar({ className }: AppbarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden',
        className
      )}
    >
      <nav className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="flex-1">
              <Button
                variant="ghost"
                className={cn(
                  'w-full h-12 flex flex-col items-center justify-center gap-1 px-2 py-1',
                  isActive
                    ? 'text-black bg-gray-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-black' : 'text-gray-600'
                  )}
                />
                <span
                  className={cn(
                    'text-xs',
                    isActive
                      ? 'text-black font-bold'
                      : 'text-gray-600 font-medium'
                  )}
                >
                  {item.name}
                </span>
              </Button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
