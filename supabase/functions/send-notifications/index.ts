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
  havdalah: string;
  date: string;
}

const getShabbatTimes = async (location: string = "Jerusalem"): Promise<ShabbatTimes | null> => {
  try {
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=281184&M=on&lg=he`
    );
    const data = await response.json();
    
    const candleLighting = data.items?.find((item: any) => item.category === 'candles');
    const havdalah = data.items?.find((item: any) => item.category === 'havdalah');
    
    if (!candleLighting || !havdalah) return null;
    
    return {
      candle_lighting: candleLighting.date,
      havdalah: havdalah.date,
      date: candleLighting.hebrew
    };
  } catch (error) {
    console.error('Error fetching Shabbat times:', error);
    return null;
  }
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
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
      console.error('Resend error:', await response.text());
      return false;
    }

    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendSMS = async (to: string, message: string) => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromPhone = Deno.env.get('TWILIO_PHONE_FROM');

  if (!accountSid || !authToken || !fromPhone) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
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
      console.error('Twilio error:', await response.text());
      return false;
    }

    console.log(`SMS sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

const sendWhatsApp = async (to: string, message: string) => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromWhatsApp = Deno.env.get('TWILIO_WHATSAPP_FROM');

  if (!accountSid || !authToken || !fromWhatsApp) {
    console.error('Twilio WhatsApp credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: `whatsapp:${to}`,
          From: `whatsapp:${fromWhatsApp}`,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      console.error('Twilio WhatsApp error:', await response.text());
      return false;
    }

    console.log(`WhatsApp sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return false;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Check if we should send notifications (Friday before Shabbat)
    const now = new Date();
    const candleLightingTime = new Date(shabbatTimes.candle_lighting);
    const isFriday = now.getDay() === 5;
    
    let notificationsSent = 0;

    for (const pref of preferences || []) {
      const notificationTime = new Date(candleLightingTime);
      notificationTime.setHours(notificationTime.getHours() - pref.hours_before_shabbat);

      // Check if it's time to send notifications
      const shouldSend = isFriday && now >= notificationTime && now < candleLightingTime;

      if (shouldSend) {
        const message = `שבת שלום! זמן הדלקת נרות: ${new Date(shabbatTimes.candle_lighting).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}, ${shabbatTimes.date}`;
        const emailHtml = `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #4A5568;">שבת שלום!</h1>
            <p style="font-size: 16px;">זמן הדלקת נרות: <strong>${new Date(shabbatTimes.candle_lighting).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</strong></p>
            <p style="font-size: 16px;">מוצאי שבת: <strong>${new Date(shabbatTimes.havdalah).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</strong></p>
            <p style="font-size: 14px; color: #718096;">${shabbatTimes.date}</p>
          </div>
        `;

        // Send email if enabled
        if (pref.email_enabled && pref.email) {
          await sendEmail(pref.email, 'זמני שבת', emailHtml);
          notificationsSent++;
        }

        // Send SMS if enabled
        if (pref.sms_enabled && pref.phone) {
          await sendSMS(pref.phone, message);
          notificationsSent++;
        }

        // Send WhatsApp if enabled
        if (pref.whatsapp_enabled && pref.phone) {
          await sendWhatsApp(pref.phone, message);
          notificationsSent++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notifications processed',
        shabbatTimes,
        notificationsSent,
        totalPreferences: preferences?.length || 0 
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
