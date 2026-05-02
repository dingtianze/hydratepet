interface PixelIntervalPickerProps {
  value: number;
  onChange: (interval: number) => void;
  options: number[];
  unit?: string;
  label?: string;
  disabled?: boolean;
}

export function PixelIntervalPicker({
  value,
  onChange,
  options,
  unit = '分钟',
  label,
  disabled = false,
}: PixelIntervalPickerProps) {
  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'opacity-50' : ''}`}>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      )}
      
      <div className="flex flex-wrap gap-2">
        {options.map((interval) => (
          <button
            key={interval}
            type="button"
            onClick={() => !disabled && onChange(interval)}
            disabled={disabled}
            className={`
              px-4 py-3 text-sm font-medium rounded-none transition-all duration-150
              disabled:cursor-not-allowed
              ${
                value === interval
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
            style={{
              boxShadow:
                value === interval
                  ? 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.3)'
                  : '2px 2px 0 rgba(0,0,0,0.1), inset -1px -1px 0 rgba(0,0,0,0.1), inset 1px 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            {interval}{unit}
          </button>
        ))}
      </div>
      
      {/* Visual representation */}
      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 pixel-border">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="pixel-icon">🕐</span>
          <span>
            每 {value} {unit}提醒一次
            <span className="ml-1 text-gray-400">
              (一天约 {Math.floor((14 * 60) / value)} 次提醒)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
