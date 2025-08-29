import type { Metadata } from 'next';
import { Providers } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { DEFAULT_METADATA } from '@/constants/metadata';
import './globals.css';

export const metadata: Metadata = DEFAULT_METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
