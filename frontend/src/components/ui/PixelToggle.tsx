import { forwardRef } from 'react';

interface PixelToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  activeColor?: string;
  inactiveColor?: string;
  label?: string;
  description?: string;
}

export const PixelToggle = forwardRef<HTMLButtonElement, PixelToggleProps>(
  (
    {
      checked,
      onChange,
      disabled = false,
      size = 'md',
      activeColor = 'bg-primary-500',
      inactiveColor = 'bg-gray-400',
      label,
      description,
    },
    ref
  ) => {
    const sizes = {
      sm: {
        container: 'w-12 h-6',
        knob: 'w-4 h-4',
        translate: 'translate-x-6',
        pixel: 'text-[6px]',
      },
      md: {
        container: 'w-16 h-8',
        knob: 'w-6 h-6',
        translate: 'translate-x-8',
        pixel: 'text-[8px]',
      },
      lg: {
        container: 'w-20 h-10',
        knob: 'w-7 h-7',
        translate: 'translate-x-11',
        pixel: 'text-[10px]',
      },
    };

    const currentSize = sizes[size];

    return (
      <div className="flex items-center justify-between">
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-gray-800 dark:text-gray-200 font-medium">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </span>
            )}
          </div>
        )}
        
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => !disabled && onChange(!checked)}
          disabled={disabled}
          className={`
            relative inline-flex items-center rounded-none
            transition-all duration-150 ease-out
            ${currentSize.container}
            ${checked ? activeColor : inactiveColor}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            pixel-border
          `}
          style={{
            boxShadow: checked 
              ? 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.2)'
              : 'inset 2px 2px 0 rgba(0,0,0,0.2), inset -2px -2px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Pixel pattern background */}
          <span 
            className={`absolute inset-0 ${currentSize.pixel} opacity-20 pointer-events-none
              ${checked ? 'text-white' : 'text-black'}`}
            style={{
              backgroundImage: `
                linear-gradient(45deg, currentColor 25%, transparent 25%),
                linear-gradient(-45deg, currentColor 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, currentColor 75%),
                linear-gradient(-45deg, transparent 75%, currentColor 75%)
              `,
              backgroundSize: '4px 4px',
              backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
            }}
          />
          
          {/* Toggle knob with pixel style */}
          <span
            className={`
              ${currentSize.knob}
              bg-white rounded-none
              transition-transform duration-150 ease-out
              ${checked ? currentSize.translate : 'translate-x-0.5'}
              ${disabled ? '' : 'hover:scale-105'}
            `}
            style={{
              boxShadow: '2px 2px 0 rgba(0,0,0,0.3), inset -1px -1px 0 rgba(0,0,0,0.1), inset 1px 1px 0 rgba(255,255,255,0.8)',
              imageRendering: 'pixelated',
            }}
          >
            {/* Pixel decoration on knob */}
            <span className="absolute inset-1 border border-gray-200 opacity-50" />
          </span>
        </button>
      </div>
    );
  }
);

PixelToggle.displayName = 'PixelToggle';
