import { useState, useEffect } from 'react';
import { api } from '@services/api';

interface Title {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  unlockedAt?: string;
  isActive?: boolean;
}

interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  iconUrl: string | null;
  rarity: string;
  unlockedAt?: string;
}

export function Titles() {
  const [activeTab, setActiveTab] = useState<'titles' | 'badges'>('titles');
  const [currentTitle, setCurrentTitle] = useState<Title | null>(null);
  const [unlockedTitles, setUnlockedTitles] = useState<Title[]>([]);
  const [lockedTitles, setLockedTitles] = useState<Title[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
  const [lockedBadges, setLockedBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const res = await api.titles.getAll();
      if (res.success) {
        setCurrentTitle(res.data.current);
        setUnlockedTitles(res.data.unlocked || []);
        setLockedTitles(res.data.locked || []);
      }
      const badgeRes = await api.titles.getBadges();
      if (badgeRes.success) {
        setUnlockedBadges(badgeRes.data.unlocked || []);
        setLockedBadges(badgeRes.data.locked || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function equipTitle(id: string) {
    try {
      const res = await api.titles.equip(id);
      if (res.success) {
        setMessage('称号已装备！');
        loadData();
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce text-4xl mb-2">🏆</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            成就中心</h1>
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('titles')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'titles'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              称号 ({unlockedTitles.length}/{unlockedTitles.length + lockedTitles.length})
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'badges'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              徽章 ({unlockedBadges.length}/{unlockedBadges.length + lockedBadges.length})
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="max-w-lg mx-auto px-4 mt-4">
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg text-center text-sm">
            {message}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4">
        {activeTab === 'titles' ? (
          <>
            {currentTitle && (
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-4 mb-6 text-white">
                <div className="text-xs opacity-80 mb-1">当前装备</div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentTitle.icon || '🏆'}</span>
                  <div>
                    <div className="text-lg font-bold">{currentTitle.name}</div>
                    <div className="text-sm opacity-90">{currentTitle.description}</div>
                  </div>
                </div>
              </div>
            )}

            {unlockedTitles.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  已解锁</h2>
                <div className="space-y-3">
                  {unlockedTitles.map((title) => (
                    <div
                      key={title.id}
                      onClick={() => equipTitle(title.id)}
                      className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-2 cursor-pointer transition-all ${
                        title.isActive
                          ? 'border-primary-500 shadow-md'
                          : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{title.icon || '🏆'}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{title.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{title.description}</div>
                        </div>
                        {title.isActive ? (
                          <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 px-2 py-1 rounded-full">
                            装备中
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">点击装备</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lockedTitles.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  未解锁</h2>
                <div className="space-y-3">
                  {lockedTitles.map((title) => (
                    <div
                      key={title.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">❌</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{title.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{title.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {unlockedBadges.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  已获得</h2>
                <div className="grid grid-cols-2 gap-3">
                  {unlockedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border-2 border-transparent"
                    >
                      <div className="text-3xl mb-2">{badge.iconUrl || '🎯'}</div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{badge.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{badge.description}</div>
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                        badge.rarity === 'legendary'
                          ? 'bg-yellow-100 text-yellow-700'
                          : badge.rarity === 'epic'
                          ? 'bg-purple-100 text-purple-700'
                          : badge.rarity === 'rare'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {badge.rarity === 'legendary' ? '传说' : badge.rarity === 'epic' ? '史诗' : badge.rarity === 'rare' ? '稀有' : '普通'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lockedBadges.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                  未获得</h2>
                <div className="grid grid-cols-2 gap-3">
                  {lockedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center opacity-40"
                    >
                      <div className="text-3xl mb-2">❓</div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{badge.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{badge.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
