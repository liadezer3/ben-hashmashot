import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_OBSERVANCE = ["religious", "traditional", "secular"];
const VALID_PRESET = ["strict", "standard", "lenient", "custom"];
const VALID_LANGUAGE = ["he", "en"];

function validateLocation(loc: unknown): string | null {
  if (loc === null || loc === undefined) return null;
  if (typeof loc !== "object" || Array.isArray(loc)) return "location must be an object";
  const l = loc as Record<string, unknown>;
  if (typeof l.lat !== "number" || typeof l.lon !== "number" || typeof l.tz !== "string")
    return "location must contain numeric lat, lon and string tz";
  if (l.lat < -90 || l.lat > 90) return "lat must be between -90 and 90";
  if (l.lon < -180 || l.lon > 180) return "lon must be between -180 and 180";
  return null;
}

function validateCustomOffsets(offsets: unknown): string | null {
  if (offsets === null || offsets === undefined) return null;
  if (typeof offsets !== "object" || Array.isArray(offsets)) return "custom_offsets must be an object";
  const o = offsets as Record<string, unknown>;
  for (const key of ["candleLightingMinutesBefore", "shkiahOffset", "tzeitOffset"]) {
    if (typeof o[key] !== "number" || !Number.isInteger(o[key])) return `${key} must be an integer`;
  }
  return null;
}

function validateChannels(ch: unknown): string | null {
  if (ch === null || ch === undefined) return null;
  if (typeof ch !== "object" || Array.isArray(ch)) return "channels must be an object";
  const c = ch as Record<string, unknown>;
  for (const key of ["sms", "email", "whatsapp", "push"]) {
    if (key in c && typeof c[key] !== "boolean") return `channels.${key} must be boolean`;
  }
  return null;
}

function validateUpdate(body: Record<string, unknown>): string | null {
  if (body.observance_level && !VALID_OBSERVANCE.includes(body.observance_level as string))
    return `observance_level must be one of: ${VALID_OBSERVANCE.join(", ")}`;
  if (body.language && !VALID_LANGUAGE.includes(body.language as string))
    return `language must be one of: ${VALID_LANGUAGE.join(", ")}`;
  if (body.zmanim_preset && !VALID_PRESET.includes(body.zmanim_preset as string))
    return `zmanim_preset must be one of: ${VALID_PRESET.join(", ")}`;
  if (body.zmanim_preset === "custom" && !body.custom_offsets)
    return "custom_offsets is required when zmanim_preset is 'custom'";
  if (body.minhag !== undefined && body.minhag !== null && typeof body.minhag !== "string")
    return "minhag must be a string";
  if (body.minhag && (body.minhag as string).length > 200)
    return "minhag must be 200 characters or less";
  if (body.timezone && typeof body.timezone !== "string")
    return "timezone must be a string";
  if (body.silent_during_shabbat !== undefined && typeof body.silent_during_shabbat !== "boolean")
    return "silent_during_shabbat must be boolean";

  let err = validateLocation(body.location);
  if (err) return err;
  err = validateCustomOffsets(body.custom_offsets);
  if (err) return err;
  err = validateChannels(body.channels);
  if (err) return err;
  err = validateChannels(body.verified_channels);
  if (err) return err;

  if (body.multiple_locations !== undefined) {
    if (!Array.isArray(body.multiple_locations)) return "multiple_locations must be an array";
    for (const loc of body.multiple_locations as unknown[]) {
      const locErr = validateLocation(loc);
      if (locErr) return `multiple_locations item: ${locErr}`;
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET — read preferences (auto-create if missing)
    if (req.method === "GET") {
      let { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("user_preferences")
          .insert({ user_id: user.id })
          .select()
          .single();
        if (insertError) throw insertError;
        data = newData;
      }
      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT — update preferences
    if (req.method === "PUT") {
      const body = await req.json();
      
      // Remove fields that shouldn't be updated directly
      delete body.id;
      delete body.user_id;
      delete body.created_at;
      delete body.updated_at;

      const validationError = validateUpdate(body);
      if (validationError) {
        return new Response(JSON.stringify({ error: validationError }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert: create if not exists, update if exists
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert({ ...body, user_id: user.id }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("user-preferences error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
