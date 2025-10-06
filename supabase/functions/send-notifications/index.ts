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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active notification preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*');

    if (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }

    console.log(`Found ${preferences?.length || 0} notification preferences`);

    // Here you would implement the logic to:
    // 1. Calculate if today is Friday or holiday eve
    // 2. Get Shabbat/holiday times
    // 3. Send notifications based on user preferences
    // 4. Use external services (Twilio for SMS, SendGrid for email, etc.)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notifications processed',
        count: preferences?.length || 0 
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
