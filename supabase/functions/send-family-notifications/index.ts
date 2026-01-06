import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string;
  notify_email: boolean;
  notify_whatsapp: boolean;
  auto_send_shabbat_times: boolean;
}

interface ShabbatTimes {
  candle_lighting_time: string;
  havdalah_time: string;
  date: string;
  parasha: string;
}

// Extract time from Hebcal title (e.g., "הַדְלָקַת נֵרוֹת: 15:54" -> "15:54")
const extractTimeFromTitle = (title: string): string => {
  const match = title.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : '';
};

const getCityGeoId = (cityName: string): string => {
  const cities: Record<string, string> = {
    "Jerusalem": "281184", "ירושלים": "281184",
    "Tel Aviv": "293397", "תל אביב": "293397",
    "Haifa": "294801", "חיפה": "294801",
    "Beersheba": "295530", "באר שבע": "295530",
    "Netanya": "293100", "נתניה": "293100",
    "Bnei Brak": "295432", "בני ברק": "295432",
    "Ramat Gan": "293703", "רמת גן": "293703",
    "Ashdod": "295629", "אשדוד": "295629",
    "Petah Tikva": "293918", "פתח תקווה": "293918",
    "Eilat": "295277", "אילת": "295277",
  };
  return cities[cityName] || "281184";
};

const getShabbatTimes = async (city: string = "Jerusalem"): Promise<ShabbatTimes | null> => {
  try {
    const geoId = getCityGeoId(city);
    const response = await fetch(
      `https://www.hebcal.com/shabbat?cfg=json&geonameid=${geoId}&M=on&lg=he`
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
    const formattedDate = hebrewDateFormatter.format(candleDate);
    
    return {
      candle_lighting_time: candleTime,
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

const sendWhatsApp = async (to: string, message: string) => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromWhatsApp = Deno.env.get('TWILIO_WHATSAPP_FROM');

  if (!accountSid || !authToken || !fromWhatsApp) {
    throw new Error('Twilio WhatsApp credentials not configured');
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
        To: `whatsapp:${to}`,
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

  console.log(`WhatsApp sent to ${to}`);
};

const APP_LOGO_URL = 'https://bein-hashmashut.lovable.app/icon-512.png';
const APP_URL = 'https://bein-hashmashut.lovable.app';

const getEmailHtml = (memberName: string, times: ShabbatTimes, senderName: string) => `
  <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #D97706 0%, #92400E 100%); border-radius: 12px; color: white;">
    <h1 style="margin: 0 0 20px 0;">🕯️ שבת שלום ${memberName}!</h1>
    <p style="font-size: 14px; opacity: 0.9; margin-bottom: 20px;">
      ${senderName} שולח/ת לך את זמני השבת הקרובה ❤️
    </p>
    <div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <p style="font-size: 18px; margin: 5px 0;">📅 כניסת שבת: <strong>${times.date} בשעה ${times.candle_lighting_time}</strong></p>
      <p style="font-size: 18px; margin: 5px 0;">🕯️ הדלקת נרות: <strong>${times.candle_lighting_time}</strong></p>
      <p style="font-size: 18px; margin: 5px 0;">🌙 מוצאי שבת: <strong>${times.havdalah_time}</strong></p>
    </div>
    <p style="font-size: 16px; opacity: 0.9;">📖 ${times.parasha}</p>
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 20px 0;" />
    <div style="text-align: center;">
      <img src="${APP_LOGO_URL}" alt="בין השמשות" width="60" height="60" style="border-radius: 50%; border: 2px solid rgba(255,255,255,0.5);" />
      <p style="font-size: 13px; margin-top: 10px;">נשלח באמצעות אפליקציית <strong>בין השמשות</strong></p>
      <a href="${APP_URL}" style="display: inline-block; padding: 8px 20px; background: rgba(255,255,255,0.25); color: white; text-decoration: none; border-radius: 20px; font-size: 12px; margin-top: 5px;">הצטרפו גם אתם</a>
    </div>
  </div>
`;

const getWhatsAppMessage = (memberName: string, times: ShabbatTimes, senderName: string) =>
  `🕯️ שבת שלום ${memberName}!

${senderName} שולח/ת לך את זמני השבת ❤️

📅 כניסת שבת: ${times.date}
🕯️ הדלקת נרות: ${times.candle_lighting_time}
🌙 מוצאי שבת: ${times.havdalah_time}
📖 ${times.parasha}

שבת שלום ומבורך! ✨

---
נשלח מאפליקציית בין השמשות
${APP_URL}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let senderName = 'משפחה';

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;

      // Get user's name
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .single();
        if (profile?.full_name) {
          senderName = profile.full_name;
        }
      }
    }

    // Manual send to specific family member
    if (body.memberId && userId) {
      const { data: member, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', body.memberId)
        .eq('user_id', userId)
        .single();

      if (error || !member) {
        return new Response(
          JSON.stringify({ error: 'Family member not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const times = await getShabbatTimes(member.city || 'Jerusalem');
      if (!times) {
        return new Response(
          JSON.stringify({ error: 'Could not fetch Shabbat times' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const results = { email: false, whatsapp: false };

      if (member.notify_email && member.email) {
        try {
          await sendEmail(
            member.email,
            `זמני שבת - ${times.parasha}`,
            getEmailHtml(member.name, times, senderName)
          );
          results.email = true;
        } catch (e) {
          console.error('Email failed:', e);
        }
      }

      if (member.notify_whatsapp && member.phone) {
        try {
          await sendWhatsApp(member.phone, getWhatsAppMessage(member.name, times, senderName));
          results.whatsapp = true;
        } catch (e) {
          console.error('WhatsApp failed:', e);
        }
      }

      return new Response(
        JSON.stringify({ success: true, results, member: member.name }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Automatic Friday sending - get all family members with auto_send enabled
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*, profiles:user_id(full_name)')
      .eq('auto_send_shabbat_times', true);

    if (membersError) {
      throw membersError;
    }

    console.log(`Found ${members?.length || 0} family members with auto_send enabled`);

    let sent = 0;
    let failed = 0;

    for (const member of members || []) {
      const times = await getShabbatTimes(member.city || 'Jerusalem');
      if (!times) continue;

      const memberSenderName = member.profiles?.full_name || 'משפחה';

      if (member.notify_email && member.email) {
        try {
          await sendEmail(
            member.email,
            `זמני שבת - ${times.parasha}`,
            getEmailHtml(member.name, times, memberSenderName)
          );
          sent++;
        } catch (e) {
          console.error(`Email failed for ${member.name}:`, e);
          failed++;
        }
      }

      if (member.notify_whatsapp && member.phone) {
        try {
          await sendWhatsApp(member.phone, getWhatsAppMessage(member.name, times, memberSenderName));
          sent++;
        } catch (e) {
          console.error(`WhatsApp failed for ${member.name}:`, e);
          failed++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, totalMembers: members?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-family-notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
