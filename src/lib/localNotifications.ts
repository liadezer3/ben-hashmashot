import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => Capacitor.isNativePlatform();

export const requestNotificationPermission = async () => {
  if (!isNativeApp()) {
    console.log('Not a native app, skipping notification permission request');
    return false;
  }

  try {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const checkNotificationPermission = async () => {
  if (!isNativeApp()) {
    return false;
  }

  try {
    const permission = await LocalNotifications.checkPermissions();
    return permission.display === 'granted';
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

export const scheduleShabbatNotification = async (
  title: string,
  body: string,
  scheduledTime: Date
) => {
  if (!isNativeApp()) {
    console.log('Not a native app, skipping notification scheduling');
    return;
  }

  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        throw new Error('Notification permission not granted');
      }
    }

    const notifications: ScheduleOptions = {
      notifications: [
        {
          id: Math.floor(Math.random() * 100000),
          title,
          body,
          schedule: {
            at: scheduledTime,
            allowWhileIdle: true,
          },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: null,
        },
      ],
    };

    await LocalNotifications.schedule(notifications);
    console.log('Notification scheduled successfully');
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

export const sendImmediateNotification = async (
  title: string,
  body: string
) => {
  if (!isNativeApp()) {
    console.log('Not a native app, skipping immediate notification');
    return;
  }

  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        throw new Error('Notification permission not granted');
      }
    }

    const notifications: ScheduleOptions = {
      notifications: [
        {
          id: Math.floor(Math.random() * 100000),
          title,
          body,
          schedule: {
            at: new Date(Date.now() + 1000), // 1 second from now
            allowWhileIdle: true,
          },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: null,
        },
      ],
    };

    await LocalNotifications.schedule(notifications);
    console.log('Immediate notification sent successfully');
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    throw error;
  }
};
