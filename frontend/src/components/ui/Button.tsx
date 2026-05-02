import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'water';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg';

    const variants = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 border-2 border-primary-600 hover:border-primary-700',
      secondary:
        'bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 border-2 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
      outline:
        'bg-transparent text-primary-600 border-2 border-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20',
      ghost:
        'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
      water:
        'bg-water-500 text-white hover:bg-water-600 active:bg-water-700 border-2 border-water-500 hover:border-water-600',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg',
    };

    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isLoading || disabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${className}
        `}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {isLoading && loadingText ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
