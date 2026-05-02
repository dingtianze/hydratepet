import { useState, useCallback, useEffect, useRef } from 'react';
import { usePushNotification } from './usePushNotification';
import { soundManager } from '../utils/sound';
import type { NotificationSettings } from '../types';

interface ReminderState {
  isActive: boolean;
  nextReminder: Date | null;
  lastReminder: Date | null;
  reminderCount: number;
}

export function useReminder(settings: NotificationSettings) {
  const [state, setState] = useState<ReminderState>({
    isActive: false,
    nextReminder: null,
    lastReminder: null,
    reminderCount: 0,
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { sendTestNotification } = usePushNotification();

  // Check if current time is within reminder window
  const isInReminderWindow = useCallback((date: Date = new Date()): boolean => {
    if (!settings.enabled) return false;
    
    const currentHour = date.getHours();
    const currentMinute = date.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = settings.startTime.split(':').map(Number);
    const [endHour, endMinute] = settings.endTime.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    return currentTime >= startTime && currentTime <= endTime;
  }, [settings.enabled, settings.startTime, settings.endTime]);

  // Calculate next reminder time
  const calculateNextReminder = useCallback((): Date | null => {
    if (!settings.enabled) return null;
    
    const now = new Date();
    const [startHour, startMinute] = settings.startTime.split(':').map(Number);
    const [endHour, endMinute] = settings.endTime.split(':').map(Number);
    
    const startTime = new Date(now);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(now);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // If before start time, next reminder is at start time
    if (now < startTime) {
      return startTime;
    }
    
    // If after end time, next reminder is tomorrow at start time
    if (now > endTime) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(startHour, startMinute, 0, 0);
      return tomorrow;
    }
    
    // Within window, calculate next interval
    const intervalMs = settings.interval * 60 * 1000;
    const elapsed = now.getTime() - startTime.getTime();
    const intervals = Math.floor(elapsed / intervalMs);
    const nextReminder = new Date(startTime.getTime() + (intervals + 1) * intervalMs);
    
    // If next reminder would be after end time, schedule for tomorrow
    if (nextReminder > endTime) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(startHour, startMinute, 0, 0);
      return tomorrow;
    }
    
    return nextReminder;
  }, [settings.enabled, settings.interval, settings.startTime, settings.endTime]);

  // Trigger reminder
  const triggerReminder = useCallback(async () => {
    if (settings.soundEnabled) {
      soundManager.playNotificationSound();
    }
    
    await sendTestNotification();
    
    setState(prev => ({
      ...prev,
      lastReminder: new Date(),
      reminderCount: prev.reminderCount + 1,
    }));
  }, [settings.soundEnabled, sendTestNotification]);

  // Schedule next reminder
  const scheduleNextReminder = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (!settings.enabled) {
      setState(prev => ({ ...prev, isActive: false, nextReminder: null }));
      return;
    }
    
    const next = calculateNextReminder();
    if (!next) {
      setState(prev => ({ ...prev, isActive: false, nextReminder: null }));
      return;
    }
    
    const delay = next.getTime() - Date.now();
    
    setState(prev => ({ ...prev, isActive: true, nextReminder: next }));
    
    timeoutRef.current = setTimeout(() => {
      if (isInReminderWindow()) {
        triggerReminder();
      }
      scheduleNextReminder(); // Reschedule for next interval
    }, delay);
  }, [settings.enabled, calculateNextReminder, isInReminderWindow, triggerReminder]);

  // Start reminders
  const startReminders = useCallback(() => {
    if (!settings.enabled) {
      console.log('[Reminder] Reminders disabled');
      return;
    }
    
    console.log('[Reminder] Starting reminders...');
    scheduleNextReminder();
  }, [settings.enabled, scheduleNextReminder]);

  // Stop reminders
  const stopReminders = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState(prev => ({ ...prev, isActive: false, nextReminder: null }));
    console.log('[Reminder] Stopped reminders');
  }, []);

  // Reschedule when settings change
  useEffect(() => {
    if (settings.enabled) {
      startReminders();
    } else {
      stopReminders();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [settings, startReminders, stopReminders]);

  // Format next reminder time for display
  const getNextReminderText = useCallback((): string => {
    if (!state.nextReminder) return '未设置';
    
    const now = new Date();
    const diff = state.nextReminder.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}后`;
    }
    if (minutes > 0) {
      return `${minutes}分钟后`;
    }
    return '即将提醒';
  }, [state.nextReminder]);

  return {
    ...state,
    isInReminderWindow,
    startReminders,
    stopReminders,
    triggerReminder,
    getNextReminderText,
  };
}

export default useReminder;
