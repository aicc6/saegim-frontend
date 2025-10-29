'use client';

import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLanguageStore, type Language } from '@/stores/language';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES } from '@/types/language';

type LanguageToggleVariant = 'dropdown' | 'segment';

interface LanguageToggleProps {
  variant?: LanguageToggleVariant;
  className?: string;
}

export default function LanguageToggle({
  variant = 'dropdown',
  className,
}: LanguageToggleProps) {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  const getLanguageLabel = (value: Language) =>
    t(`common.languageOptions.${value}.native`);

  const handleLanguageChange = (value: Language) => {
    if (language !== value) {
      void setLanguage(value);
    }
  };

  const shortLabels: Record<Language, string> = {
    ko: 'KO',
    en: 'EN',
    ja: 'JA',
  };

  if (variant === 'segment') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-input bg-background/60 p-1 shadow-xs backdrop-blur-sm',
          className,
        )}
        role="group"
        aria-label={t('common.languageToggleLabel', 'Language selection')}
      >
        {SUPPORTED_LANGUAGES.map((value) => {
          const isActive = language === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleLanguageChange(value)}
              className={cn(
                'min-w-[2.75rem] rounded-full px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={isActive}
              aria-label={t(`common.languageOptions.${value}.full`)}
            >
              {shortLabels[value]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-2', className)}>
          <Languages className="h-5 w-5" />
          <span className="text-sm">{getLanguageLabel(language)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map((value) => (
          <DropdownMenuItem
            key={value}
            onClick={() => void setLanguage(value)}
            className={language === value ? 'bg-accent' : ''}
          >
            {t(`common.languageOptions.${value}.full`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
