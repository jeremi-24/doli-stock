import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppProvider } from '@/context/app-provider';
import { NotificationProvider } from '@/context/notification-provider';
import { AppShell } from '@/components/app-shell';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'STA',
  description: 'Gérez vos stocks, créez des factures, et plus encore.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased')}>
        <AppProvider>
          <NotificationProvider>
            <AppShell>
              {children}
            </AppShell>
          </NotificationProvider>
        </AppProvider>
        <Toaster />
        {process.env.NODE_ENV === 'production' && (
           <Script id="microsoft-clarity">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "t1dt71k917");
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
