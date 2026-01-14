import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShabbatTimes {
  candle_lighting: string;
  candle_lighting_time: string;
  havdalah: string;
  havdalah_time: string;
  date: string;
  parasha: string;
}

const extractTimeFromTitle = (title: string): string => {
  const match = title.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : '';
};

const getShabbatTimes = async (): Promise<ShabbatTimes | null> => {
  try {
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=281184&M=on&lg=he`
    );
    const data = await response.json();
    
    const candleLighting = data.items?.find((item: any) => item.category === 'candles');
    const havdalah = data.items?.find((item: any) => item.category === 'havdalah');
    const parasha = data.items?.find((item: any) => item.category === 'parashat');
    
    if (!candleLighting || !havdalah) return null;
    
    const candleTime = extractTimeFromTitle(candleLighting.title);
    const havdalahTime = extractTimeFromTitle(havdalah.title);
    
    const candleDate = new Date(candleLighting.date);
    const hebrewDateFormatter = new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    
    return {
      candle_lighting: candleLighting.date,
      candle_lighting_time: candleTime,
      havdalah: havdalah.date,
      havdalah_time: havdalahTime,
      date: hebrewDateFormatter.format(candleDate),
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
      from: 'בין השמשות <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`RESEND_ERROR: ${text || response.status}`);
  }
};

const APP_LOGO_URL = 'https://ben-hashmashot.lovable.app/icon-512.png';
const APP_URL = 'https://ben-hashmashot.lovable.app';

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
      <a href="${APP_URL}" style="display: inline-block; padding: 10px 25px; background: rgba(255,255,255,0.25); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px;">פתח את האפליקציה 🚀</a>
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
      const shabbatTimes = await getShabbatTimes();

      const testEmailHtml = shabbatTimes ? `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #D97706 0%, #92400E 100%); border-radius: 12px; color: white;">
          <h1 style="margin: 0 0 20px 0;">🕯️ מייל בדיקה - זמני שבת</h1>
          <p style="font-size: 18px; margin-bottom: 15px; opacity: 0.95;">📖 פרשת ${shabbatTimes.parasha}</p>
          <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <p style="font-size: 18px; margin: 5px 0;">🕯️ הדלקת נרות: <strong>${shabbatTimes.candle_lighting_time}</strong></p>
            <p style="font-size: 18px; margin: 5px 0;">🌙 צאת שבת: <strong>${shabbatTimes.havdalah_time}</strong></p>
          </div>
          <p style="font-size: 12px; opacity: 0.7;">זו הודעת בדיקה ✅</p>
          ${getEmailPromoFooter()}
        </div>
      ` : `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: #f7fafc; border-radius: 8px;">
          <h1 style="color: #2D3748;">🕯️ מייל בדיקה</h1>
          <p>המערכת מוגדרת כראוי!</p>
        </div>
      `;

      await sendEmail(body.email, '🕯️ בדיקת התראות - בין השמשות', testEmailHtml);

      return new Response(
        JSON.stringify({ success: true, emailSent: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // WhatsApp and SMS are now handled via wa.me links on the client side (FREE!)
    if (body.testWhatsApp || body.testSMS) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'WhatsApp and SMS are now handled via free wa.me links on the client side',
          useClientSide: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Use scheduled-push for automated notifications' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
