import { useState, useCallback, useEffect, useRef } from 'react';
import { notificationApi } from '@services/api';

// VAPID public key from environment or config
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 
  'BEl62iSMf6LJwC--4Yj0L9xL5p9bK8w4-M8-0tGj6xY';

interface PushState {
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  isSubscribing: boolean;
  error: string | null;
}

export function usePushNotification() {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    permission: 'default',
    subscription: null,
    isSubscribing: false,
    error: null,
  });
  
  const serviceWorkerRef = useRef<ServiceWorkerRegistration | null>(null);

  // Check for push notification support
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      if (supported) {
        setState(prev => ({
          ...prev,
          isSupported: true,
          permission: Notification.permission,
        }));

        try {
          const registration = await navigator.serviceWorker.ready;
          serviceWorkerRef.current = registration;
          
          // Check existing subscription
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            setState(prev => ({
              ...prev,
              subscription: existingSubscription,
            }));
          }
        } catch (error) {
          console.error('[Push] Error checking subscription:', error);
        }
      }
    };

    checkSupport();
  }, []);

  // Convert VAPID key from base64 to Uint8Array
  const urlBase64ToUint8Array = useCallback((base64String: string): ArrayBuffer => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to request permission' }));
      return false;
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !serviceWorkerRef.current) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    setState(prev => ({ ...prev, isSubscribing: true, error: null }));

    try {
      // Request permission first
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        setState(prev => ({
          ...prev,
          isSubscribing: false,
          error: 'Notification permission denied',
        }));
        return false;
      }

      // Subscribe to push
      const subscription = await serviceWorkerRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Send subscription to server
      const response = await notificationApi.subscribe(subscription);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          subscription,
          isSubscribing: false,
          error: null,
        }));
        return true;
      } else {
        throw new Error(response.error || 'Failed to subscribe on server');
      }
    } catch (error) {
      console.error('[Push] Subscription error:', error);
      setState(prev => ({
        ...prev,
        isSubscribing: false,
        error: error instanceof Error ? error.message : 'Subscription failed',
      }));
      return false;
    }
  }, [state.isSupported, requestPermission, urlBase64ToUint8Array]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) return false;

    setState(prev => ({ ...prev, isSubscribing: true, error: null }));

    try {
      // Unsubscribe from push manager
      const success = await state.subscription.unsubscribe();
      
      if (success) {
        // Notify server
        await notificationApi.unsubscribe();
        
        setState(prev => ({
          ...prev,
          subscription: null,
          isSubscribing: false,
          error: null,
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      setState(prev => ({
        ...prev,
        isSubscribing: false,
        error: error instanceof Error ? error.message : 'Unsubscribe failed',
      }));
      return false;
    }
  }, [state.subscription]);

  // Send a test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || state.permission !== 'granted') {
      return false;
    }

    try {
      // Try server test first
      const response = await notificationApi.test();
      if (response.success) {
        return true;
      }
    } catch (error) {
      console.warn('[Push] Server test failed, using local test:', error);
    }

      // Fallback to local notification
    try {
      const registration = await navigator.serviceWorker.ready;
      const notificationOptions: NotificationOptions & { actions?: { action: string; title: string }[] } = {
        body: '💧 测试提醒！你的像素宠物来了~',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'test-notification',
        requireInteraction: true,
        actions: [
          { action: 'drink', title: '我喝了💧' },
          { action: 'dismiss', title: '知道了' },
        ],
      };
      await registration.showNotification('HydratePet Test', notificationOptions);
      return true;
    } catch (error) {
      console.error('[Push] Test notification error:', error);
      return false;
    }
  }, [state.isSupported, state.permission]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
    clearError,
  };
}

export default usePushNotification;
