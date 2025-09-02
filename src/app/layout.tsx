import type { Metadata } from 'next';
import { Providers } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { DEFAULT_METADATA } from '@/constants/metadata';
import { createWebsiteSchema, createJsonLdScript } from '@/lib/structured-data';
import '@/lib/env-validation';
import './globals.css';

export const metadata: Metadata = DEFAULT_METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteSchema = createWebsiteSchema();

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined') {
                  const theme = localStorage.getItem('saegim-theme') || 'light';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={createJsonLdScript(websiteSchema)}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster />
        <SonnerToaster
          position="top-right"
          expand={true}
          richColors={true}
          closeButton={true}
          className="toast-custom"
        />
      </body>
    </html>
  );
}
