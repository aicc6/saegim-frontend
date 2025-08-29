import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary dark:text-text-dark"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            // 기존 auth 폼에서 사용하던 스타일을 공통화
            'w-full px-4 py-3 border rounded-lg transition-all duration-200 text-base font-light tracking-wide',
            'bg-gray-50 dark:bg-background-dark-tertiary',
            'border-gray-300 dark:border-border-dark-subtle',
            'text-gray-900 dark:text-text-dark-primary',
            'placeholder-gray-500 dark:placeholder-text-dark-placeholder',
            'focus:outline-none focus:ring-2 focus:border-sage-50 dark:focus:border-border-dark-focus',
            'focus:ring-sage-50 dark:focus:ring-border-dark-focus',
            // 에러 상태 스타일
            error &&
              'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-text-dark-secondary">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';

export { FormInput };
