import type { Metadata } from 'next';
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
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@200;300;400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme-storage');
                if (theme) {
                  const parsed = JSON.parse(theme);
                  const themeValue = parsed.state?.theme || 'system';

                  if (themeValue === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (themeValue === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    // system
                    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } else {
                  // 기본값: system
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                }
              } catch (e) {
                // 오류 시 시스템 설정 따름
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                }
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
