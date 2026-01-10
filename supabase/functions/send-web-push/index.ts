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

interface ShabbatTimes {
  candle_lighting_time: string;
  havdalah_time: string;
  parasha: string;
  date: string;
}

async function getShabbatTimes(city: string = "Jerusalem"): Promise<ShabbatTimes | null> {
  try {
    const cityGeoIds: Record<string, string> = {
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

    const geoId = cityGeoIds[city] || "281184";
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geoId}&M=on`
    );

    if (!response.ok) return null;

    const data = await response.json();
    let candleLighting = "";
    let havdalah = "";
    let parasha = "";
    let date = "";

    for (const item of data.items || []) {
      if (item.category === "candles") {
        candleLighting = item.title?.replace("Candle lighting: ", "") || "";
        date = item.date?.split("T")[0] || "";
      } else if (item.category === "havdalah") {
        havdalah = item.title?.replace("Havdalah: ", "") || "";
      } else if (item.category === "parashat") {
        parasha = item.title || "";
      }
    }

    return {
      candle_lighting_time: candleLighting,
      havdalah_time: havdalah,
      parasha: parasha,
      date: date,
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
    // If subscription is expired or invalid, return false to clean up
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Subscription expired or invalid, should be removed');
    }
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
    
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is ok for scheduled calls
    }
    
    // Get user from auth header (for test notifications)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Test notification - send to current user only
    if (body.test && userId) {
      console.log('Sending test notification to user:', userId);
      
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error || !subscriptions?.length) {
        console.error('No subscriptions found for user:', userId);
        return new Response(
          JSON.stringify({ error: 'No push subscriptions found for user' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const payload = JSON.stringify({
        title: body.title || '🕯️ בין השמשות',
        body: body.body || 'התראה חדשה',
        icon: '/icon-512.png',
        badge: '/icon-512.png'
      });

      let sent = 0;
      for (const sub of subscriptions) {
        const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
        if (success) sent++;
      }

      console.log(`Test notifications sent: ${sent}/${subscriptions.length}`);
      return new Response(
        JSON.stringify({ success: true, sent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scheduled/bulk send - send to all users with push enabled
    console.log('Starting scheduled push notification send...');
    
    // Get all users with push enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('push_enabled', true);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    const userIds = preferences?.map(p => p.user_id) || [];
    console.log(`Found ${userIds.length} users with push enabled`);
    
    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No users with push enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get subscriptions for these users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions`);

    // Get Shabbat times for the notification
    const shabbatTimes = await getShabbatTimes();
    
    let notificationBody = body.body || body.message;
    if (!notificationBody && shabbatTimes) {
      notificationBody = `הדלקת נרות: ${shabbatTimes.candle_lighting_time} | מוצאי שבת: ${shabbatTimes.havdalah_time} | ${shabbatTimes.parasha}`;
    } else if (!notificationBody) {
      notificationBody = 'בדוק את זמני השבת באפליקציה';
    }

    const payload = JSON.stringify({
      title: body.title || '🕯️ זמני שבת',
      body: notificationBody,
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      url: '/'
    });

    let sent = 0;
    const failedEndpoints: string[] = [];
    
    for (const sub of subscriptions || []) {
      const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
      if (success) {
        sent++;
      } else {
        failedEndpoints.push(sub.endpoint);
      }
    }

    // Clean up invalid subscriptions
    if (failedEndpoints.length > 0) {
      console.log(`Cleaning up ${failedEndpoints.length} invalid subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', failedEndpoints);
    }

    console.log(`Push notifications sent: ${sent}/${subscriptions?.length || 0}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent,
        total: subscriptions?.length || 0,
        cleaned: failedEndpoints.length
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
