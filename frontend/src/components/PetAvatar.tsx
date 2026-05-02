import { usePetStore } from '@stores/petStore';

const STAGE_EMOJIS: Record<string, string> = {
  egg: '🥚',
  baby: '👶',
  child: '🧒',
  teen: '🧑',
  adult: '🧑‍🦱',
};

const MOOD_COLORS: Record<string, string> = {
  happy: 'bg-green-400',
  normal: 'bg-blue-400',
  thirsty: 'bg-yellow-400',
  sad: 'bg-gray-400',
  sleeping: 'bg-indigo-400',
  excited: 'bg-pink-400',
};

const MOOD_LABELS: Record<string, string> = {
  happy: '开心',
  normal: '平静',
  thirsty: '口渴',
  sad: '难过',
  sleeping: '睡眠中',
  excited: '兴奋',
};

interface PetAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PetAvatar({ size = 'md' }: PetAvatarProps) {
  const { pet } = usePetStore();

  if (!pet) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className={`bg-gray-200 rounded-full flex items-center justify-center ${getSizeClasses(size)}`}>
          <span className="text-4xl">🎮</span>
        </div>
        <p className="mt-2 text-gray-500">还没有宠物</p>
      </div>
    );
  }

  const stageEmoji = STAGE_EMOJIS[pet.stage] || '🥚';
  const moodColor = MOOD_COLORS[pet.mood] || 'bg-blue-400';
  const moodLabel = MOOD_LABELS[pet.mood] || '平静';

  return (
    <div className="flex flex-col items-center">
      {/* Pet avatar with mood indicator */}
      <div className="relative">
        <div
          className={`${moodColor} rounded-full flex items-center justify-center ${getSizeClasses(size)} transition-all duration-300`}
        >
          <span className={`${getEmojiSize(size)} animate-float`}>{stageEmoji}</span>
        </div>

        {/* Mood badge */}
        <span
          className={`absolute -bottom-1 -right-1 px-2 py-0.5 text-xs font-medium text-white rounded-full ${moodColor}`}
        >
          {moodLabel}
        </span>

        {/* Stage badge */}
        <span className="absolute -top-1 -right-1 w-8 h-8 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
          {pet.stage === 'egg' ? '蛋' : pet.stage === 'baby' ? '幼' : pet.stage === 'child' ? '少' : pet.stage === 'teen' ? '青' : '成'}
        </span>
      </div>

      {/* Pet info */}
      <div className="mt-3 text-center">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{pet.name}</h3>
        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-full">
          {pet.bodyType === 'slim' ? '苗条型' : pet.bodyType === 'chubby' ? '圆润型' : '标准型'}
        </span>
      </div>

      {/* Growth bar */}
      <div className="mt-2 w-32">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>成长</span>
          <span>
            {pet.growth}/{pet.maxGrowth}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 transition-all duration-500"
            style={{ width: `${Math.min(100, (pet.growth / pet.maxGrowth) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function getSizeClasses(size: string): string {
  switch (size) {
    case 'sm':
      return 'w-16 h-16';
    case 'md':
      return 'w-24 h-24';
    case 'lg':
      return 'w-32 h-32';
    case 'xl':
      return 'w-40 h-40';
    default:
      return 'w-24 h-24';
  }
}

function getEmojiSize(size: string): string {
  switch (size) {
    case 'sm':
      return 'text-3xl';
    case 'md':
      return 'text-5xl';
    case 'lg':
      return 'text-6xl';
    case 'xl':
      return 'text-7xl';
    default:
      return 'text-5xl';
  }
}
