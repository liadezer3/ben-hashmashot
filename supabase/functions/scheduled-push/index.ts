import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const APP_URL = 'https://ben-hashmashot.lovable.app';
const APP_LOGO_URL = 'https://ben-hashmashot.lovable.app/icon-512.png';

interface PushSubscription {
  id: string;
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
  sms_enabled: boolean | null;
  whatsapp_enabled: boolean | null;
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

interface ChannelResult {
  success: boolean;
  error: string | null;
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

// ========== EMAIL ==========
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend error:', errorText);
      return false;
    }

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error.message || error);
    return false;
  }
}

// ========== WHATSAPP (Meta Cloud API) ==========
async function sendWhatsApp(to: string, message: string): Promise<ChannelResult> {
  try {
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !accessToken) {
      const error = 'Meta WhatsApp credentials not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN)';
      console.log(error);
      return { success: false, error };
    }

    let formattedPhone = to.replace(/[\s\-\+]/g, '');
    // Ensure phone starts with country code (no leading +)
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '972' + formattedPhone.substring(1);
    }

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: message }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      const error = `Meta WhatsApp error (${response.status}): ${errorData}`;
      console.error(error);
      return { success: false, error };
    }

    console.log(`WhatsApp sent successfully to ${to} via Meta API`);
    return { success: true, error: null };
  } catch (error: any) {
    const errorMessage = `Error sending WhatsApp: ${error?.message || error}`;
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ========== WEB PUSH ==========
function base64UrlEncode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

async function createVapidJwt(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ token: string; publicKey: string }> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: 'mailto:notifications@benhashmashot.app'
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
    y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
    d: base64UrlEncode(privateKeyBytes)
  };

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBytes = new Uint8Array(signature);
  const signatureB64 = base64UrlEncode(signatureBytes);

  return {
    token: `${unsignedToken}.${signatureB64}`,
    publicKey: vapidPublicKey
  };
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(ikm),
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      info: toArrayBuffer(info)
    },
    keyMaterial,
    length * 8
  );

  return new Uint8Array(bits);
}

function createInfo(type: string, context: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(`Content-Encoding: ${type}\0`);
  const result = new Uint8Array(typeBytes.length + 1 + context.length);
  result.set(typeBytes);
  result[typeBytes.length] = 0;
  if (context.length > 0) {
    result.set(context, typeBytes.length + 1);
  }
  return result;
}

async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const payloadBytes = new TextEncoder().encode(payload);
  const userPublicKeyBytes = base64UrlDecode(p256dh);
  const authSecret = base64UrlDecode(auth);
  
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);
  
  const userPublicKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(userPublicKeyBytes),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: userPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);
  
  const context = new Uint8Array(1 + 2 + 65 + 2 + 65);
  context[0] = 0;
  context[1] = 0; context[2] = 65;
  context.set(userPublicKeyBytes, 3);
  context[68] = 0; context[69] = 65;
  context.set(localPublicKey, 70);
  
  const ikm = await hkdf(authSecret, sharedSecret, new TextEncoder().encode('Content-Encoding: auth\0'), 32);
  
  const cekInfo = createInfo('aes128gcm', context);
  const nonceInfo = createInfo('nonce', context);
  
  const cek = await hkdf(salt, ikm, cekInfo, 16);
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);
  
  const aesKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(cek),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const paddingLength = 2;
  const paddedPayload = new Uint8Array(payloadBytes.length + paddingLength);
  paddedPayload[0] = (paddingLength >> 8) & 0xff;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payloadBytes, paddingLength);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(nonce) },
    aesKey,
    paddedPayload
  );
  
  return {
    encrypted: new Uint8Array(encryptedBuffer),
    salt,
    localPublicKey
  };
}

async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    console.log(`Sending push to: ${subscription.endpoint.substring(0, 60)}...`);
    
    const vapid = await createVapidJwt(subscription.endpoint, vapidPublicKey, vapidPrivateKey);
    
    const { encrypted, salt, localPublicKey } = await encryptPayload(
      payload,
      subscription.p256dh,
      subscription.auth
    );
    
    const recordSize = 4096;
    const header = new Uint8Array(86);
    header.set(salt, 0);
    header[16] = (recordSize >> 24) & 0xff;
    header[17] = (recordSize >> 16) & 0xff;
    header[18] = (recordSize >> 8) & 0xff;
    header[19] = recordSize & 0xff;
    header[20] = 65;
    header.set(localPublicKey, 21);
    
    const body = new Uint8Array(header.length + encrypted.length);
    body.set(header);
    body.set(encrypted, header.length);
    
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Authorization': `vapid t=${vapid.token}, k=${vapid.publicKey}`,
        'Content-Length': body.length.toString()
      },
      body: body
    });

    if (response.ok || response.status === 201) {
      console.log('Push notification sent successfully');
      return true;
    }
    
    const errorText = await response.text();
    console.error(`Push failed with status ${response.status}: ${errorText}`);
    return false;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// ========== TIME AND DATE MATCHING ==========
function isTimeMatch(targetTime: string, currentHour: number, currentMinute: number): boolean {
  const timeParts = targetTime.split(':');
  const targetHour = parseInt(timeParts[0], 10);
  const targetMinute = parseInt(timeParts[1] || '0', 10);
  
  if (currentHour === targetHour && Math.abs(currentMinute - targetMinute) < 5) {
    return true;
  }
  return false;
}

// Check if today is Friday or the day before a Jewish holiday
function isFridayOrHolidayEve(currentDayOfWeek: number, holidays: HolidayInfo[], currentDate: Date): { isFriday: boolean; isHolidayEve: boolean; holidayName: string | null } {
  const isFriday = currentDayOfWeek === 5; // Friday
  
  // Check if today is the day before a holiday (holiday eve)
  const tomorrow = new Date(currentDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  let isHolidayEve = false;
  let holidayName: string | null = null;
  
  for (const holiday of holidays) {
    const holidayDate = holiday.date.split('T')[0];
    if (holidayDate === tomorrowStr && holiday.type === 'holiday') {
      isHolidayEve = true;
      holidayName = holiday.name;
      break;
    }
  }
  
  return { isFriday, isHolidayEve, holidayName };
}

// Calculate the target notification day based on days_before_shabbat setting
function getNotificationTargetDay(daysBeforeShabbat: number): number {
  // Friday is day 5, so if days_before_shabbat is 0, target is 5 (Friday)
  // If days_before_shabbat is 1, target is 4 (Thursday), etc.
  return 5 - daysBeforeShabbat;
}

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

// ========== MESSAGE FORMATTING ==========
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

function createSMSMessage(shabbatTimes: ShabbatTimes | null, city: string): string {
  if (shabbatTimes) {
    return `שבת שלום! פרשת ${shabbatTimes.parasha} - הדלקת נרות: ${shabbatTimes.candle_lighting_time}, צאת שבת: ${shabbatTimes.havdalah_time}. ${APP_URL}`;
  }
  return `שבת שלום! בדוק זמני שבת: ${APP_URL}`;
}

function createWhatsAppMessage(shabbatTimes: ShabbatTimes | null, city: string, holidays: HolidayInfo[] = []): string {
  const holidayText = formatHolidays(holidays);
  
  if (shabbatTimes) {
    return `🕯️ *שבת שלום!* 🕯️\n\n📖 *פרשת ${shabbatTimes.parasha}*\n\n📅 *זמני שבת ל${city}:*\n🕯️ הדלקת נרות: ${shabbatTimes.candle_lighting_time}\n🌙 צאת שבת: ${shabbatTimes.havdalah_time}\n${holidayText ? `\n📆 *אירועים קרובים:*\n${holidayText}` : ''}\n\nשבת שלום ומבורך! ✨\n\n📱 ${APP_URL}`;
  }
  return `🕯️ שבת שלום! בדוק את זמני השבת: ${APP_URL}`;
}

function createPushPayload(shabbatTimes: ShabbatTimes | null, city: string, notificationType: 'morning' | 'shabbat', hoursBeforeShabbat: number = 2): string {
  if (notificationType === 'morning') {
    return JSON.stringify({
      title: `🕯️ פרשת ${shabbatTimes?.parasha || 'השבוע'}`,
      body: shabbatTimes 
        ? `הדלקת נרות: ${shabbatTimes.candle_lighting_time} | הבדלה: ${shabbatTimes.havdalah_time}`
        : 'בדוק את זמני השבת באפליקציה',
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      data: { url: APP_URL }
    });
  }
  
  return JSON.stringify({
    title: `⏰ שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!`,
    body: shabbatTimes 
      ? `הדלקת נרות: ${shabbatTimes.candle_lighting_time} | ${city}`
      : 'בדוק את זמני השבת',
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    data: { url: APP_URL }
  });
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

// ========== MAIN HANDLER ==========
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - that's fine for scheduled calls
    }

    console.log('Request body:', JSON.stringify(body));

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

      const city = body.city || 'Jerusalem';
      const { shabbat: shabbatTimes, holidays } = await getShabbatAndHolidayTimes(city);
      
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('hours_before_shabbat, email, email_enabled, push_enabled, sms_enabled, whatsapp_enabled, phone')
        .eq('user_id', user.id)
        .single();
      
      const hoursBeforeShabbat = prefs?.hours_before_shabbat || 2;
      let emailSent = false;
      let pushSent = 0;
      let smsSent = false;
      let whatsappSent = false;
      let smsError: string | null = null;
      let whatsappError: string | null = null;
      
      // Send test email if enabled
      if (prefs?.email_enabled && prefs?.email) {
        const emailHtml = createEmailHtml(shabbatTimes, city, 'shabbat', hoursBeforeShabbat, holidays);
        const subject = `⏰ בדיקה - שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!`;
        emailSent = await sendEmail(prefs.email, subject, emailHtml);
      }

      // Send test push if enabled
      if (prefs?.push_enabled && vapidPublicKey && vapidPrivateKey) {
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id);
        
        if (subscriptions?.length) {
          const payload = createPushPayload(shabbatTimes, city, 'shabbat', hoursBeforeShabbat);
          for (const sub of subscriptions) {
            const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
            if (success) pushSent++;
          }
        }
      }

      // Send test SMS if enabled
      if (prefs?.sms_enabled && prefs?.phone) {
        const message = createSMSMessage(shabbatTimes, city);
        const smsResult = await sendSMS(prefs.phone, message);
        smsSent = smsResult.success;
        smsError = smsResult.error;
      }

      // Send test WhatsApp if enabled
      if (prefs?.whatsapp_enabled && prefs?.phone) {
        const message = createWhatsAppMessage(shabbatTimes, city, holidays);
        const whatsappResult = await sendWhatsApp(prefs.phone, message);
        whatsappSent = whatsappResult.success;
        whatsappError = whatsappResult.error;
      }

      await supabase.from('notification_history').insert({
        user_id: user.id,
        notification_type: 'shabbat_reminder_test',
        message: `התראת שבת - בדיקה | Email: ${emailSent} | Push: ${pushSent} | SMS: ${smsSent}${smsError ? ` (${smsError.slice(0, 120)})` : ''} | WhatsApp: ${whatsappSent}${whatsappError ? ` (${whatsappError.slice(0, 120)})` : ''}`,
        status: (emailSent || pushSent > 0 || smsSent || whatsappSent) ? 'sent' : 'failed'
      });

      return new Response(
        JSON.stringify({ success: true, emailSent, pushSent, smsSent, whatsappSent, smsError, whatsappError, message: 'Test Shabbat notification sent' }),
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
        .select('days_before_shabbat, shabbat_reminder_time, push_enabled, email_enabled, email, sms_enabled, whatsapp_enabled, phone')
        .eq('user_id', user.id)
        .single();
      
      const daysBeforeShabbat = prefs?.days_before_shabbat ?? 0;
      const dayNames = ['באותו יום (יום שישי)', 'יום לפני (יום חמישי)', 'יומיים לפני (יום רביעי)', '3 ימים לפני (יום שלישי)'];
      const dayName = dayNames[daysBeforeShabbat] || dayNames[0];
      const reminderTime = prefs?.shabbat_reminder_time || '12:00';

      let emailSent = false;
      let pushSent = 0;
      let smsSent = false;
      let whatsappSent = false;
      let smsError: string | null = null;
      let whatsappError: string | null = null;

      // Send Email if enabled
      if (prefs?.email_enabled && prefs?.email) {
        const emailHtml = createEmailHtml(shabbatTimes, city, 'morning', 0, holidays);
        const subject = `📅 בדיקת תזכורת מתוזמנת - זמני שבת`;
        emailSent = await sendEmail(prefs.email, subject, emailHtml);
      }

      // Send Push if enabled
      if (prefs?.push_enabled && vapidPublicKey && vapidPrivateKey) {
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id);
        
        if (subscriptions?.length) {
          const payload = createPushPayload(shabbatTimes, city, 'morning');
          for (const sub of subscriptions) {
            const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
            if (success) pushSent++;
          }
        }
      }

      // Send SMS if enabled
      if (prefs?.sms_enabled && prefs?.phone) {
        const message = createSMSMessage(shabbatTimes, city);
        const smsResult = await sendSMS(prefs.phone, message);
        smsSent = smsResult.success;
        smsError = smsResult.error;
      }

      // Send WhatsApp if enabled
      if (prefs?.whatsapp_enabled && prefs?.phone) {
        const message = createWhatsAppMessage(shabbatTimes, city, holidays);
        const whatsappResult = await sendWhatsApp(prefs.phone, message);
        whatsappSent = whatsappResult.success;
        whatsappError = whatsappResult.error;
      }

      await supabase.from('notification_history').insert({
        user_id: user.id,
        notification_type: 'scheduled_reminder_test',
        message: `בדיקת תזכורת מתוזמנת - ${dayName} בשעה ${reminderTime} | Email: ${emailSent} | Push: ${pushSent} | SMS: ${smsSent}${smsError ? ` (${smsError.slice(0, 120)})` : ''} | WhatsApp: ${whatsappSent}${whatsappError ? ` (${whatsappError.slice(0, 120)})` : ''}`,
        status: (emailSent || pushSent > 0 || smsSent || whatsappSent) ? 'sent' : 'failed'
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent,
          pushSent,
          smsSent,
          whatsappSent,
          smsError,
          whatsappError,
          settings: {
            daysBeforeShabbat,
            dayName,
            reminderTime,
            emailEnabled: prefs?.email_enabled,
            pushEnabled: prefs?.push_enabled,
            smsEnabled: prefs?.sms_enabled,
            whatsappEnabled: prefs?.whatsapp_enabled
          },
          message: 'Test scheduled reminder sent' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ========== AUTOMATED SCHEDULED NOTIFICATIONS ==========
    const now = new Date();
    const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    const currentHour = israelTime.getHours();
    const currentMinute = israelTime.getMinutes();
    const currentDayOfWeek = israelTime.getDay();
    
    console.log(`Running scheduled push check at ${israelTime.toISOString()}`);
    console.log(`Israel time: ${currentHour}:${currentMinute.toString().padStart(2, '0')}, Day: ${currentDayOfWeek}`);

    // Fetch upcoming holidays for date detection (using Jerusalem as default)
    const { holidays: upcomingHolidays } = await getShabbatAndHolidayTimes('Jerusalem');
    const { isFriday, isHolidayEve, holidayName } = isFridayOrHolidayEve(currentDayOfWeek, upcomingHolidays, israelTime);
    
    console.log(`Date check - Is Friday: ${isFriday}, Is Holiday Eve: ${isHolidayEve}${holidayName ? ` (${holidayName})` : ''}`);

    // Get all users with any notification enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id, phone, email, morning_time, hours_before_shabbat, days_before_shabbat, shabbat_reminder_time, push_enabled, email_enabled, sms_enabled, whatsapp_enabled');

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    // Filter to users with at least one notification channel enabled
    const activePrefs = (preferences || []).filter(p => 
      p.email_enabled || p.push_enabled || p.sms_enabled || p.whatsapp_enabled
    );

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

    // Get push subscriptions for all users with push enabled
    const pushEnabledUserIds = activePrefs.filter(p => p.push_enabled).map(p => p.user_id);
    const { data: allSubscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', pushEnabledUserIds);

    const subscriptionMap = new Map<string, PushSubscription[]>();
    for (const sub of allSubscriptions || []) {
      const existing = subscriptionMap.get(sub.user_id) || [];
      existing.push(sub);
      subscriptionMap.set(sub.user_id, existing);
    }

    let totalEmailsSent = 0;
    let totalPushSent = 0;
    let totalSMSSent = 0;
    let totalWhatsAppSent = 0;
    
    const usersToNotifyMorning: string[] = [];
    const usersToNotifyShabbat: string[] = [];
    const usersToNotifyScheduled: string[] = [];

    // Check each user's preferences
    for (const pref of activePrefs) {
      const userCity = profileMap.get(pref.user_id)?.city || 'Jerusalem';
      const userPhone = pref.phone || profileMap.get(pref.user_id)?.phone;
      
      // Calculate target day for this user
      const daysBeforeShabbat = pref.days_before_shabbat ?? 0;
      const targetDay = getNotificationTargetDay(daysBeforeShabbat);
      const isRelevantDay = currentDayOfWeek === targetDay || isHolidayEve;

      // Check morning notification time — ONLY on relevant days (target day or holiday eve)
      if (pref.morning_time && isRelevantDay) {
        const timeMatches = isTimeMatch(pref.morning_time, currentHour, currentMinute);
        if (timeMatches) {
          usersToNotifyMorning.push(pref.user_id);
        }
      }

      // Check scheduled reminder (X days before Shabbat/holiday at specific time)
      const shabbatReminderTime = pref.shabbat_reminder_time || '12:00';
      
      if (isRelevantDay) {
        const timeMatches = isTimeMatch(shabbatReminderTime, currentHour, currentMinute);
        if (timeMatches) {
          usersToNotifyScheduled.push(pref.user_id);
          console.log(`User ${pref.user_id} scheduled for notification (Day: ${currentDayOfWeek}, Holiday Eve: ${isHolidayEve})`);
        }
      }

      // Check hours before Shabbat/holiday notification (on Friday OR holiday eve)
      if ((isFriday || isHolidayEve) && pref.hours_before_shabbat && pref.hours_before_shabbat > 0) {
        const { shabbat } = await getShabbatAndHolidayTimes(userCity);
        if (shabbat?.candle_lighting_date) {
          const shouldNotify = isBeforeShabbat(
            shabbat.candle_lighting_date,
            pref.hours_before_shabbat,
            israelTime
          );
          if (shouldNotify) {
            usersToNotifyShabbat.push(pref.user_id);
          }
        }
      }
    }

    console.log(`Users to notify - Morning: ${usersToNotifyMorning.length}, Shabbat: ${usersToNotifyShabbat.length}, Scheduled: ${usersToNotifyScheduled.length}`);

    // Helper function to send to all channels
    async function sendToAllChannels(
      userId: string,
      pref: NotificationPreference,
      shabbatTimes: ShabbatTimes | null,
      holidays: HolidayInfo[],
      notificationType: 'morning' | 'shabbat',
      hoursBeforeShabbat: number = 2
    ) {
      const userCity = profileMap.get(userId)?.city || 'Jerusalem';
      const userPhone = pref.phone || profileMap.get(userId)?.phone;
      let emailSent = false;
      let pushSent = 0;
      let smsSent = false;
      let whatsappSent = false;
      let smsError: string | null = null;
      let whatsappError: string | null = null;

      // Email
      if (pref.email_enabled && pref.email) {
        const emailHtml = createEmailHtml(shabbatTimes, userCity, notificationType, hoursBeforeShabbat, holidays);
        const subject = notificationType === 'morning' 
          ? `🕯️ זמני שבת השבוע - פרשת ${shabbatTimes?.parasha || 'השבוע'}`
          : `⏰ שבת נכנסת בעוד ${hoursBeforeShabbat} שעות!`;
        
        emailSent = await sendEmail(pref.email, subject, emailHtml);
        if (emailSent) totalEmailsSent++;
      }

      // Web Push
      if (pref.push_enabled && vapidPublicKey && vapidPrivateKey) {
        const subscriptions = subscriptionMap.get(userId) || [];
        if (subscriptions.length > 0) {
          const payload = createPushPayload(shabbatTimes, userCity, notificationType, hoursBeforeShabbat);
          for (const sub of subscriptions) {
            const success = await sendWebPush(sub, payload, vapidPublicKey, vapidPrivateKey);
            if (success) {
              pushSent++;
              totalPushSent++;
            }
          }
        }
      }

      // SMS
      if (pref.sms_enabled && userPhone) {
        const message = createSMSMessage(shabbatTimes, userCity);
        const smsResult = await sendSMS(userPhone, message);
        smsSent = smsResult.success;
        smsError = smsResult.error;
        if (smsSent) totalSMSSent++;
      }

      // WhatsApp
      if (pref.whatsapp_enabled && userPhone) {
        const message = createWhatsAppMessage(shabbatTimes, userCity, holidays);
        const whatsappResult = await sendWhatsApp(userPhone, message);
        whatsappSent = whatsappResult.success;
        whatsappError = whatsappResult.error;
        if (whatsappSent) totalWhatsAppSent++;
      }

      const attemptedAnyChannel =
        Boolean(pref.email_enabled && pref.email) ||
        Boolean(pref.push_enabled) ||
        Boolean(pref.sms_enabled && userPhone) ||
        Boolean(pref.whatsapp_enabled && userPhone);

      if (attemptedAnyChannel) {
        const smsErrorSuffix = smsError ? ` (${smsError.slice(0, 120)})` : '';
        const whatsappErrorSuffix = whatsappError ? ` (${whatsappError.slice(0, 120)})` : '';

        await supabase.from('notification_history').insert({
          user_id: userId,
          notification_type: `${notificationType}_auto`,
          message: `Email: ${emailSent} | Push: ${pushSent} | SMS: ${smsSent}${smsErrorSuffix} | WhatsApp: ${whatsappSent}${whatsappErrorSuffix}`,
          status: (emailSent || pushSent > 0 || smsSent || whatsappSent) ? 'sent' : 'failed'
        });
      }
    }

    // Send morning notifications
    for (const userId of usersToNotifyMorning) {
      const pref = activePrefs.find(p => p.user_id === userId);
      if (!pref) continue;
      
      const userCity = profileMap.get(userId)?.city || 'Jerusalem';
      const { shabbat, holidays } = await getShabbatAndHolidayTimes(userCity);
      
      await sendToAllChannels(userId, pref as NotificationPreference, shabbat, holidays, 'morning');
    }

    // Send scheduled reminder notifications
    for (const userId of usersToNotifyScheduled) {
      const pref = activePrefs.find(p => p.user_id === userId);
      if (!pref) continue;
      
      const userCity = profileMap.get(userId)?.city || 'Jerusalem';
      const { shabbat, holidays } = await getShabbatAndHolidayTimes(userCity);
      
      await sendToAllChannels(userId, pref as NotificationPreference, shabbat, holidays, 'morning');
    }

    // Send hours-before-Shabbat notifications
    for (const userId of usersToNotifyShabbat) {
      const pref = activePrefs.find(p => p.user_id === userId);
      if (!pref) continue;
      
      const userCity = profileMap.get(userId)?.city || 'Jerusalem';
      const { shabbat, holidays } = await getShabbatAndHolidayTimes(userCity);
      const hoursBeforeShabbat = pref.hours_before_shabbat || 2;
      
      await sendToAllChannels(userId, pref as NotificationPreference, shabbat, holidays, 'shabbat', hoursBeforeShabbat);
    }

    const totalSent = totalEmailsSent + totalPushSent + totalSMSSent + totalWhatsAppSent;
    console.log(`Total sent: ${totalSent} (Email: ${totalEmailsSent}, Push: ${totalPushSent}, SMS: ${totalSMSSent}, WhatsApp: ${totalWhatsAppSent})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: totalSent,
        breakdown: {
          email: totalEmailsSent,
          push: totalPushSent,
          sms: totalSMSSent,
          whatsapp: totalWhatsAppSent
        },
        usersNotified: {
          morning: usersToNotifyMorning.length,
          scheduled: usersToNotifyScheduled.length,
          shabbat: usersToNotifyShabbat.length
        },
        message: `Sent ${totalSent} notifications`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in scheduled-push:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
