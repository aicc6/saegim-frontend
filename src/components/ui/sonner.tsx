'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--background-primary)',
          '--normal-text': 'var(--text-primary)',
          '--normal-border': 'var(--border-subtle)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
