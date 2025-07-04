import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppProvider } from '@/context/app-provider';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'StockHero',
  description: 'Gérez vos stocks, créez des factures, et plus encore.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <AppProvider>
          <AppShell>
            {children}
          </AppShell>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
