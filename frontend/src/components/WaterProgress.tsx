import { useWaterStore } from '@stores/waterStore';

interface WaterProgressProps {
  size?: number;
  strokeWidth?: number;
}

export function WaterProgress({ size = 200, strokeWidth = 12 }: WaterProgressProps) {
  const { todayAmount, dailyGoal, getProgressPercentage } = useWaterStore();
  const percentage = getProgressPercentage();

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-water-500 transition-all duration-500 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-water-600 dark:text-water-400">
          {percentage}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {todayAmount} / {dailyGoal} ml
        </span>
      </div>

      {/* Wave animation */}
      {percentage >= 50 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-pulse-slow">
            <svg
              width={size * 0.3}
              height={size * 0.3}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-water-400/50"
            >
              <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
