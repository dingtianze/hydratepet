import { WaterProgress } from '@components/WaterProgress';
import { QuickAddWater } from '@components/QuickAddWater';
import { PetAvatar } from '@components/pet/PetAvatar';
import { useWaterStore } from '@stores/waterStore';
import { usePetStore } from '@stores/petStore';
import { useUserStore } from '@stores/userStore';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShareCard } from '@components/ShareCard';

export function Home() {
  const { todayAmount, dailyGoal, isGoalReached } = useWaterStore();
  const { pet, interactWithPet } = usePetStore();
  const { user } = useUserStore();

  const handleInteract = () => {
    if (pet) {
      interactWithPet();
    }
  };

  // Check pet hydration status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (pet && pet.mood !== 'sleeping') {
        const lastFed = new Date(pet.lastFed || Date.now());
        const hoursSinceFed = (Date.now() - lastFed.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceFed > 2 && pet.health > 0) {
          // Decrease health over time
          // This would be handled by the store in a real app
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [pet]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '🌙 夜深了，注意休息';
    if (hour < 9) return '☀️ 早上好，开始新的一天';
    if (hour < 12) return '☀️ 上午好，记得补水';
    if (hour < 14) return '🌤️ 中午好，午餐后来杯水吧';
    if (hour < 18) return '☕ 下午好，多喝水提神';
    if (hour < 22) return '🌆 晚上好，适当饮水有助睡眠';
    return '🌙 夜深了，睡前少喝点水哦';
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="text-center">
        <p className="text-gray-600 dark:text-gray-400">{getGreeting()}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
          HydratePet
        </h1>
      </header>

      {/* Pet Section */}
      <section className="card p-6">
        <PetAvatar pet={pet} size="lg" onInteract={handleInteract} />
        
        {/* Pet health indicator */}
        {pet && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>宠物健康</span>
              <span>{pet.health}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  pet.health > 70
                    ? 'bg-pet-normal'
                    : pet.health > 40
                    ? 'bg-pet-happy'
                    : 'bg-pet-thirsty'
                }`}
                style={{ width: `${pet.health}%` }}
              />
            </div>
            {pet.health < 40 && (
              <p className="mt-2 text-center text-sm text-pet-thirsty">
                你的宠物不太舒服，快喝水吧！
              </p>
            )}
          </div>
        )}
      </section>

      {/* Today's Progress */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          今日饮水进度
        </h2>
        <div className="flex justify-center">
          <WaterProgress size={180} strokeWidth={10} />
        </div>
        
        {isGoalReached() && (
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-sm">
              🎉 今日目标已达成！
            </span>
          </div>
        )}
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-water-600">{todayAmount}</p>
            <p className="text-xs text-gray-500">今日已喝 (ml)</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-primary-600">{dailyGoal}</p>
            <p className="text-xs text-gray-500">每日目标 (ml)</p>
          </div>
        </div>
      </section>

      {/* Quick Add Water */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          快速记录
        </h2>
        <QuickAddWater />
      </section>

      {/* Tips */}
      <section className="card p-4 bg-gradient-to-r from-water-50 to-primary-50 dark:from-gray-800 dark:to-gray-800">
        <h3 className="text-sm font-medium text-water-700 dark:text-water-300 mb-1">
          💡 健康小贴士
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          成年人每天建议饮水 1500-2000ml。少量多次，不要等到口渴再喝水哦！
        </p>
      </section>

      {/* Share & Achievements */}
      {isGoalReached() && (
        <section className="card p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 border-2 border-yellow-200 dark:border-yellow-900">
          <div className="text-center">
            <span className="text-4xl">🎉</span>
            <h2 className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">
              今日目标达成！
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              太棒了！你的宠物因为你的努力而开心~
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <Link
                to="/titles"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                🏆 查看称号
              </Link>
              <ShareCard
                petName={pet?.name || '小水滴'}
                petStage={pet?.stage || 'egg'}
                todayAmount={todayAmount}
                goalReached={isGoalReached()}
                streakDays={0}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
