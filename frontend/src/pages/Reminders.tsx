import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@stores/userStore';
import { usePushNotification } from '@hooks/usePushNotification';
import { useReminder } from '@hooks/useReminder';
import { PixelToggle } from '@components/ui/PixelToggle';
import { PixelTimePicker } from '@components/ui/PixelTimePicker';
import { PixelIntervalPicker } from '@components/ui/PixelIntervalPicker';
import { Button } from '@components/ui/Button';

const REMINDER_INTERVALS = [30, 60, 90, 120];

export function Reminders() {
  const { settings, updateSettings } = useUserStore();
  const notificationSettings = settings.notifications;
  
  const {
    isSupported,
    permission,
    subscription,
    isSubscribing,
    error: pushError,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
    clearError,
  } = usePushNotification();
  
  const {
    isActive,
    reminderCount,
    getNextReminderText,
    triggerReminder,
  } = useReminder(notificationSettings);

  const [showTestSuccess, setShowTestSuccess] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(notificationSettings.enabled);

  // Sync local state with store
  useEffect(() => {
    setLocalEnabled(notificationSettings.enabled);
  }, [notificationSettings.enabled]);

  // Handle main toggle
  const handleToggleEnabled = useCallback(async (enabled: boolean) => {
    setLocalEnabled(enabled);
    
    if (enabled) {
      // Request permission when enabling
      const granted = await requestPermission();
      if (granted && !subscription) {
        await subscribe();
      }
    }
    
    updateSettings({
      notifications: { ...notificationSettings, enabled },
    });
  }, [notificationSettings, requestPermission, subscribe, subscription, updateSettings]);

  // Handle interval change
  const handleIntervalChange = useCallback((interval: number) => {
    updateSettings({
      notifications: { ...notificationSettings, interval },
    });
  }, [notificationSettings, updateSettings]);

  // Handle start time change
  const handleStartTimeChange = useCallback((startTime: string) => {
    updateSettings({
      notifications: { ...notificationSettings, startTime },
    });
  }, [notificationSettings, updateSettings]);

  // Handle end time change
  const handleEndTimeChange = useCallback((endTime: string) => {
    updateSettings({
      notifications: { ...notificationSettings, endTime },
    });
  }, [notificationSettings, updateSettings]);

  // Handle sound toggle
  const handleSoundToggle = useCallback((soundEnabled: boolean) => {
    updateSettings({
      notifications: { ...notificationSettings, soundEnabled },
    });
  }, [notificationSettings, updateSettings]);

  // Handle subscribe/unsubscribe
  const handleSubscriptionToggle = useCallback(async () => {
    if (subscription) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  }, [subscription, subscribe, unsubscribe]);

  // Handle test notification
  const handleTestNotification = useCallback(async () => {
    const success = await sendTestNotification();
    if (success) {
      setShowTestSuccess(true);
      setTimeout(() => setShowTestSuccess(false), 3000);
    }
  }, [sendTestNotification]);

  // Handle manual trigger
  const handleTriggerNow = useCallback(async () => {
    await triggerReminder();
    setShowTestSuccess(true);
    setTimeout(() => setShowTestSuccess(false), 3000);
  }, [triggerReminder]);

  // Get permission status display
  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { text: '已授权', color: 'text-green-600', bg: 'bg-green-100' };
      case 'denied':
        return { text: '已拒绝', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { text: '未请求', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-500 rounded-none flex items-center justify-center pixel-border">
          <span className="text-xl">🔔</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 pixel-text">
            提醒设置
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            配置喝水提醒时间和频率
          </p>
        </div>
      </div>

      {/* Test success notification */}
      {showTestSuccess && (
        <div className="p-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-none pixel-border animate-pulse">
          <p className="text-green-800 dark:text-green-200 font-medium text-center">
            ✅ 测试通知已发送！
          </p>
        </div>
      )}

      {/* Error display */}
      {pushError && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-none pixel-border">
          <p className="text-red-800 dark:text-red-200 text-sm">{pushError}</p>
          <button
            onClick={clearError}
            className="mt-2 text-xs text-red-600 underline"
          >
            关闭
          </button>
        </div>
      )}

      {/* Main Toggle */}
      <div className="card p-6 pixel-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              喝水提醒
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              开启后将在设定时间内发送提醒
            </p>
          </div>
          <PixelToggle
            checked={localEnabled}
            onChange={handleToggleEnabled}
            disabled={!isSupported}
            size="lg"
          />
        </div>

        {!isSupported && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 rounded-none">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 您的浏览器不支持推送通知功能
            </p>
          </div>
        )}

        {localEnabled && isActive && (
          <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-300 rounded-none pixel-border">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  下次提醒
                </p>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {getNextReminderText()}
                </p>
              </div>
            </div>
            {reminderCount > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                今日已提醒 {reminderCount} 次
              </p>
            )}
          </div>
        )}
      </div>

      {/* Reminder Schedule */}
      <div className={`card p-6 pixel-card ${!localEnabled ? 'opacity-50' : ''}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>📅</span> 提醒时间
        </h2>
        
        <div className="space-y-6">
          {/* Interval Picker */}
          <PixelIntervalPicker
            label="提醒间隔"
            value={notificationSettings.interval}
            onChange={handleIntervalChange}
            options={REMINDER_INTERVALS}
            unit="分钟"
            disabled={!localEnabled}
          />

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <PixelTimePicker
              label="开始时间"
              value={notificationSettings.startTime}
              onChange={handleStartTimeChange}
              disabled={!localEnabled}
            />
            <PixelTimePicker
              label="结束时间"
              value={notificationSettings.endTime}
              onChange={handleEndTimeChange}
              disabled={!localEnabled}
            />
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-none pixel-border">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔊</span>
              <div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  提醒音效
                </span>
                <p className="text-xs text-gray-500">播放提示音</p>
              </div>
            </div>
            <PixelToggle
              checked={notificationSettings.soundEnabled}
              onChange={handleSoundToggle}
              disabled={!localEnabled}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Push Notification Status */}
      <div className="card p-6 pixel-card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>🔔</span> 推送通知
        </h2>

        <div className="space-y-4">
          {/* Permission Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-none pixel-border">
            <span className="text-gray-700 dark:text-gray-300">通知权限</span>
            <span className={`px-3 py-1 text-sm font-medium rounded-none ${permissionStatus.bg} ${permissionStatus.color}`}>
              {permissionStatus.text}
            </span>
          </div>

          {/* Subscription Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-none pixel-border">
            <span className="text-gray-700 dark:text-gray-300">推送订阅</span>
            <span className={`px-3 py-1 text-sm font-medium rounded-none ${
              subscription 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {subscription ? '已订阅' : '未订阅'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {permission === 'denied' ? (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 rounded-none">
                <p className="text-sm text-red-700 dark:text-red-300">
                  通知权限已被拒绝。请在浏览器设置中允许通知权限。
                </p>
              </div>
            ) : (
              <Button
                variant={subscription ? 'secondary' : 'primary'}
                onClick={handleSubscriptionToggle}
                isLoading={isSubscribing}
                fullWidth
              >
                {subscription ? '🔕 取消推送订阅' : '🔔 订阅推送通知'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={permission !== 'granted'}
              fullWidth
            >
              🧪 发送测试通知
            </Button>

            {import.meta.env.DEV && (
              <Button
                variant="ghost"
                onClick={handleTriggerNow}
                disabled={!localEnabled}
                fullWidth
              >
                ⚡ 立即触发提醒
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6 pixel-card bg-blue-50 dark:bg-blue-900/10">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
          <span>💡</span> 提醒小贴士
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
          <li>• 建议每 60-90 分钟提醒一次，避免过于频繁</li>
          <li>• 根据个人作息设置合适的提醒时间段</li>
          <li>• 订阅推送通知后，即使关闭页面也能收到提醒</li>
          <li>• 睡前2小时减少喝水，有助于睡眠质量</li>
        </ul>
      </div>
    </div>
  );
}

export default Reminders;
