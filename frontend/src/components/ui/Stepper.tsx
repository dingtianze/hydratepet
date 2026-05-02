interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step circle and label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    font-mono font-bold text-sm
                    transition-all duration-300
                    border-2
                    ${
                      isCompleted
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : isCurrent
                        ? 'bg-primary-100 border-primary-600 text-primary-600 dark:bg-primary-900/30'
                        : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium text-center
                    ${
                      isCompleted || isCurrent
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 rounded-full transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-primary-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
