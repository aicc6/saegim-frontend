import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { WritingStyle, LengthOption } from '@/stores/create';

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const useFormValidation = () => {
  const { t } = useTranslation();

  const validateForm = useCallback(
    (
      prompt: string,
      style: WritingStyle,
      length: LengthOption,
    ): ValidationResult => {
      if (!prompt.trim()) {
        return {
          isValid: false,
          errorMessage: t('create.validation.promptRequired'),
        };
      }

      if (!style) {
        return {
          isValid: false,
          errorMessage: t('create.validation.styleRequired'),
        };
      }

      if (!length) {
        return {
          isValid: false,
          errorMessage: t('create.validation.lengthRequired'),
        };
      }

      return { isValid: true };
    },
    [t],
  );

  const showValidationAlert = useCallback(async (errorMessage: string) => {
    const { showWarning } = await import('@/hooks/use-modal');
    showWarning(errorMessage);
  }, []);

  return {
    validateForm,
    showValidationAlert,
  };
};
