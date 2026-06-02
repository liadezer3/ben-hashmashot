import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function gwHeaders(connectorKeyName: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const connKey = Deno.env.get(connectorKeyName);
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!connKey) throw new Error(`${connectorKeyName} is not configured`);
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": connKey,
    "Content-Type": "application/json",
  };
}

function base64UrlEncode(str: string) {
  // UTF-8 safe base64url encoding
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function handle(action: string, payload: Record<string, unknown>) {
  switch (action) {
    /* ---------------- GMAIL ---------------- */
    case "gmail_send": {
      const { to, subject, body } = payload as { to: string; subject: string; body: string };
      if (!to || !subject || !body) throw new Error("נדרשים נמען, נושא ותוכן");
      const headers = gwHeaders("GOOGLE_MAIL_API_KEY");
      const raw = base64UrlEncode(
        [
          `To: ${to}`,
          `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
          'Content-Type: text/plain; charset="UTF-8"',
          "MIME-Version: 1.0",
          "",
          body,
        ].join("\r\n"),
      );
      const res = await fetch(`${GATEWAY}/google_mail/gmail/v1/users/me/messages/send`, {
        method: "POST",
        headers,
        body: JSON.stringify({ raw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Gmail [${res.status}]: ${JSON.stringify(data)}`);
      return { id: data.id };
    }

    /* ---------------- CALENDAR ---------------- */
    case "calendar_create_event": {
      const { summary, description, startISO, endISO, timeZone } = payload as {
        summary: string; description?: string; startISO: string; endISO: string; timeZone?: string;
      };
      if (!summary || !startISO || !endISO) throw new Error("נדרשים כותרת וזמני התחלה/סיום");
      const headers = gwHeaders("GOOGLE_CALENDAR_API_KEY");
      const res = await fetch(`${GATEWAY}/google_calendar/calendar/v3/calendars/primary/events`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          summary,
          description: description || "",
          start: { dateTime: startISO, timeZone: timeZone || "Asia/Jerusalem" },
          end: { dateTime: endISO, timeZone: timeZone || "Asia/Jerusalem" },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Calendar [${res.status}]: ${JSON.stringify(data)}`);
      return { id: data.id, htmlLink: data.htmlLink };
    }

    /* ---------------- DRIVE ---------------- */
    case "drive_list": {
      const headers = gwHeaders("GOOGLE_DRIVE_API_KEY");
      const res = await fetch(
        `${GATEWAY}/google_drive/drive/v3/files?pageSize=20&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,webViewLink)`,
        { headers },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(`Drive [${res.status}]: ${JSON.stringify(data)}`);
      return { files: data.files || [] };
    }

    /* ---------------- SHEETS ---------------- */
    case "sheets_export": {
      const { title, rows } = payload as { title: string; rows: string[][] };
      if (!rows?.length) throw new Error("אין נתונים לייצוא");
      const headers = gwHeaders("GOOGLE_SHEETS_API_KEY");
      // Create spreadsheet
      const createRes = await fetch(`${GATEWAY}/google_sheets/v4/spreadsheets`, {
        method: "POST",
        headers,
        body: JSON.stringify({ properties: { title: title || "רשימת קניות לשבת" } }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(`Sheets create [${createRes.status}]: ${JSON.stringify(created)}`);
      const spreadsheetId = created.spreadsheetId;
      // Append values
      const appendRes = await fetch(
        `${GATEWAY}/google_sheets/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
        { method: "POST", headers, body: JSON.stringify({ values: rows }) },
      );
      const appended = await appendRes.json();
      if (!appendRes.ok) throw new Error(`Sheets append [${appendRes.status}]: ${JSON.stringify(appended)}`);
      return { spreadsheetId, url: created.spreadsheetUrl };
    }

    /* ---------------- DOCS ---------------- */
    case "docs_create": {
      const { title, text } = payload as { title: string; text: string };
      if (!title) throw new Error("נדרשת כותרת למסמך");
      const headers = gwHeaders("GOOGLE_DOCS_API_KEY");
      const createRes = await fetch(`${GATEWAY}/google_docs/v1/documents`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(`Docs create [${createRes.status}]: ${JSON.stringify(created)}`);
      const documentId = created.documentId;
      if (text) {
        const updateRes = await fetch(`${GATEWAY}/google_docs/v1/documents/${documentId}:batchUpdate`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            requests: [{ insertText: { location: { index: 1 }, text } }],
          }),
        });
        const updated = await updateRes.json();
        if (!updateRes.ok) throw new Error(`Docs update [${updateRes.status}]: ${JSON.stringify(updated)}`);
      }
      return { documentId, url: `https://docs.google.com/document/d/${documentId}/edit` };
    }

    /* ---------------- SLIDES ---------------- */
    case "slides_create": {
      const { title, slides } = payload as { title: string; slides: { title: string; body: string }[] };
      if (!title) throw new Error("נדרשת כותרת למצגת");
      const headers = gwHeaders("GOOGLE_SLIDES_API_KEY");
      const createRes = await fetch(`${GATEWAY}/google_slides/v1/presentations`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(`Slides create [${createRes.status}]: ${JSON.stringify(created)}`);
      const presentationId = created.presentationId;

      // Build slides with title+body layout
      const requests: unknown[] = [];
      (slides || []).forEach((s, i) => {
        const slideId = `slide_${i}_${Date.now()}`;
        const titleId = `title_${i}_${Date.now()}`;
        const bodyId = `body_${i}_${Date.now()}`;
        requests.push({
          createSlide: {
            objectId: slideId,
            slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" },
            placeholderIdMappings: [
              { layoutPlaceholder: { type: "TITLE" }, objectId: titleId },
              { layoutPlaceholder: { type: "BODY" }, objectId: bodyId },
            ],
          },
        });
        if (s.title) requests.push({ insertText: { objectId: titleId, text: s.title } });
        if (s.body) requests.push({ insertText: { objectId: bodyId, text: s.body } });
      });
      if (requests.length) {
        const updateRes = await fetch(`${GATEWAY}/google_slides/v1/presentations/${presentationId}:batchUpdate`, {
          method: "POST",
          headers,
          body: JSON.stringify({ requests }),
        });
        const updated = await updateRes.json();
        if (!updateRes.ok) throw new Error(`Slides update [${updateRes.status}]: ${JSON.stringify(updated)}`);
      }
      return { presentationId, url: `https://docs.google.com/presentation/d/${presentationId}/edit` };
    }

    /* ---------------- GEMINI (via Lovable AI) ---------------- */
    case "gemini_ask": {
      const { question } = payload as { question: string };
      if (!question) throw new Error("נדרשת שאלה");
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "אתה עוזר תורני חם ובקיא. ענה בעברית בצורה ברורה ומכבדת על שאלות בנושאי פרשת השבוע, הלכות שבת, חגים ומסורת יהודית. שמור על דיוק ועל רגישות לרמות שונות של שמירת מצוות.",
            },
            { role: "user", content: question },
          ],
        }),
      });
      if (res.status === 429) return { __status: 429, error: "חרגת ממכסת הבקשות, נסה שוב מאוחר יותר" };
      if (res.status === 402) return { __status: 402, error: "נדרש תשלום — הוסף קרדיטים ל-Lovable AI" };
      const data = await res.json();
      if (!res.ok) throw new Error("AI gateway error");
      return { answer: data.choices?.[0]?.message?.content || "" };
    }

    default:
      throw new Error(`פעולה לא מוכרת: ${action}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimErr } = await supabase.auth.getClaims(token);
    if (claimErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const { action, payload } = await req.json();
    if (!action || typeof action !== "string") return json({ error: "נדרש שדה action" }, 400);

    const result = await handle(action, payload || {});
    if (result && typeof result === "object" && "__status" in result) {
      const { __status, ...rest } = result as Record<string, unknown>;
      return json(rest, __status as number);
    }
    return json(result);
  } catch (error) {
    console.error("google-services error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
