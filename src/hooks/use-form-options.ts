import { useMemo } from 'react';
import { WritingStyle, LengthOption } from '@/stores/create';

interface FormOptions {
  value: string;
  label: string;
}

interface UseFormOptionsProps {
  styles: Array<{ value: WritingStyle; label: string }>;
  lengths: Array<{ value: LengthOption; label: string }>;
}

export const useFormOptions = ({ styles, lengths }: UseFormOptionsProps) => {
  const { styleOptions, lengthOptions } = useMemo(
    () => ({
      styleOptions: styles.map(({ value, label }) => ({
        value,
        label,
      })) as FormOptions[],
      lengthOptions: lengths.map(({ value, label }) => ({
        value,
        label,
      })) as FormOptions[],
    }),
    [styles, lengths],
  );

  return {
    styleOptions,
    lengthOptions,
  };
};
