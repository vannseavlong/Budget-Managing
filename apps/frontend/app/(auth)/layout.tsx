'use client';

import { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Force light mode for auth pages by removing dark class
    document.documentElement.classList.remove('dark');

    // Cleanup function to restore theme when leaving auth pages
    return () => {
      // Re-apply the saved theme when leaving auth pages
      const savedTheme = localStorage.getItem('theme');
      if (
        savedTheme === 'dark' ||
        (savedTheme === 'system' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  return <>{children}</>;
}
