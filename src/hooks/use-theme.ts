import { useTheme as useNextTheme } from 'next-themes';

export const useTheme = () => {
  const { resolvedTheme } = useNextTheme();
  const isDark = resolvedTheme === 'dark';
  
  return { isDark };
};
