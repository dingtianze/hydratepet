import { useUserStore } from '@stores/userStore';
import { useWaterStore } from '@stores/waterStore';
import { useState, useEffect } from 'react';

const DAILY_GOAL_OPTIONS = [1500, 2000, 2500, 3000, 3500];
const REMINDER_INTERVALS = [30, 60, 90, 120];

export function Settings() {
  const { user, settings, updateSettings, logout } = useUserStore();
  const { dailyGoal, setDailyGoal } = useWaterStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pwaStatus, setPwaStatus] = useState<'unsupported' | 'installable' | 'installed'>('unsupported');

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check PWA status
  useEffect(() => {
    const checkPWA = () => {
      if ('serviceWorker' in navigator) {
        if (window.matchMedia('(display-mode: standalone)').matches) {
          setPwaStatus('installed');
        } else {
          setPwaStatus('installable');
        }
      }
    };
    checkPWA();
  }, []);

  const handleInstallPWA = async () => {
    // @ts-ignore
    if (window.deferredPrompt) {
      // @ts-ignore
      window.deferredPrompt.prompt();
      // @ts-ignore
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setPwaStatus('installed');
      }
      // @ts-ignore
      window.deferredPrompt = null;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">设置</h1>

      {/* User Profile */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          用户资料
        </h2>
        {user ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">登录后同步您的数据</p>
            <button className="btn-primary">登录 / 注册</button>
          </div>
        )}
      </div>

      {/* Daily Goal */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          每日目标
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {DAILY_GOAL_OPTIONS.map((goal) => (
            <button
              key={goal}
              onClick={() => setDailyGoal(goal)}
              className={`py-3 rounded-lg font-medium transition-all ${
                dailyGoal === goal
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {goal}ml
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          提醒设置
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">开启提醒</span>
            <button
              onClick={() =>
                updateSettings({
                  notifications: {
                    ...settings.notifications,
                    enabled: !settings.notifications.enabled,
                  },
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.notifications.enabled ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  settings.notifications.enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {settings.notifications.enabled && (
            <>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  提醒间隔
                </label>
                <div className="flex gap-2">
                  {REMINDER_INTERVALS.map((interval) => (
                    <button
                      key={interval}
                      onClick={() =>
                        updateSettings({
                          notifications: {
                            ...settings.notifications,
                            interval,
                          },
                        })
                      }
                      className={`flex-1 py-2 text-sm rounded-lg transition-all ${
                        settings.notifications.interval === interval
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {interval}分
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    开始时间
                  </label>
                  <input
                    type="time"
                    value={settings.notifications.startTime}
                    onChange={(e) =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          startTime: e.target.value,
                        },
                      })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    结束时间
                  </label>
                  <input
                    type="time"
                    value={settings.notifications.endTime}
                    onChange={(e) =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          endTime: e.target.value,
                        },
                      })
                    }
                    className="input"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          外观
        </h2>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => updateSettings({ theme })}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                settings.theme === theme
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {theme === 'light' && '☀️ 浅色'}
              {theme === 'dark' && '🌙 深色'}
              {theme === 'system' && '💻 跟随系统'}
            </button>
          ))}
        </div>
      </div>

      {/* PWA Status */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          应用状态
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">网络状态</span>
            <span className={`px-2 py-1 rounded text-sm ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isOnline ? '🟢 在线' : '🔴 离线'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">PWA 状态</span>
            <span className="px-2 py-1 rounded text-sm bg-gray-100 dark:bg-gray-700">
              {pwaStatus === 'unsupported' && '⚪ 不支持'}
              {pwaStatus === 'installable' && '📲 可安装'}
              {pwaStatus === 'installed' && '✅ 已安装'}
            </span>
          </div>

          {pwaStatus === 'installable' && (
            <button onClick={handleInstallPWA} className="w-full btn-primary">
              📲 安装到桌面
            </button>
          )}
        </div>
      </div>

      {/* Data Export/Import */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          数据管理
        </h2>
        <div className="space-y-3">
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/export/data', {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('导出失败');
                const json = await res.json();
                const exportData = json.data?.data || json.data;
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `hydratepet-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                alert('导出失败: ' + (e as Error).message);
              }
            }}
            className="w-full py-3 rounded-lg font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-all"
          >
            📥 导出数据备份
          </button>
          
          <label className="w-full block py-3 rounded-lg font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-all text-center cursor-pointer">
            📤 导入数据备份
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const data = JSON.parse(text);
                  const token = localStorage.getItem('token');
                  const res = await fetch('/api/export/import', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ data })
                  });
                  if (!res.ok) throw new Error('导入失败');
                  alert('导入成功！页面将刷新。');
                  window.location.reload();
                } catch (e) {
                  alert('导入失败: ' + (e as Error).message);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* About */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          关于
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>HydratePet v1.0.0</p>
          <p>像素宠物喝水助手，养成喝水好习惯</p>
          <p className="text-xs text-gray-400">
            © 2024 HydratePet. All rights reserved.
          </p>
        </div>
      </div>

      {/* Logout */}
      {user && (
        <button
          onClick={logout}
          className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50"
        >
          退出登录
        </button>
      )}
    </div>
  );
}
