import { usePetStore } from '@stores/petStore';
import { PetAvatar } from '@components/PetAvatar';
import { useState } from 'react';
import type { PetType } from '../types/index';

const PET_TYPES: { type: PetType; label: string; emoji: string; desc: string }[] = [
  { type: 'cat', label: '小猫', emoji: '🐱', desc: '懒洋洋，喜欢晒太阳' },
  { type: 'dog', label: '小狗', emoji: '🐶', desc: '活泼好动，忠诚可靠' },
  { type: 'rabbit', label: '兔子', emoji: '🐰', desc: '可爱君，喜欢胡萝卜' },
  { type: 'bird', label: '小鸟', emoji: '🐦', desc: '灵活机敏，爱唱歌' },
  { type: 'hamster', label: '仓鼠', emoji: '🐹', desc: '迷你萌，爱嚕瓜子' },
];

export function Pet() {
  const { pet, setPet, toggleSleep } = usePetStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [selectedType, setSelectedType] = useState<PetType>('cat');

  const handleCreatePet = () => {
    if (!newPetName.trim()) return;

    const newPet = {
      id: crypto.randomUUID(),
      name: newPetName.trim(),
      stage: 'egg' as const,
      growth: 0,
      maxGrowth: 30,
      bodyType: 'normal' as const,
      colorPalette: ['#74B9FF', '#0984E3'],
      accessories: [],
      mood: 'normal' as const,
      health: 100,
      nextEvolution: 30,
      lastFed: null as string | null,
    };

    setPet(newPet);
    setIsCreating(false);
    setNewPetName('');
  };

  if (!pet) {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">我的宠物</h1>
        
        {isCreating ? (
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold">领养新宠物</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                给它取个名字
              </label>
              <input
                type="text"
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                placeholder="例如：小水滴"
                className="input"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                选择类型
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PET_TYPES.map(({ type, label, emoji, desc }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-3 border rounded-lg text-left transition-all ${
                      selectedType === type
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <p className="font-medium mt-1">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleCreatePet}
                disabled={!newPetName.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                领养
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <span className="text-6xl">🎮</span>
            <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              还没有宠物
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              领养一只属于你的宠物，开始你的喝水之旅吧！
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-6 btn-primary px-8"
            >
              领养宠物
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">我的宠物</h1>

      {/* Pet Avatar Card */}
      <div className="card p-6">
        <div className="flex justify-center">
          <PetAvatar size="xl" />
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={toggleSleep}
            className={`btn ${
              pet.mood === 'sleeping'
                ? 'btn-secondary'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            }`}
          >
            {pet.mood === 'sleeping' ? '❤️ 呼醒' : '😴 睡觉'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          宠物状态
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500">阶段</p>
            <p className="text-xl font-bold">{pet.stage === 'egg' ? '🥚' : pet.stage === 'baby' ? '👶' : pet.stage === 'child' ? '🧒' : pet.stage === 'teen' ? '🧑' : '🧑‍🦱'}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500">心情</p>
            <p className="text-xl font-bold">
              {pet.mood === 'happy' && '😊'}
              {pet.mood === 'normal' && '😐'}
              {pet.mood === 'thirsty' && '🤤'}
              {pet.mood === 'sad' && '😔'}
              {pet.mood === 'sleeping' && '😴'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500">成长值</p>
            <p className="text-xl font-bold">{pet.growth}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500">健康度</p>
            <p className="text-xl font-bold">{pet.health}%</p>
          </div>
        </div>
      </div>

      {/* Accessories */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          装饰配件
        </h2>
        <div className="flex flex-wrap gap-2">
          {pet.accessories.length > 0 ? (
            pet.accessories.map((accessory) => (
              <span
                key={accessory}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-700"
              >
                {accessory}
              </span>
            ))
          ) : (
            <p className="text-gray-500 text-sm">暂无装饰</p>
          )}
        </div>
      </div>
    </div>
  );
}
