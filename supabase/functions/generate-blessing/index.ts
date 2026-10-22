import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BLESSING_TEMPLATES = {
  birthday: {
    warm: `מזל טוב ליום ההולדת! 🎂
שתהיה שנה מלאה בבריאות, אושר והצלחה.
אוהבים אותך! ❤️`,
    formal: `ברכות חמות ליום הולדתך!
מאחלים לך שנה של בריאות איתנה, הצלחה בכל מעשי ידיך, ושמחה בלב.
בברכה`,
    funny: `יום הולדת שמח! 🎈
עוד שנה חלפה ואתה עדיין נראה... בערך אותו דבר 😄
שיהיה מדהים!`,
    religious: `מזל טוב ליום ההולדת! 🎂
יהי רצון שהקב"ה ימלא כל משאלות לבך לטובה.
שתזכה לשנים רבות של תורה, חופה ומעשים טובים.`,
  },
  anniversary: {
    warm: `מזל טוב ליום הנישואין! 💍
שתמשיכו לאהוב ולשמח זה את זה לאורך שנים רבות.
אוהבים אתכם!`,
    formal: `ברכות חמות ליום נישואיכם!
מאחלים לכם המשך חיים מאושרים יחד, מלאים באהבה וכבוד הדדי.
בברכה`,
    funny: `עוד שנה ביחד ועדיין לא התגרשתם! 😄
כל הכבוד! שיהיו עוד הרבה כאלה! 💕`,
    religious: `מזל טוב ליום נישואיכם!
יהי רצון שתזכו להמשיך לבנות בית נאמן בישראל, מלא בשלום ואהבה.
בברכת מזל טוב`,
  },
  bar_mitzvah: {
    warm: `מזל טוב לבר/בת המצווה! ✡️
שתגדל לתורה, לחופה ולמעשים טובים.
גאים בך! 🎉`,
    formal: `ברכות חמות לרגל הבר/בת מצווה!
מאחלים לך להמשיך ולגדול בתורה ובמעשים טובים, ולהיות לגאון למשפחתך ולעמך.
בברכה`,
    funny: `מזל טוב! עכשיו אתה אחראי על המעשים שלך... בהצלחה עם זה! 😄
שתגדל לתורה, לחופה ולמעשים טובים! ✡️`,
    religious: `מזל טוב לבר/בת המצווה!
יהי רצון שתזכה לגדול לתורה, לחופה ולמעשים טובים.
שתהיה לנחת לכל המשפחה ולכל עם ישראל.`,
  },
  yahrzeit: {
    warm: `נר זיכרון לעילוי נשמת יקירנו.
תהא נשמתו/ה צרורה בצרור החיים.
זכרונו/ה לברכה. 🕯️`,
    formal: `לזכר יקירנו.
יהי זכרו/ה ברוך ונשמתו/ה צרורה בצרור החיים.
תנצב"ה`,
    religious: `יהי רצון שתהא נשמתו/ה צרורה בצרור החיים.
יהי זכרו/ה ברוך, ותעמוד לנו זכותו/ה.
תנצב"ה 🕯️`,
  },
  general: {
    warm: `ברכות חמות!
מאחלים הצלחה רבה ושמחה! 🎉`,
    formal: `בברכה חמה,
מאחלים הצלחה ובריאות.`,
    funny: `שיהיה בהצלחה! 🎈`,
    religious: `בעזרת ה׳, שיהיה בהצלחה רבה!`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, personName, style, hebrewDate } = await req.json();

    // Try to generate with AI first
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (LOVABLE_API_KEY) {
      try {
        const eventTypeHeb: Record<string, string> = {
          birthday: "יום הולדת",
          anniversary: "יום נישואין",
          bar_mitzvah: "בר/בת מצווה",
          yahrzeit: "יארצייט",
          general: "אירוע",
        };

        const styleHeb: Record<string, string> = {
          warm: "חם ואישי",
          formal: "רשמי",
          funny: "הומוריסטי",
          religious: "דתי/מסורתי",
        };

        const prompt = `כתוב ברכה קצרה (3-5 שורות) ל${eventTypeHeb[eventType] || "אירוע"} עבור ${personName || "החוגג/ת"}.
${hebrewDate ? `התאריך העברי: ${hebrewDate}` : ""}
סגנון הברכה: ${styleHeb[style] || "חם ואישי"}.
הברכה צריכה להיות בעברית, אישית וחמה.
${style === "religious" ? "כלול ברכות מסורתיות כמו 'יהי רצון' או 'מזל טוב'." : ""}
${style === "funny" ? "הוסף הומור קליל ואימוג'ים." : ""}`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "אתה מומחה בכתיבת ברכות בעברית. החזר את הברכה בלבד, ללא הסברים." },
              { role: "user", content: prompt },
            ],
            max_tokens: 300,
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const blessing = aiData.choices?.[0]?.message?.content;
          if (blessing) {
            return new Response(JSON.stringify({ blessing }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (aiError) {
        console.error("AI generation failed, falling back to templates:", aiError);
      }
    }

    // Fallback to templates
    const templates = BLESSING_TEMPLATES[eventType as keyof typeof BLESSING_TEMPLATES] || BLESSING_TEMPLATES.general;
    const blessing = templates[style as keyof typeof templates] || templates.warm;

    // Personalize the template if we have a name
    let personalizedBlessing = blessing;
    if (personName) {
      personalizedBlessing = blessing.replace(/יקירנו|החוגג\/ת/g, personName);
    }

    return new Response(JSON.stringify({ blessing: personalizedBlessing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate blessing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
