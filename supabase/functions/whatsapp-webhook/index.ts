import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const REPLY_TEXT = "שלום! הבוט של בין השמשות חי וקיבל את ההודעה שלך 🤖";

async function sendWhatsAppReply(to: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneNumberId) {
    console.warn("WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured — skipping reply");
    return;
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: REPLY_TEXT },
    }),
  });
  if (!res.ok) {
    console.error(`WhatsApp reply failed [${res.status}]: ${await res.text()}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Meta webhook verification (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expectedToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token && token === expectedToken && challenge) {
      console.log("WhatsApp webhook verified successfully");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn("WhatsApp webhook verification failed", { mode, token });
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // Incoming WhatsApp messages (POST)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("Incoming WhatsApp webhook:", JSON.stringify(body, null, 2));

      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry ?? []) {
          for (const change of entry.changes ?? []) {
            for (const message of change.value?.messages ?? []) {
              const from = message.from;
              const text = message.text?.body;
              if (!from || !text) continue;
              await sendWhatsAppReply(String(from));
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: "received" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Failed to handle WhatsApp webhook:", err);
      return new Response(JSON.stringify({ status: "received" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: corsHeaders,
  });
});
