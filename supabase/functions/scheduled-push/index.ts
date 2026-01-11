import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

interface NotificationPreference {
  user_id: string;
  morning_time: string | null;
  hours_before_shabbat: number | null;
  push_enabled: boolean | null;
}

interface Profile {
  id: string;
  city: string | null;
}

interface ShabbatTimes {
  candle_lighting_time: string;
  candle_lighting_date: string;
  havdalah_time: string;
  parasha: string;
}

// City to GeoID mapping
const CITY_GEO_IDS: Record<string, string> = {
  "Jerusalem": "281184",
  "ירושלים": "281184",
  "Tel Aviv": "293397",
  "תל אביב": "293397",
  "Haifa": "294801",
  "חיפה": "294801",
  "Beer Sheva": "295530",
  "באר שבע": "295530",
  "Netanya": "294098",
  "נתניה": "294098",
  "Ashdod": "295629",
  "אשדוד": "295629",
  "Bnei Brak": "295514",
  "בני ברק": "295514",
  "Petah Tikva": "293918",
  "פתח תקווה": "293918",
  "Ramat Gan": "293788",
  "רמת גן": "293788",
};

async function getShabbatTimes(city: string = "Jerusalem"): Promise<ShabbatTimes | null> {
  try {
    const geoId = CITY_GEO_IDS[city] || "281184";
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geoId}&M=on`
    );

    if (!response.ok) return null;

    const data = await response.json();
    let candleLighting = "";
    let candleDate = "";
    let havdalah = "";
    let parasha = "";

    for (const item of data.items || []) {
      if (item.category === "candles") {
        candleLighting = item.title?.replace("Candle lighting: ", "") || "";
        candleDate = item.date || "";
      } else if (item.category === "havdalah") {
        havdalah = item.title?.replace("Havdalah: ", "") || "";
      } else if (item.category === "parashat") {
        parasha = item.title || "";
      }
    }

    return {
      candle_lighting_time: candleLighting,
      candle_lighting_date: candleDate,
      havdalah_time: havdalah,
      parasha: parasha,
    };
  } catch (error) {
    console.error("Error fetching Shabbat times:", error);
    return null;
  }
}

async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    webpush.setVapidDetails(
      'mailto:notifications@benhashmashot.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    await webpush.sendNotification(pushSubscription, payload);
    console.log(`Push sent to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
    return true;
  } catch (error: any) {
    console.error('Error sending push:', error.message || error);
    return false;
  }
}

// Check if current time is within 5 minutes of target time
function isTimeMatch(targetTime: string, currentHour: number, currentMinute: number): boolean {
  const [targetHour, targetMinute] = targetTime.split(':').map(Number);
  
  // Check if we're in the same hour and within 5 minute window of :00
  if (currentHour === targetHour && currentMinute >= 0 && currentMinute < 5) {
    return true;
  }
  return false;
}

// Check if current time is X hours before Shabbat candle lighting
function isBeforeShabbat(
  candleLightingDate: string,
  hoursBeforeShabbat: number,
  currentTime: Date
): boolean {
  try {
    const candleTime = new Date(candleLightingDate);
    const notificationTime = new Date(candleTime.getTime() - (hoursBeforeShabbat * 60 * 60 * 1000));
    
    // Check if we're within 5 minutes of the notification time
    const timeDiff = Math.abs(currentTime.getTime() - notificationTime.getTime());
    const fiveMinutes = 5 * 60 * 1000;
    
    return timeDiff <= fiveMinutes;
  } catch (error) {
    console.error('Error checking before Shabbat time:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if this is a test request
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - that's fine for scheduled calls
    }

    // Handle test request for Shabbat notification
    if (body.test && body.testType === 'shabbat') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization header required for test' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user's push subscription
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (!subscriptions?.length) {
        return new Response(
          JSON.stringify({ error: 'No push subscription found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get Shabbat times for user's city
      const city = body.city || 'Jerusalem';
      const shabbatTimes = await getShabbatTimes(city);
      
      // Get user's hours_before_shabbat setting
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('hours_before_shabbat')
        .eq('user_id', user.id)
        .single();
      
      const hoursBeforeShabbat = prefs?.hours_before_shabbat || 2;

      const payload = JSON.stringify({
        title: `⏰ שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!`,
        body: shabbatTimes 
          ? `הדלקת נרות: ${shabbatTimes.candle_lighting_time} ב${city} | ${shabbatTimes.parasha}`
          : `הכינו את עצמכם לשבת!`,
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        url: '/'
      });

      let sent = 0;
      for (const sub of subscriptions) {
        const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
        if (success) sent++;
      }

      // Log to notification history
      await supabase.from('notification_history').insert({
        user_id: user.id,
        notification_type: 'web_push_shabbat_test',
        message: 'התראת שבת - בדיקה',
        status: 'sent'
      });

      return new Response(
        JSON.stringify({ success: true, sent, message: 'Test Shabbat notification sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get current time in Israel timezone
    const now = new Date();
    const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    const currentHour = israelTime.getHours();
    const currentMinute = israelTime.getMinutes();
    const currentDayOfWeek = israelTime.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    
    console.log(`Running scheduled push check at ${israelTime.toISOString()}`);
    console.log(`Israel time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}, Day: ${currentDayOfWeek}`);

    // Get all users with push enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id, morning_time, hours_before_shabbat, push_enabled')
      .eq('push_enabled', true);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    console.log(`Found ${preferences?.length || 0} users with push enabled`);

    if (!preferences?.length) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No users with push enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profiles for city info
    const userIds = preferences.map(p => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, city')
      .in('id', userIds);

    const profileMap = new Map<string, Profile>();
    for (const profile of profiles || []) {
      profileMap.set(profile.id, profile);
    }

    // Get subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    const subscriptionMap = new Map<string, PushSubscription[]>();
    for (const sub of subscriptions || []) {
      if (!subscriptionMap.has(sub.user_id)) {
        subscriptionMap.set(sub.user_id, []);
      }
      subscriptionMap.get(sub.user_id)!.push(sub);
    }

    let morningNotificationsSent = 0;
    let shabbatNotificationsSent = 0;
    const usersToNotifyMorning: string[] = [];
    const usersToNotifyShabbat: string[] = [];

    // Check each user's preferences
    for (const pref of preferences) {
      const userCity = profileMap.get(pref.user_id)?.city || 'Jerusalem';
      
      // Check morning notification time
      if (pref.morning_time && isTimeMatch(pref.morning_time, currentHour, currentMinute)) {
        usersToNotifyMorning.push(pref.user_id);
      }

      // Check hours before Shabbat (only on Friday)
      if (currentDayOfWeek === 5 && pref.hours_before_shabbat) {
        const shabbatTimes = await getShabbatTimes(userCity);
        if (shabbatTimes && isBeforeShabbat(shabbatTimes.candle_lighting_date, pref.hours_before_shabbat, now)) {
          usersToNotifyShabbat.push(pref.user_id);
        }
      }
    }

    console.log(`Users to notify (morning): ${usersToNotifyMorning.length}`);
    console.log(`Users to notify (before Shabbat): ${usersToNotifyShabbat.length}`);

    // Send morning notifications
    for (const userId of usersToNotifyMorning) {
      const userSubs = subscriptionMap.get(userId) || [];
      const userCity = profileMap.get(userId)?.city || 'Jerusalem';
      const shabbatTimes = await getShabbatTimes(userCity);
      
      const payload = JSON.stringify({
        title: '🕯️ זמני שבת השבוע',
        body: shabbatTimes 
          ? `הדלקת נרות: ${shabbatTimes.candle_lighting_time} | מוצאי שבת: ${shabbatTimes.havdalah_time} | ${shabbatTimes.parasha}`
          : 'בדוק את זמני השבת באפליקציה',
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        url: '/'
      });

      for (const sub of userSubs) {
        const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
        if (success) morningNotificationsSent++;
      }
    }

    // Send Shabbat reminder notifications
    for (const userId of usersToNotifyShabbat) {
      const userSubs = subscriptionMap.get(userId) || [];
      const userCity = profileMap.get(userId)?.city || 'Jerusalem';
      const shabbatTimes = await getShabbatTimes(userCity);
      const hoursBeforeShabbat = preferences.find(p => p.user_id === userId)?.hours_before_shabbat || 2;
      
      const payload = JSON.stringify({
        title: `⏰ שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!`,
        body: shabbatTimes 
          ? `הדלקת נרות: ${shabbatTimes.candle_lighting_time} ב${userCity}`
          : `הכינו את עצמכם לשבת!`,
        icon: '/icon-512.png',
        badge: '/icon-512.png',
        url: '/'
      });

      for (const sub of userSubs) {
        const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
        if (success) shabbatNotificationsSent++;
      }
    }

    // Log to notification history
    const historyEntries = [
      ...usersToNotifyMorning.map(userId => ({
        user_id: userId,
        notification_type: 'web_push_morning',
        message: 'התראת בוקר - זמני שבת',
        status: 'sent'
      })),
      ...usersToNotifyShabbat.map(userId => ({
        user_id: userId,
        notification_type: 'web_push_shabbat',
        message: 'התראה לפני שבת',
        status: 'sent'
      }))
    ];

    if (historyEntries.length > 0) {
      await supabase.from('notification_history').insert(historyEntries);
    }

    console.log(`Notifications sent - Morning: ${morningNotificationsSent}, Shabbat: ${shabbatNotificationsSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        morning_sent: morningNotificationsSent,
        shabbat_sent: shabbatNotificationsSent,
        total: morningNotificationsSent + shabbatNotificationsSent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
