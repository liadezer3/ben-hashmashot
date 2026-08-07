import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  getShabbatTimes,
  getDailyHalachicTimes,
  getParshaAndHolidays,
  getSefariaDaily,
  getAppInfo,
  getMyData,
  getMyNotificationSettings,
  getUserCity,
} from "../_shared/bot/knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const WHATSAPP_ACCESS_TOKEN =
  Deno.env.get("WHATSAPP_ACCESS_TOKEN") || Deno.env.get("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

type Channel = "telegram" | "whatsapp";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// ---------- webhook secret (telegram) ----------
async function deriveTelegramSecret(token: string): Promise<string> {
  const data = new TextEncoder().encode(`bot-webhook:${token}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------- outbound ----------
async function sendTelegram(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`telegram send failed [${res.status}]: ${body}`);
    // retry without markdown (broken entities are the usual cause)
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }
}

async function sendWhatsApp(to: string, text: string) {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WhatsApp Cloud API not configured");
  }
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
  );
  if (!res.ok) console.error(`whatsapp send failed [${res.status}]: ${await res.text()}`);
}

async function reply(channel: Channel, externalId: string, text: string) {
  if (channel === "telegram") await sendTelegram(externalId, text);
  else await sendWhatsApp(externalId, text);
}

// ---------- conversation history ----------
async function loadHistory(channel: Channel, externalId: string) {
  const { data } = await supabase
    .from("bot_conversations")
    .select("role, content")
    .eq("channel", channel)
    .eq("external_id", externalId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).reverse().map((m: any) => ({ role: m.role, content: m.content }));
}

async function saveMessage(
  channel: Channel,
  externalId: string,
  userId: string | null,
  role: "user" | "assistant",
  content: string,
) {
  const { error } = await supabase
    .from("bot_conversations")
    .insert({ channel, external_id: externalId, user_id: userId, role, content });
  if (error) console.error("saveMessage error", error.message);
}

async function findLinkedUser(channel: Channel, externalId: string): Promise<string | null> {
  const { data } = await supabase
    .from("bot_links")
    .select("user_id")
    .eq("channel", channel)
    .eq("external_id", externalId)
    .maybeSingle();
  return data?.user_id ?? null;
}

// ---------- AI tools ----------
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_shabbat_times",
      description:
        "זמני כניסת ויציאת שבת הקרובה לעיר בישראל, כולל פרשת השבוע ותאריך עברי.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "שם העיר בעברית, למשל ירושלים" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_daily_halachic_times",
      description:
        "זמני הלכה יומיים (עלות השחר, נץ, סוף זמן ק\"ש ותפילה, חצות, מנחה, פלג המנחה, שקיעה, צאת הכוכבים).",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" },
          date: { type: "string", description: "תאריך בפורמט YYYY-MM-DD, ברירת מחדל היום" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_parsha_and_holidays",
      description: "פרשת השבוע, תאריך עברי, ספירת העומר וחגים קרובים ב-90 הימים הבאים.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sefaria_daily",
      description: "לימוד יומי מ-Sefaria (דף יומי, משנה יומית, פרק תהילים וכו').",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_app_info",
      description:
        "מידע על אפליקציית 'בין השמשות': מה היא עושה, פיצ'רים, התראות, פרטיות, יצירת קשר, דפים.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: ["general", "features", "notifications", "privacy", "contact", "pages"],
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_data",
      description:
        "נתונים אישיים של המשתמש המחובר בלבד: רשימת קניות, משימות שבת, אורחים והזמנות, קבוצת משפחה, פרופיל והעדפות, אירועים משפחתיים, דירוגי שבת.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: [
              "shopping_list",
              "tasks",
              "guests",
              "family_group",
              "profile",
              "events",
              "ratings",
            ],
          },
        },
        required: ["kind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_notification_settings",
      description: "הגדרות ההתראות של המשתמש המחובר (ערוצים פעילים ותדירויות).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

async function runTool(name: string, args: any, userId: string | null, defaultCity: string) {
  switch (name) {
    case "get_shabbat_times":
      return getShabbatTimes(args?.city || defaultCity);
    case "get_daily_halachic_times":
      return getDailyHalachicTimes(args?.city || defaultCity, args?.date);
    case "get_parsha_and_holidays":
      return getParshaAndHolidays();
    case "get_sefaria_daily":
      return await getSefariaDaily();
    case "get_app_info":
      return getAppInfo(args?.topic);
    case "get_my_data":
      if (!userId) return { error: "NOT_LINKED", message: "המשתמש לא חיבר את החשבון שלו לבוט" };
      return await getMyData(supabase, userId, args?.kind);
    case "get_my_notification_settings":
      if (!userId) return { error: "NOT_LINKED", message: "המשתמש לא חיבר את החשבון שלו לבוט" };
      return await getMyNotificationSettings(supabase, userId);
    default:
      return { error: "UNKNOWN_TOOL" };
  }
}

// ---------- AI brain ----------
async function think(
  history: { role: string; content: string }[],
  userMessage: string,
  userId: string | null,
  defaultCity: string,
): Promise<string> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const systemPrompt =
    "אתה הבוט הרשמי של אפליקציית 'בין השמשות' — עוזר חם, מנומס ומעשי שעונה בעברית.\n" +
    "אתה עונה על שאלות לגבי זמני שבת וזמני הלכה, פרשת השבוע ותוכן תורני, ומידע על האפליקציה.\n" +
    "השתמש תמיד בכלים כדי לשאוב נתונים אמיתיים ועדכניים — אל תמציא שעות, תאריכים או פיצ'רים.\n" +
    "כתוב תשובות קצרות וברורות, עם שורות ואימוג'ים במידה, מתאים לקריאה בטלגרם/וואטסאפ.\n" +
    (userId
      ? "המשתמש מחובר לחשבון שלו, כך שאתה יכול להשתמש בכלים של הנתונים האישיים. " +
        `העיר המועדפת שלו: ${defaultCity}.\n`
      : "המשתמש עדיין לא חיבר את החשבון שלו לבוט, ולכן אין גישה לנתונים האישיים שלו. " +
        "אם הוא שואל על נתונים אישיים (רשימת קניות, אורחים, משימות, הגדרות), הסבר בעדינות " +
        "שעליו לשלוח /connect ואחריו קוד החיבור שמופיע בהגדרות ההתראות באפליקציה.\n") +
    "אם משתמש מבקש לבצע שינוי בנתונים — הסבר שכרגע אתה עונה ומספק מידע, ושהעדכון עצמו נעשה באפליקציה.";

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage },
  ];

  for (let step = 0; step < 6; step++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages,
        tools: TOOLS,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`AI gateway error [${res.status}]: ${body}`);
      if (res.status === 429) return "יש עומס כרגע על העוזר 🙏 נסה שוב עוד דקה.";
      if (res.status === 402) return "נגמרו הקרדיטים של ה-AI. אנא פנה למנהל האפליקציה.";
      return "מצטער, נתקלתי בתקלה זמנית. נסה שוב בבקשה.";
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const msg = choice?.message;
    if (!msg) return "לא הצלחתי לנסח תשובה, נסה לשאול שוב.";

    const toolCalls = msg.tool_calls ?? [];
    if (!toolCalls.length) {
      return (msg.content || "").trim() || "לא הצלחתי לנסח תשובה, נסה לשאול שוב.";
    }

    messages.push(msg);
    for (const call of toolCalls) {
      let args: any = {};
      try {
        args = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
      } catch {
        args = {};
      }
      let result: unknown;
      try {
        result = await runTool(call.function?.name, args, userId, defaultCity);
      } catch (e) {
        result = { error: String(e) };
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return "השאלה מסובכת מדי בשבילי כרגע 🙂 תוכל לנסח אותה אחרת?";
}

// ---------- commands ----------
const HELP_TEXT =
  "שלום! אני הבוט של *בין השמשות* 🕯️\n\n" +
  "אפשר לשאול אותי בחופשיות, למשל:\n" +
  "• מתי כניסת שבת בתל אביב?\n" +
  "• מה סוף זמן קריאת שמע היום?\n" +
  "• מה פרשת השבוע?\n" +
  "• מה יש ברשימת הקניות שלנו?\n" +
  "• איך מפעילים התראות בוואטסאפ?\n\n" +
  "כדי שאוכל לגשת לנתונים האישיים שלך:\n" +
  "1. פתח באפליקציה: הגדרות → התראות → חיבור לבוט\n" +
  "2. שלח לי כאן: `/connect הקוד`\n\n" +
  "פקודות: /start /help /connect /status";

async function handleCommand(
  channel: Channel,
  externalId: string,
  text: string,
  userId: string | null,
): Promise<string | null> {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "/start" || lower === "/help" || lower === "עזרה") return HELP_TEXT;

  if (lower === "/status") {
    if (!userId) return "החשבון שלך *לא מחובר* לבוט. שלח /connect ואחריו הקוד מהאפליקציה.";
    const city = await getUserCity(supabase, userId);
    return `החשבון שלך מחובר ✅\nהעיר המועדפת: ${city}`;
  }

  if (lower.startsWith("/connect")) {
    const code = trimmed.slice("/connect".length).trim();
    if (!code) {
      return "שלח את הקוד כך: `/connect ABC12345`\nאת הקוד תמצא באפליקציה: הגדרות → התראות → חיבור לבוט.";
    }
    const { error } = await supabase.rpc("redeem_bot_link_code", {
      p_code: code,
      p_channel: channel,
      p_external_id: externalId,
    });
    if (error) {
      console.error("redeem error", error.message);
      if (error.message.includes("INVALID_CODE")) {
        return "הקוד לא תקין או שפג תוקפו ⏳ צור קוד חדש באפליקציה ונסה שוב.";
      }
      return "לא הצלחתי לחבר את החשבון. נסה שוב בבקשה.";
    }
    return "מעולה, החשבון חובר בהצלחה ✅ מעכשיו אני יכול לענות גם על הנתונים האישיים שלך.";
  }

  if (lower === "/disconnect") {
    await supabase.from("bot_links").delete().eq("channel", channel).eq("external_id", externalId);
    return "החשבון נותק מהבוט. תמיד אפשר לחבר מחדש עם /connect.";
  }

  return null;
}

// ---------- core ----------
async function handleIncoming(channel: Channel, externalId: string, text: string) {
  const userId = await findLinkedUser(channel, externalId);
  await saveMessage(channel, externalId, userId, "user", text);

  const command = await handleCommand(channel, externalId, text, userId);
  if (command !== null) {
    await saveMessage(channel, externalId, userId, "assistant", command);
    await reply(channel, externalId, command);
    return;
  }

  const [history, city] = await Promise.all([
    loadHistory(channel, externalId),
    getUserCity(supabase, userId),
  ]);
  // the just-saved user message is the last history entry — drop it, `think` adds it
  const trimmedHistory = history.slice(0, -1);

  const answer = await think(trimmedHistory, text, userId, city);
  await saveMessage(channel, externalId, userId, "assistant", answer);
  await reply(channel, externalId, answer);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);

  // WhatsApp webhook verification (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const expected = TELEGRAM_BOT_TOKEN ? await deriveTelegramSecret(TELEGRAM_BOT_TOKEN) : "";
    if (mode === "subscribe" && token && expected && safeEqual(token, expected)) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json();

    // ---- Telegram ----
    if (body.update_id !== undefined) {
      if (!TELEGRAM_BOT_TOKEN) return new Response("not configured", { status: 500 });
      const expected = await deriveTelegramSecret(TELEGRAM_BOT_TOKEN);
      const provided = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (!safeEqual(provided, expected)) {
        return new Response("Unauthorized", { status: 401 });
      }

      const message = body.message ?? body.edited_message;
      const chatId = message?.chat?.id;
      const text = message?.text;
      if (!chatId || !text) return Response.json({ ok: true, ignored: true });

      await handleIncoming("telegram", String(chatId), String(text).slice(0, 2000));
      return Response.json({ ok: true });
    }

    // ---- WhatsApp Cloud API ----
    if (body.object === "whatsapp_business_account") {
      const entries = body.entry ?? [];
      for (const entry of entries) {
        for (const change of entry.changes ?? []) {
          for (const message of change.value?.messages ?? []) {
            const from = message.from;
            const text = message.text?.body;
            if (!from || !text) continue;
            await handleIncoming("whatsapp", String(from), String(text).slice(0, 2000));
          }
        }
      }
      return Response.json({ ok: true });
    }

    return Response.json({ ok: true, ignored: true });
  } catch (err) {
    console.error("bot-webhook error", err);
    // always 200 to webhooks so providers don't hammer retries
    return Response.json({ ok: false, error: String(err) });
  }
});
