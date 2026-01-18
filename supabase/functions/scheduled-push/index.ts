import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APP_URL = 'https://ben-hashmashot.lovable.app';
const APP_LOGO_URL = 'https://ben-hashmashot.lovable.app/icon-512.png';

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

interface NotificationPreference {
  user_id: string;
  phone: string | null;
  email: string | null;
  morning_time: string | null;
  hours_before_shabbat: number | null;
  days_before_shabbat: number | null;
  shabbat_reminder_time: string | null;
  push_enabled: boolean | null;
  email_enabled: boolean | null;
}

interface Profile {
  id: string;
  city: string | null;
  phone: string | null;
}

interface ShabbatTimes {
  candle_lighting_time: string;
  candle_lighting_date: string;
  havdalah_time: string;
  parasha: string;
}

interface HolidayInfo {
  name: string;
  date: string;
  time?: string;
  type: 'holiday' | 'fast' | 'rosh_chodesh';
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

async function getShabbatAndHolidayTimes(city: string = "Jerusalem"): Promise<{ shabbat: ShabbatTimes | null; holidays: HolidayInfo[] }> {
  try {
    const geoId = CITY_GEO_IDS[city] || "281184";
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geoId}&M=on&lg=he`
    );

    if (!response.ok) return { shabbat: null, holidays: [] };

    const data = await response.json();
    console.log('Hebcal response:', JSON.stringify(data, null, 2));
    
    let candleLighting = "";
    let candleDate = "";
    let havdalah = "";
    let parasha = "";
    const holidays: HolidayInfo[] = [];

    for (const item of data.items || []) {
      if (item.category === "candles") {
        const timeMatch = item.title?.match(/(\d{1,2}:\d{2})/);
        candleLighting = timeMatch ? timeMatch[1] : "";
        candleDate = item.date || "";
      } else if (item.category === "havdalah") {
        const timeMatch = item.title?.match(/(\d{1,2}:\d{2})/);
        havdalah = timeMatch ? timeMatch[1] : "";
      } else if (item.category === "parashat") {
        parasha = item.hebrew || item.title || "";
      } else if (item.category === "holiday") {
        holidays.push({
          name: item.hebrew || item.title || "",
          date: item.date || "",
          type: 'holiday'
        });
      } else if (item.category === "fast") {
        const timeMatch = item.title?.match(/(\d{1,2}:\d{2})/);
        holidays.push({
          name: item.hebrew || item.title || "",
          date: item.date || "",
          time: timeMatch ? timeMatch[1] : undefined,
          type: 'fast'
        });
      } else if (item.category === "roshchodesh") {
        holidays.push({
          name: item.hebrew || item.title || "",
          date: item.date || "",
          type: 'rosh_chodesh'
        });
      }
    }

    console.log('Parsed Shabbat times:', { candleLighting, candleDate, havdalah, parasha });
    console.log('Parsed holidays:', holidays);

    return {
      shabbat: {
        candle_lighting_time: candleLighting,
        candle_lighting_date: candleDate,
        havdalah_time: havdalah,
        parasha: parasha,
      },
      holidays
    };
  } catch (error) {
    console.error("Error fetching Shabbat times:", error);
    return { shabbat: null, holidays: [] };
  }
}

// Keep backward compatibility
async function getShabbatTimes(city: string = "Jerusalem"): Promise<ShabbatTimes | null> {
  const result = await getShabbatAndHolidayTimes(city);
  return result.shabbat;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'בין השמשות <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });

    const responseText = await response.text();
    console.log('Resend response:', response.status, responseText);

    if (!response.ok) {
      console.error('Resend error:', responseText);
      return false;
    }

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error.message || error);
    return false;
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

// Check if current time is within 5 minutes of target time (HH:MM or HH:MM:SS format)
function isTimeMatch(targetTime: string, currentHour: number, currentMinute: number): boolean {
  const timeParts = targetTime.split(':');
  const targetHour = parseInt(timeParts[0], 10);
  const targetMinute = parseInt(timeParts[1] || '0', 10);
  
  // Check if we're in the same hour and minute within 5 minute window
  if (currentHour === targetHour && Math.abs(currentMinute - targetMinute) < 5) {
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
    
    const timeDiff = Math.abs(currentTime.getTime() - notificationTime.getTime());
    const fiveMinutes = 5 * 60 * 1000;
    
    return timeDiff <= fiveMinutes;
  } catch (error) {
    console.error('Error checking before Shabbat time:', error);
    return false;
  }
}

// Format holidays for message
function formatHolidays(holidays: HolidayInfo[]): string {
  if (!holidays.length) return '';
  
  const lines: string[] = [];
  for (const h of holidays) {
    if (h.type === 'holiday') {
      lines.push(`🎉 ${h.name}`);
    } else if (h.type === 'fast') {
      lines.push(`🕯️ ${h.name}${h.time ? ` - סיום: ${h.time}` : ''}`);
    } else if (h.type === 'rosh_chodesh') {
      lines.push(`🌙 ${h.name}`);
    }
  }
  return lines.join('\n');
}

// Create formatted messages with app link and logo
function createMorningMessage(shabbatTimes: ShabbatTimes | null, city: string, holidays: HolidayInfo[] = []): string {
  const holidayText = formatHolidays(holidays);
  
  if (shabbatTimes) {
    return `🕯️ *שבת שלום!* 🕯️

📖 *פרשת ${shabbatTimes.parasha}*

📅 *זמני שבת ל${city}:*
🕯️ הדלקת נרות: ${shabbatTimes.candle_lighting_time}
🌙 צאת שבת: ${shabbatTimes.havdalah_time}
${holidayText ? `\n📆 *אירועים קרובים:*\n${holidayText}` : ''}

שבת שלום ומבורך! ✨

📱 בין השמשות: ${APP_URL}`;
  }
  return `🕯️ שבת שלום! בדוק את זמני השבת באפליקציה: ${APP_URL}`;
}

function createShabbatReminderMessage(shabbatTimes: ShabbatTimes | null, city: string, hoursBeforeShabbat: number, holidays: HolidayInfo[] = []): string {
  const holidayText = formatHolidays(holidays);
  
  if (shabbatTimes) {
    return `⏰ *תזכורת: שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!*

📖 *פרשת ${shabbatTimes.parasha}*

📅 *זמני שבת ל${city}:*
🕯️ הדלקת נרות: ${shabbatTimes.candle_lighting_time}
🌙 צאת שבת: ${shabbatTimes.havdalah_time}
${holidayText ? `\n📆 *אירועים קרובים:*\n${holidayText}` : ''}

שבת שלום! 🕯️

📱 בין השמשות: ${APP_URL}`;
  }
  return `⏰ תזכורת: שבת נכנסת בעוד ${hoursBeforeShabbat} שעות! ${APP_URL}`;
}

function createEmailHtml(shabbatTimes: ShabbatTimes | null, city: string, notificationType: 'morning' | 'shabbat', hoursBeforeShabbat: number = 2, holidays: HolidayInfo[] = []): string {
  const title = notificationType === 'morning' 
    ? '🕯️ זמני שבת השבוע' 
    : `⏰ שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!`;
  
  const holidayHtml = holidays.length > 0 ? `
    <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-top: 15px;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px;">📆 אירועים קרובים:</h3>
      ${holidays.map(h => {
        const icon = h.type === 'holiday' ? '🎉' : h.type === 'fast' ? '🕯️' : '🌙';
        return `<p style="margin: 5px 0; font-size: 14px;">${icon} ${h.name}${h.time ? ` - סיום: ${h.time}` : ''}</p>`;
      }).join('')}
    </div>
  ` : '';
  
  const promoFooter = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid rgba(255,255,255,0.3);">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
        <tr>
          <td align="center">
            <img src="${APP_LOGO_URL}" alt="בין השמשות" width="80" height="80" style="border-radius: 50%; border: 3px solid rgba(255,255,255,0.5);" />
          </td>
        </tr>
      </table>
      <div style="text-align: center; color: rgba(255,255,255,0.95);">
        <h3 style="margin: 10px 0 5px 0; font-size: 18px;">✨ בין השמשות - זמני שבת וחג ✨</h3>
        <p style="margin: 5px 0; font-size: 14px; opacity: 0.9;">האפליקציה המשפחתית שלך לזמני שבת</p>
        <div style="margin: 15px 0; padding: 12px; background: rgba(255,255,255,0.15); border-radius: 8px;">
          <p style="margin: 3px 0; font-size: 13px;">📅 זמני שבת וחג מדויקים לפי המיקום שלך</p>
          <p style="margin: 3px 0; font-size: 13px;">🔔 התראות אוטומטיות במייל ו-Push</p>
          <p style="margin: 3px 0; font-size: 13px;">📖 דבר תורה שבועי מעודכן</p>
          <p style="margin: 3px 0; font-size: 13px;">💝 יומן זיכרונות משפחתי</p>
        </div>
        <a href="${APP_URL}" style="display: inline-block; padding: 10px 25px; background: rgba(255,255,255,0.25); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px;">פתח את האפליקציה 🚀</a>
      </div>
    </div>
  `;

  if (shabbatTimes) {
    return `
      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #D97706 0%, #92400E 100%); border-radius: 12px; color: white;">
        <h1 style="margin: 0 0 20px 0;">${title}</h1>
        <p style="font-size: 18px; margin-bottom: 15px; opacity: 0.95;">📖 פרשת ${shabbatTimes.parasha}</p>
        <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="font-size: 18px; margin: 5px 0;">📍 ${city}</p>
          <p style="font-size: 18px; margin: 5px 0;">🕯️ הדלקת נרות: <strong>${shabbatTimes.candle_lighting_time}</strong></p>
          <p style="font-size: 18px; margin: 5px 0;">🌙 צאת שבת: <strong>${shabbatTimes.havdalah_time}</strong></p>
        </div>
        ${holidayHtml}
        <p style="font-size: 16px; opacity: 0.9;">שבת שלום ומבורך! ✨</p>
        ${promoFooter}
      </div>
    `;
  }
  
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #D97706 0%, #92400E 100%); border-radius: 12px; color: white;">
      <h1 style="margin: 0 0 20px 0;">${title}</h1>
      <p style="font-size: 16px;">שבת שלום!</p>
      ${promoFooter}
    </div>
  `;
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

      const city = body.city || 'Jerusalem';
      const { shabbat: shabbatTimes, holidays } = await getShabbatAndHolidayTimes(city);
      
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('hours_before_shabbat')
        .eq('user_id', user.id)
        .single();
      
      const hoursBeforeShabbat = prefs?.hours_before_shabbat || 2;
      const holidayText = holidays.length > 0 ? ` | 📆 ${holidays[0].name}` : '';

      const payload = JSON.stringify({
        title: `⏰ שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!`,
        body: shabbatTimes 
          ? `🕯️ הדלקת נרות: ${shabbatTimes.candle_lighting_time} | 🌙 צאת: ${shabbatTimes.havdalah_time} | 📖 ${shabbatTimes.parasha}${holidayText}`
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

    // Handle test request for scheduled reminder
    if (body.test && body.testType === 'scheduled') {
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

      const city = body.city || 'Jerusalem';
      const { shabbat: shabbatTimes, holidays } = await getShabbatAndHolidayTimes(city);
      
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('days_before_shabbat, shabbat_reminder_time, push_enabled, email_enabled, email')
        .eq('user_id', user.id)
        .single();
      
      const daysBeforeShabbat = prefs?.days_before_shabbat ?? 0;
      const dayNames = ['באותו יום (יום שישי)', 'יום לפני (יום חמישי)', 'יומיים לפני (יום רביעי)', '3 ימים לפני (יום שלישי)'];
      const dayName = dayNames[daysBeforeShabbat] || dayNames[0];
      const reminderTime = prefs?.shabbat_reminder_time || '12:00';
      const holidayText = holidays.length > 0 ? ` | 📆 ${holidays[0].name}` : '';

      let pushSent = 0;
      let emailSent = false;

      // Send Web Push if enabled
      if (prefs?.push_enabled) {
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id);

        if (subscriptions?.length) {
          const payload = JSON.stringify({
            title: `📅 תזכורת מתוזמנת: שבת מתקרבת!`,
            body: shabbatTimes 
              ? `🕯️ הדלקת נרות: ${shabbatTimes.candle_lighting_time} | 🌙 צאת: ${shabbatTimes.havdalah_time} | 📖 ${shabbatTimes.parasha}${holidayText}`
              : `הכינו את עצמכם לשבת!`,
            icon: '/icon-512.png',
            badge: '/icon-512.png',
            url: '/'
          });

          for (const sub of subscriptions) {
            const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
            if (success) pushSent++;
          }
        }
      }

      // Send Email if enabled
      if (prefs?.email_enabled && prefs?.email) {
        const message = createShabbatReminderMessage(shabbatTimes, city, 0, holidays);
        const emailHtml = createEmailHtml(shabbatTimes, city, 'shabbat', 0, holidays);
        const subject = `📅 תזכורת מתוזמנת - זמני שבת (${dayName})`;
        emailSent = await sendEmail(prefs.email, subject, emailHtml);
      }

      await supabase.from('notification_history').insert({
        user_id: user.id,
        notification_type: 'scheduled_reminder_test',
        message: `בדיקת תזכורת מתוזמנת - ${dayName} בשעה ${reminderTime}`,
        status: 'sent'
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          pushSent, 
          emailSent,
          settings: {
            daysBeforeShabbat,
            dayName,
            reminderTime,
            pushEnabled: prefs?.push_enabled,
            emailEnabled: prefs?.email_enabled
          },
          message: 'Test scheduled reminder sent' 
        }),
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

    // Get all users with any notification method enabled (only email and push now)
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id, phone, email, morning_time, hours_before_shabbat, days_before_shabbat, shabbat_reminder_time, push_enabled, email_enabled');

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    // Filter to users with at least one notification method enabled
    const activePrefs = (preferences || []).filter(p => p.push_enabled || p.email_enabled);

    console.log(`Found ${activePrefs.length} users with notifications enabled`);

    if (!activePrefs.length) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No users with notifications enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profiles for city info
    const userIds = activePrefs.map(p => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, city, phone')
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
    let scheduledRemindersSent = 0;
    let emailNotificationsSent = 0;
    const usersToNotifyMorning: string[] = [];
    const usersToNotifyShabbat: string[] = [];
    const usersToNotifyScheduled: string[] = [];

    // Check each user's preferences
    for (const pref of activePrefs) {
      const userCity = profileMap.get(pref.user_id)?.city || 'Jerusalem';
      
      // Check morning notification time (user's chosen time)
      if (pref.morning_time) {
        const timeMatches = isTimeMatch(pref.morning_time, currentHour, currentMinute);
        console.log(`User ${pref.user_id} morning_time: ${pref.morning_time}, current: ${currentHour}:${currentMinute}, matches: ${timeMatches}`);
        if (timeMatches) {
          usersToNotifyMorning.push(pref.user_id);
        }
      }

      // Check scheduled reminder (X days before Shabbat at specific time)
      const daysBeforeShabbat = pref.days_before_shabbat ?? 0;
      const shabbatReminderTime = pref.shabbat_reminder_time || '12:00';
      
      // Calculate which day to send: Friday is day 5, so if daysBeforeShabbat=1, send on Thursday (day 4)
      const targetDay = 5 - daysBeforeShabbat; // 5=Friday, 4=Thursday, 3=Wednesday, 2=Tuesday
      
      if (currentDayOfWeek === targetDay && isTimeMatch(shabbatReminderTime, currentHour, currentMinute)) {
        console.log(`User ${pref.user_id} scheduled reminder: day ${targetDay}, time ${shabbatReminderTime}, matches!`);
        usersToNotifyScheduled.push(pref.user_id);
      }

      // Check hours before Shabbat (only on Friday) - additional reminder
      if (currentDayOfWeek === 5 && pref.hours_before_shabbat && pref.hours_before_shabbat > 0) {
        const shabbatTimes = await getShabbatTimes(userCity);
        if (shabbatTimes && isBeforeShabbat(shabbatTimes.candle_lighting_date, pref.hours_before_shabbat, now)) {
          usersToNotifyShabbat.push(pref.user_id);
        }
      }
    }

    console.log(`Users to notify (morning): ${usersToNotifyMorning.length}`);
    console.log(`Users to notify (scheduled reminder): ${usersToNotifyScheduled.length}`);
    console.log(`Users to notify (hours before Shabbat): ${usersToNotifyShabbat.length}`);

    // Create a map of preferences by user_id for quick lookup
    const prefMap = new Map(activePrefs.map(p => [p.user_id, p]));

    // Send morning notifications (at user's chosen time)
    for (const userId of usersToNotifyMorning) {
      const userPref = prefMap.get(userId);
      const userSubs = subscriptionMap.get(userId) || [];
      const userCity = profileMap.get(userId)?.city || 'Jerusalem';
      const userEmail = userPref?.email;
      const { shabbat: shabbatTimes, holidays } = await getShabbatAndHolidayTimes(userCity);
      
      const holidayText = holidays.length > 0 ? ` | 📆 ${holidays[0].name}` : '';
      
      // Web Push
      if (userPref?.push_enabled && userSubs.length > 0) {
        const payload = JSON.stringify({
          title: '🕯️ זמני שבת השבוע',
          body: shabbatTimes 
            ? `🕯️ הדלקת נרות: ${shabbatTimes.candle_lighting_time} | 🌙 צאת: ${shabbatTimes.havdalah_time} | 📖 ${shabbatTimes.parasha}${holidayText}`
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

      // Email
      if (userPref?.email_enabled && userEmail) {
        const emailHtml = createEmailHtml(shabbatTimes, userCity, 'morning', 2, holidays);
        const success = await sendEmail(userEmail, '🕯️ זמני שבת השבוע', emailHtml);
        if (success) emailNotificationsSent++;
      }
    }

    // Send scheduled reminder notifications (X days before Shabbat at specific time)
    for (const userId of usersToNotifyScheduled) {
      const userPref = prefMap.get(userId);
      const userSubs = subscriptionMap.get(userId) || [];
      const userCity = profileMap.get(userId)?.city || 'Jerusalem';
      const userEmail = userPref?.email;
      const { shabbat: shabbatTimes, holidays } = await getShabbatAndHolidayTimes(userCity);
      const daysBeforeShabbat = userPref?.days_before_shabbat ?? 0;
      
      const holidayText = holidays.length > 0 ? ` | 📆 ${holidays[0].name}` : '';
      const daysText = daysBeforeShabbat === 0 ? 'היום' : daysBeforeShabbat === 1 ? 'מחר' : `בעוד ${daysBeforeShabbat} ימים`;
      
      // Web Push
      if (userPref?.push_enabled && userSubs.length > 0) {
        const payload = JSON.stringify({
          title: `🕯️ תזכורת: שבת ${daysText}!`,
          body: shabbatTimes 
            ? `🕯️ הדלקת נרות: ${shabbatTimes.candle_lighting_time} | 🌙 צאת: ${shabbatTimes.havdalah_time} | 📖 ${shabbatTimes.parasha}${holidayText}`
            : `הכינו את עצמכם לשבת!`,
          icon: '/icon-512.png',
          badge: '/icon-512.png',
          url: '/'
        });

        for (const sub of userSubs) {
          const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
          if (success) scheduledRemindersSent++;
        }
      }

      // Email
      if (userPref?.email_enabled && userEmail) {
        const emailHtml = createEmailHtml(shabbatTimes, userCity, 'shabbat', 0, holidays);
        const success = await sendEmail(userEmail, `🕯️ תזכורת: שבת ${daysText}!`, emailHtml);
        if (success) emailNotificationsSent++;
      }
    }

    // Send Shabbat reminder notifications (X hours before Shabbat on Friday)
    for (const userId of usersToNotifyShabbat) {
      const userPref = prefMap.get(userId);
      const userSubs = subscriptionMap.get(userId) || [];
      const userCity = profileMap.get(userId)?.city || 'Jerusalem';
      const userEmail = userPref?.email;
      const { shabbat: shabbatTimes, holidays } = await getShabbatAndHolidayTimes(userCity);
      const hoursBeforeShabbat = userPref?.hours_before_shabbat || 2;
      
      const holidayText = holidays.length > 0 ? ` | 📆 ${holidays[0].name}` : '';
      
      // Web Push
      if (userPref?.push_enabled && userSubs.length > 0) {
        const payload = JSON.stringify({
          title: `⏰ שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!`,
          body: shabbatTimes 
            ? `🕯️ הדלקת נרות: ${shabbatTimes.candle_lighting_time} | 🌙 צאת: ${shabbatTimes.havdalah_time} | 📖 ${shabbatTimes.parasha}${holidayText}`
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

      // Email
      if (userPref?.email_enabled && userEmail) {
        const emailHtml = createEmailHtml(shabbatTimes, userCity, 'shabbat', hoursBeforeShabbat, holidays);
        const success = await sendEmail(userEmail, `⏰ שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!`, emailHtml);
        if (success) emailNotificationsSent++;
      }
    }

    // Log to notification history
    const historyEntries: Array<{user_id: string, notification_type: string, message: string, status: string}> = [];
    
    for (const userId of usersToNotifyMorning) {
      const userPref = prefMap.get(userId);
      if (userPref?.push_enabled) {
        historyEntries.push({
          user_id: userId,
          notification_type: 'web_push_morning',
          message: 'התראת בוקר - זמני שבת',
          status: 'sent'
        });
      }
      if (userPref?.email_enabled) {
        historyEntries.push({
          user_id: userId,
          notification_type: 'email_morning',
          message: 'אימייל בוקר - זמני שבת',
          status: 'sent'
        });
      }
    }

    for (const userId of usersToNotifyScheduled) {
      const userPref = prefMap.get(userId);
      if (userPref?.push_enabled) {
        historyEntries.push({
          user_id: userId,
          notification_type: 'web_push_scheduled',
          message: 'תזכורת מתוזמנת לשבת',
          status: 'sent'
        });
      }
      if (userPref?.email_enabled) {
        historyEntries.push({
          user_id: userId,
          notification_type: 'email_scheduled',
          message: 'אימייל תזכורת מתוזמנת לשבת',
          status: 'sent'
        });
      }
    }
    
    for (const userId of usersToNotifyShabbat) {
      const userPref = prefMap.get(userId);
      if (userPref?.push_enabled) {
        historyEntries.push({
          user_id: userId,
          notification_type: 'web_push_shabbat',
          message: 'התראה לפני שבת',
          status: 'sent'
        });
      }
      if (userPref?.email_enabled) {
        historyEntries.push({
          user_id: userId,
          notification_type: 'email_shabbat',
          message: 'אימייל לפני שבת',
          status: 'sent'
        });
      }
    }

    if (historyEntries.length > 0) {
      await supabase.from('notification_history').insert(historyEntries);
    }

    console.log(`Notifications sent - Morning: ${morningNotificationsSent}, Scheduled: ${scheduledRemindersSent}, Before Shabbat: ${shabbatNotificationsSent}, Email: ${emailNotificationsSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        morning_sent: morningNotificationsSent,
        scheduled_sent: scheduledRemindersSent,
        shabbat_sent: shabbatNotificationsSent,
        email_sent: emailNotificationsSent,
        total: morningNotificationsSent + scheduledRemindersSent + shabbatNotificationsSent + emailNotificationsSent
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
