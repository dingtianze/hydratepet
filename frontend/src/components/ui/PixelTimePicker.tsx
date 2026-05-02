import { useCallback } from 'react';

interface PixelTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  disabled?: boolean;
}

export function PixelTimePicker({ 
  value, 
  onChange, 
  label,
  disabled = false 
}: PixelTimePickerProps) {
  const [hours, minutes] = value.split(':').map(Number);
  
  const handleHourChange = useCallback((newHour: number) => {
    if (newHour >= 0 && newHour <= 23) {
      onChange(`${String(newHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  }, [minutes, onChange]);
  
  const handleMinuteChange = useCallback((newMinute: number) => {
    if (newMinute >= 0 && newMinute <= 59) {
      onChange(`${String(hours).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`);
    }
  }, [hours, onChange]);
  
  const adjustHour = (delta: number) => {
    let newHour = hours + delta;
    if (newHour < 0) newHour = 23;
    if (newHour > 23) newHour = 0;
    handleHourChange(newHour);
  };
  
  const adjustMinute = (delta: number) => {
    let newMinute = minutes + delta;
    if (newMinute < 0) newMinute = 59;
    if (newMinute > 59) newMinute = 0;
    handleMinuteChange(newMinute);
  };

  return (
    <div className={`flex flex-col gap-2 ${disabled ? 'opacity-50' : ''}`}>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      )}
      
      <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 pixel-border">
        {/* Hours */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => !disabled && adjustHour(1)}
            disabled={disabled}
            className="w-10 h-8 bg-primary-500 text-white rounded-none pixel-btn-sm
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.3)' }}
          >
            ▲
          </button>
          <div 
            className="w-12 h-10 flex items-center justify-center bg-white dark:bg-gray-900 
              text-xl font-bold text-gray-800 dark:text-gray-100 pixel-border"
          >
            {String(hours).padStart(2, '0')}
          </div>
          <button
            type="button"
            onClick={() => !disabled && adjustHour(-1)}
            disabled={disabled}
            className="w-10 h-8 bg-primary-500 text-white rounded-none pixel-btn-sm
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.3)' }}
          >
            ▼
          </button>
        </div>
        
        {/* Separator */}
        <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">:</span>
        
        {/* Minutes */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => !disabled && adjustMinute(1)}
            disabled={disabled}
            className="w-10 h-8 bg-primary-500 text-white rounded-none pixel-btn-sm
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.3)' }}
          >
            ▲
          </button>
          <div 
            className="w-12 h-10 flex items-center justify-center bg-white dark:bg-gray-900 
              text-xl font-bold text-gray-800 dark:text-gray-100 pixel-border"
          >
            {String(minutes).padStart(2, '0')}
          </div>
          <button
            type="button"
            onClick={() => !disabled && adjustMinute(-1)}
            disabled={disabled}
            className="w-10 h-8 bg-primary-500 text-white rounded-none pixel-btn-sm
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: 'inset -2px -2px 0 rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,255,255,0.3)' }}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
