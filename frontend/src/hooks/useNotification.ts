import { useState, useCallback, useEffect } from 'react';
import { useUserStore } from '@stores/userStore';

export function useNotification() {
  const { settings } = useUserStore();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') return false;

      try {
        // Use service worker to show notification
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options,
        });
        return true;
      } catch (error) {
        // Fallback to regular notification
        try {
          new Notification(title, options);
          return true;
        } catch {
          return false;
        }
      }
    },
    [isSupported, permission]
  );

  const scheduleReminder = useCallback(
    (delayMs: number, title: string, body: string) => {
      if (!settings.notifications.enabled) return null;

      const timeoutId = setTimeout(() => {
        sendNotification(title, {
          body,
          tag: 'water-reminder',
          requireInteraction: true,
        });
      }, delayMs);

      return timeoutId;
    },
    [settings.notifications.enabled, sendNotification]
  );

  const cancelReminder = useCallback((timeoutId: NodeJS.Timeout | null) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }, []);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    scheduleReminder,
    cancelReminder,
  };
}
