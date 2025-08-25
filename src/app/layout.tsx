import type { Metadata } from 'next';
import { Providers } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: '새김 - 감성 AI 다이어리',
  description: 'AI와 함께 쓰는 감성 다이어리',
  keywords: ['다이어리', 'AI', '감정', '기록', '일기'],
  openGraph: {
    title: '새김 - 감성 AI 다이어리',
    description: 'AI와 함께 쓰는 감성 다이어리',
    type: 'website',
  },
};

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
