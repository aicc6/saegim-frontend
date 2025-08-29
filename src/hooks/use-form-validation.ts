import { useCallback } from 'react';
import { WritingStyle, LengthOption } from '@/stores/create';

interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const useFormValidation = () => {
  const validateForm = useCallback(
    (
      prompt: string,
      style: WritingStyle,
      length: LengthOption,
    ): ValidationResult => {
      if (!prompt.trim()) {
        return { isValid: false, errorMessage: '텍스트를 입력해주세요' };
      }

      if (!style) {
        return { isValid: false, errorMessage: '문체를 선택해주세요' };
      }

      if (!length) {
        return { isValid: false, errorMessage: '길이를 선택해주세요' };
      }

      return { isValid: true };
    },
    [],
  );

  const showValidationAlert = useCallback((errorMessage: string) => {
    alert(errorMessage);
  }, []);

  return {
    validateForm,
    showValidationAlert,
  };
};
