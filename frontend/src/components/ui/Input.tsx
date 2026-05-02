import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
            bg-white dark:bg-gray-800
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-0
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${
              error
                ? 'border-red-400 focus:border-red-500 text-red-900 dark:text-red-100'
                : 'border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-primary-500 dark:focus:border-primary-400'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
