import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MMS - Money Management System',
  description:
    'Comprehensive budget management and financial tracking system with Telegram integration',
  icons: {
    icon: [
      { url: '/images/MMS-Logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/MMS-Logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/images/MMS-Logo.png',
    apple: '/images/MMS-Logo.png',
  },
  openGraph: {
    title: 'MMS - Money Management System',
    description:
      'Comprehensive budget management and financial tracking system',
    images: ['/images/MMS-Logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      </body>
    </html>
  );
}
