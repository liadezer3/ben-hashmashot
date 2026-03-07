import { supabase } from "@/integrations/supabase/client";

// Check if Web Push is supported
export const isWebPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
};

// Get notification permission status
export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Request notification permission
export const requestWebPushPermission = async (): Promise<boolean> => {
  if (!isWebPushSupported()) {
    console.log('Web Push not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Register Service Worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Convert URL-safe base64 to Uint8Array (for VAPID key)
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

// Subscribe to Web Push
export const subscribeToWebPush = async (vapidPublicKey: string): Promise<PushSubscription | null> => {
  try {
    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Service Worker registration failed');
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await (registration as any).pushManager.getSubscription();
    
    if (subscription) {
      console.log('Existing subscription found');
      return subscription;
    }

    // Create new subscription
    subscription = await (registration as any).pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('New subscription created:', subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
};

// Save subscription to database
export const saveSubscriptionToDatabase = async (subscription: PushSubscription): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not logged in');
    return false;
  }

  const subscriptionJson = subscription.toJSON();
  
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscriptionJson.keys?.p256dh || '',
        auth: subscriptionJson.keys?.auth || ''
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('Failed to save subscription:', error);
      return false;
    }

    console.log('Subscription saved to database');
    return true;
  } catch (error) {
    console.error('Error saving subscription:', error);
    return false;
  }
};

// Unsubscribe from Web Push
export const unsubscribeFromWebPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await (registration as any).pushManager.getSubscription();
    
    if (subscription) {
      // Delete from database first
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      // Unsubscribe
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
    }

    return true;
  } catch (error) {
    console.error('Failed to unsubscribe:', error);
    return false;
  }
};

// Check if user is subscribed
export const checkWebPushSubscription = async (): Promise<boolean> => {
  if (!isWebPushSupported()) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await (registration as any).pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
};

// Send test notification using edge function
export const sendTestWebPushNotification = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('send-web-push', {
      body: {
        test: true,
        title: '🕯️ בדיקת התראה',
        body: 'התראות Web Push פועלות כראוי!'
      }
    });

    if (error) {
      const edgeError = error as any;
      const payload = await edgeError?.context?.json?.().catch(() => null);
      throw new Error(payload?.error || error.message || 'שגיאה בשליחת התראת Push');
    }

    return true;
  } catch (error) {
    console.error('Failed to send test notification:', error);
    throw error;
  }
};
