import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPreference {
  user_id: string;
  phone: string | null;
  email: string | null;
  sms_enabled: boolean;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  push_enabled: boolean;
  morning_time: string;
  hours_before_shabbat: number;
}

interface ShabbatTimes {
  candle_lighting: string;
  candle_lighting_time: string;
  havdalah: string;
  havdalah_time: string;
  date: string;
  parasha: string;
}

// Extract time from Hebcal title (e.g., "הַדְלָקַת נֵרוֹת: 15:54" -> "15:54")
const extractTimeFromTitle = (title: string): string => {
  const match = title.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : '';
};

const getShabbatTimes = async (location: string = "Jerusalem"): Promise<ShabbatTimes | null> => {
  try {
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=281184&M=on&lg=he`
    );
    const data = await response.json();
    
    console.log('Hebcal API response:', JSON.stringify(data, null, 2));
    
    const candleLighting = data.items?.find((item: any) => item.category === 'candles');
    const havdalah = data.items?.find((item: any) => item.category === 'havdalah');
    const parasha = data.items?.find((item: any) => item.category === 'parashat');
    
    if (!candleLighting || !havdalah) return null;
    
    // Extract times directly from titles which are already formatted correctly
    const candleTime = extractTimeFromTitle(candleLighting.title);
    const havdalahTime = extractTimeFromTitle(havdalah.title);
    
    console.log('Extracted candle time:', candleTime);
    console.log('Extracted havdalah time:', havdalahTime);
    
    // Format the Shabbat entry date (e.g., "יום שישי, 6 בדצמבר")
    const candleDate = new Date(candleLighting.date);
    const hebrewDateFormatter = new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const formattedDate = hebrewDateFormatter.format(candleDate);
    
    return {
      candle_lighting: candleLighting.date,
      candle_lighting_time: candleTime,
      havdalah: havdalah.date,
      havdalah_time: havdalahTime,
      date: formattedDate,
      parasha: parasha?.hebrew || ''
    };
  } catch (error) {
    console.error('Error fetching Shabbat times:', error);
    return null;
  }
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'זמני שבת <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('Resend error:', text);
    throw new Error(`RESEND_ERROR: ${text || response.status}`);
  }

  console.log(`Email sent to ${to}`);
};

const sendSMS = async (to: string, message: string) => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromPhone = Deno.env.get('TWILIO_PHONE_FROM');

  if (!accountSid || !authToken || !fromPhone) {
    throw new Error('Twilio SMS credentials not configured');
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromPhone,
        Body: message,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('Twilio SMS error:', text);
    throw new Error(`TWILIO_SMS_ERROR: ${text || response.status}`);
  }

  console.log(`SMS sent to ${to}`);
};

const sendWhatsApp = async (to: string, message: string) => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromWhatsApp = Deno.env.get('TWILIO_WHATSAPP_FROM');

  if (!accountSid || !authToken || !fromWhatsApp) {
    console.log('Twilio WhatsApp credentials not configured - skipping WhatsApp');
    return;
  }

  // Format phone number for WhatsApp (needs whatsapp: prefix)
  const cleanPhone = to.replace(/[\s\-]/g, '');
  const formattedTo = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `whatsapp:${formattedTo}`,
        From: `whatsapp:${fromWhatsApp}`,
        Body: message,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error('Twilio WhatsApp error:', text);
    throw new Error(`TWILIO_WHATSAPP_ERROR: ${text || response.status}`);
  }

  console.log(`WhatsApp sent to ${formattedTo}`);
};

// Logo URL for email branding
const APP_LOGO_URL = 'https://bein-hashmashut.lovable.app/icon-512.png';
const APP_URL = 'https://bein-hashmashut.lovable.app';

// Promotional footer for emails
const getEmailPromoFooter = () => `
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
        <p style="margin: 3px 0; font-size: 13px;">📅 זמני שבת מדויקים לפי המיקום שלך</p>
        <p style="margin: 3px 0; font-size: 13px;">🔔 התראות אוטומטיות במייל, SMS ווואטסאפ</p>
        <p style="margin: 3px 0; font-size: 13px;">📖 דבר תורה שבועי מעודכן</p>
        <p style="margin: 3px 0; font-size: 13px;">💝 יומן זיכרונות משפחתי</p>
      </div>
      <a href="${APP_URL}" style="display: inline-block; padding: 10px 25px; background: rgba(255,255,255,0.25); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px;">הצטרפו עכשיו 🚀</a>
    </div>
  </div>
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Handle test email request
    if (body.testEmail && body.email) {
      console.log('Sending test email to:', body.email);

      // Fetch real Shabbat times for test email
      const shabbatTimes = await getShabbatTimes();

      const testEmailHtml = shabbatTimes ? `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #D97706 0%, #92400E 100%); border-radius: 12px; color: white;">
          <h1 style="margin: 0 0 20px 0;">🕯️ מייל בדיקה - זמני שבת</h1>
          <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-size: 18px; margin: 5px 0;">📅 כניסת שבת: <strong>${shabbatTimes.date} בשעה ${shabbatTimes.candle_lighting_time}</strong></p>
            <p style="font-size: 18px; margin: 5px 0;">🕯️ הדלקת נרות: <strong>${shabbatTimes.candle_lighting_time}</strong></p>
            <p style="font-size: 18px; margin: 5px 0;">🌙 מוצאי שבת: <strong>${shabbatTimes.havdalah_time}</strong></p>
          </div>
          <p style="font-size: 16px; opacity: 0.9;">📖 ${shabbatTimes.parasha}</p>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 20px 0;" />
          <p style="font-size: 12px; opacity: 0.7;">זו הודעת בדיקה - המערכת מוגדרת כראוי ✅</p>
          ${getEmailPromoFooter()}
        </div>
      ` : `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: #f7fafc; border-radius: 8px;">
          <h1 style="color: #2D3748;">🕯️ מייל בדיקה - זמני שבת</h1>
          <p style="font-size: 16px; color: #4A5568;">מייל הבדיקה נשלח בהצלחה!</p>
          <p style="font-size: 14px; color: #718096;">המערכת מוגדרת כראוי ותשלח לך התראות על זמני שבת וחג.</p>
        </div>
      `;

      await sendEmail(body.email, 'בדיקת התראות - זמני שבת', testEmailHtml);

      return new Response(
        JSON.stringify({ success: true, message: 'Test email sent', shabbatTimes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle test WhatsApp request
    if (body.testWhatsApp && body.phone) {
      console.log('Sending test WhatsApp to:', body.phone);

      // Fetch real Shabbat times for test
      const shabbatTimes = await getShabbatTimes();
      console.log('Shabbat times for WhatsApp test:', shabbatTimes);

      // Format a more complete message with all details
      const testMessage = shabbatTimes
        ? `🕯️ *שבת שלום!* 🕯️\n\n📖 *פרשת ${shabbatTimes.parasha}*\n\n📅 *זמני שבת:*\n🕯️ הדלקת נרות: ${shabbatTimes.candle_lighting_time}\n🌙 צאת שבת: ${shabbatTimes.havdalah_time}\n\n✅ הודעת בדיקה - המערכת מוגדרת כראוי!`
        : `🕯️ הודעת בדיקה - זמני שבת\n\nהמערכת מוגדרת כראוי!`;

      console.log('WhatsApp test message:', testMessage);

      // Check if Twilio credentials are configured
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const fromWhatsApp = Deno.env.get('TWILIO_WHATSAPP_FROM');

      if (!accountSid || !authToken || !fromWhatsApp) {
        console.log('Twilio WhatsApp credentials missing:', { 
          hasAccountSid: !!accountSid, 
          hasAuthToken: !!authToken, 
          hasFromWhatsApp: !!fromWhatsApp 
        });
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'WhatsApp credentials not configured - using fallback', 
            whatsappSent: false,
            shabbatTimes 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        await sendWhatsApp(body.phone, testMessage);
        return new Response(
          JSON.stringify({ success: true, message: 'Test WhatsApp sent', whatsappSent: true, shabbatTimes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (whatsappError: any) {
        console.error('WhatsApp test failed:', whatsappError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: whatsappError.message || 'WhatsApp sending failed', 
            whatsappSent: false,
            error: whatsappError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle test SMS request
    if (body.testSMS && body.phone) {
      console.log('Sending test SMS to:', body.phone);

      // Fetch real Shabbat times for test
      const shabbatTimes = await getShabbatTimes();
      console.log('Shabbat times for SMS test:', shabbatTimes);

      const APP_URL_SMS = 'https://bein-hashmashut.lovable.app';
      
      // Format SMS message (shorter than WhatsApp)
      const testMessage = shabbatTimes
        ? `שבת שלום! 🕯️ פרשת ${shabbatTimes.parasha} | הדלקת נרות: ${shabbatTimes.candle_lighting_time} | צאת שבת: ${shabbatTimes.havdalah_time} | ${APP_URL_SMS}`
        : `שבת שלום! בדוק זמני שבת באפליקציה: ${APP_URL_SMS}`;

      console.log('SMS test message:', testMessage);

      // Check if Twilio credentials are configured
      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const fromPhone = Deno.env.get('TWILIO_PHONE_FROM');

      if (!accountSid || !authToken || !fromPhone) {
        console.log('Twilio SMS credentials missing:', { 
          hasAccountSid: !!accountSid, 
          hasAuthToken: !!authToken, 
          hasFromPhone: !!fromPhone 
        });
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'SMS credentials not configured', 
            smsSent: false 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        await sendSMS(body.phone, testMessage);
        return new Response(
          JSON.stringify({ success: true, message: 'Test SMS sent', smsSent: true, shabbatTimes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (smsError: any) {
        console.error('SMS test failed:', smsError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: smsError.message || 'SMS sending failed', 
            smsSent: false,
            error: smsError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Shabbat times
    const shabbatTimes = await getShabbatTimes();
    if (!shabbatTimes) {
      throw new Error('Could not fetch Shabbat times');
    }

    console.log('Shabbat times:', shabbatTimes);

    // Get all active notification preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*');

    if (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }

    console.log(`Found ${preferences?.length || 0} notification preferences`);

    // Scheduling mode
    const timing = typeof body?.timing === 'string' ? body.timing : undefined; // 'morning' | 'afternoon' | undefined

    // Check if we should send notifications (Friday before Shabbat)
    const now = new Date();
    const candleLightingTime = new Date(shabbatTimes.candle_lighting);
    const isFriday = now.getDay() === 5;

    const jerusalemClock = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jerusalem',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);

    let notificationsSent = 0;
    let notificationsAttempted = 0;

    for (const pref of preferences || []) {
      const notificationTime = new Date(candleLightingTime);
      notificationTime.setHours(notificationTime.getHours() - pref.hours_before_shabbat);

      // Default behavior: only send in the "hours_before_shabbat" window
      const shouldSendWindow = isFriday && now >= notificationTime && now < candleLightingTime;

      // Cron-triggered modes:
      // - morning: send only when user's morning_time matches Jerusalem clock
      // - afternoon: send once for everyone on Friday (acts as "before Shabbat" batch)
      const shouldSendMorning = timing === 'morning' && isFriday && !!pref.morning_time && jerusalemClock === pref.morning_time;
      const shouldSendAfternoon = timing === 'afternoon' && isFriday;

      const shouldSend = shouldSendMorning || shouldSendAfternoon || shouldSendWindow;

      if (!shouldSend) {
        continue;
      }

      const message = `שבת שלום! 🕯️ כניסת שבת: ${shabbatTimes.date} בשעה ${shabbatTimes.candle_lighting_time} | מוצ"ש: ${shabbatTimes.havdalah_time} | ${shabbatTimes.parasha}`;
      const emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #D97706 0%, #92400E 100%); border-radius: 12px; color: white;">
          <h1 style="margin: 0 0 20px 0;">🕯️ שבת שלום!</h1>
          <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-size: 18px; margin: 5px 0;">📅 כניסת שבת: <strong>${shabbatTimes.date} בשעה ${shabbatTimes.candle_lighting_time}</strong></p>
            <p style="font-size: 18px; margin: 5px 0;">🕯️ הדלקת נרות: <strong>${shabbatTimes.candle_lighting_time}</strong></p>
            <p style="font-size: 18px; margin: 5px 0;">🌙 מוצאי שבת: <strong>${shabbatTimes.havdalah_time}</strong></p>
          </div>
          <p style="font-size: 16px; opacity: 0.9;">📖 ${shabbatTimes.parasha}</p>
          ${getEmailPromoFooter()}
        </div>
      `;

      // Send email if enabled
      if (pref.email_enabled && pref.email) {
        notificationsAttempted++;
        try {
          await sendEmail(pref.email, 'זמני שבת', emailHtml);
          notificationsSent++;
        } catch (e) {
          console.error(`Email failed for ${pref.email}:`, e);
        }
      }

      // Send SMS if enabled
      if (pref.sms_enabled && pref.phone) {
        notificationsAttempted++;
        try {
          await sendSMS(pref.phone, message);
          notificationsSent++;
        } catch (e) {
          console.error(`SMS failed for ${pref.phone}:`, e);
        }
      }

      // Send WhatsApp if enabled
      if (pref.whatsapp_enabled && pref.phone) {
        notificationsAttempted++;
        try {
          await sendWhatsApp(pref.phone, message);
          notificationsSent++;
        } catch (e) {
          console.error(`WhatsApp failed for ${pref.phone}:`, e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications processed',
        timing: timing || 'window',
        jerusalemClock,
        shabbatTimes,
        notificationsAttempted,
        notificationsSent,
        totalPreferences: preferences?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

