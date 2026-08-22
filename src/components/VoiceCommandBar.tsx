import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Volume2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useShabbatTimes } from "@/hooks/useShabbatTimes";
import { getDailyHalachicTimes } from "@/lib/halachicTimes";
import { parseVoiceCommand, VOICE_HELP_TEXT } from "@/lib/voiceCommands";

/**
 * Global voice command engine ("Siri-like") — listens, understands Hebrew/English
 * commands and executes them: navigation between screens, Shabbat times,
 * dynamic theme switching, music, scrolling. Unknown requests fall back to the AI assistant.
 */
export const VoiceCommandBar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [thinking, setThinking] = useState(false);
  const [city, setCity] = useState("Jerusalem");
  const recognitionRef = useRef<any>(null);
  const supported = typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const { shabbatTimes } = useShabbatTimes(city);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || !active) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("city")
        .eq("id", session.user.id)
        .maybeSingle();
      if (active && profile?.city) setCity(profile.city);
    });
    return () => {
      active = false;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[•*]/g, ""));
    utterance.lang = "he-IL";
    window.speechSynthesis.speak(utterance);
  }, []);

  const respond = useCallback(
    (text: string) => {
      setReply(text);
      speak(text);
    },
    [speak]
  );

  const setTheme = useCallback((mode: "dark" | "light" | "toggle") => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const next = mode === "toggle" ? !isDark : mode === "dark";
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    return next;
  }, []);

  const askAi = useCallback(
    async (question: string) => {
      setThinking(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          respond("כדי לשאול שאלות חופשיות צריך להתחבר לחשבון");
          return;
        }
        const { data, error } = await supabase.functions.invoke("voice-assistant", {
          body: { message: question, city },
        });
        if (error) throw error;
        respond(data?.response || "לא הצלחתי להבין, נסה שוב");

      } catch (e) {
        console.error("voice command AI fallback failed", e);
        respond("לא הצלחתי לענות כרגע. נסה לומר \"עזרה\" כדי לשמוע מה אני יודע לעשות");
      } finally {
        setThinking(false);
      }
    },
    [city, respond]
  );

  const execute = useCallback(
    async (raw: string) => {
      const intent = parseVoiceCommand(raw);

      switch (intent.type) {
        case "navigate":
          respond(intent.say);
          navigate(intent.path);
          setTimeout(() => setOpen(false), 1200);
          return;

        case "shabbat-times": {
          const candles = shabbatTimes?.candleLighting;
          const havdalah = shabbatTimes?.havdalah;
          if (!candles && !havdalah) {
            respond("זמני השבת עדיין נטענים, נסה שוב בעוד רגע");
            return;
          }
          if (intent.kind === "candles") respond(`${candles} ב${shabbatTimes?.city || city}`);
          else if (intent.kind === "havdalah") respond(`${havdalah} ב${shabbatTimes?.city || city}`);
          else respond(`${candles}. ${havdalah}.`);
          return;
        }

        case "parsha":
          respond(
            shabbatTimes?.parashat
              ? `פרשת השבוע: ${shabbatTimes.parashat}`
              : "פרשת השבוע עדיין נטענת"
          );
          return;

        case "halachic-times": {
          const times = getDailyHalachicTimes(city);
          const pick = times
            .filter((t) => ["sunrise", "sofZmanShma", "chatzot", "shkiah", "tzeit"].includes(t.key))
            .map((t) => `${t.label}: ${t.time}`)
            .join(", ");
          respond(pick);
          return;
        }

        case "theme": {
          const isDark = setTheme(intent.mode);
          respond(isDark ? "עברתי למצב כהה" : "עברתי למצב בהיר");
          return;
        }

        case "music":
          respond("מפעיל מוזיקה לשבת");
          navigate("/settings?tab=music");
          setTimeout(() => setOpen(false), 1200);
          return;

        case "scroll":
          window.scrollTo({
            top: intent.direction === "top" ? 0 : document.body.scrollHeight,
            behavior: "smooth",
          });
          respond(intent.direction === "top" ? "גוללתי למעלה" : "גוללתי למטה");
          return;

        case "help":
          setReply(VOICE_HELP_TEXT);
          speak("אפשר לבקש ממני לנווט בין מסכים, לומר זמני שבת וזמני הלכה, להחליף מצב כהה או בהיר, ולהפעיל מוזיקה");
          return;

        case "stop":
          window.speechSynthesis?.cancel();
          setReply("");
          return;

        default:
          await askAi(raw);
      }
    },
    [askAi, city, navigate, respond, setTheme, shabbatTimes, speak]
  );

  const startListening = useCallback(() => {
    if (!supported) {
      toast({
        title: "זיהוי קולי לא נתמך",
        description: "הדפדפן שלך לא תומך בפקודות קוליות",
        variant: "destructive",
      });
      return;
    }
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "he-IL";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const said = event.results[0][0].transcript as string;
      setTranscript(said);
      setListening(false);
      execute(said);
    };
    recognition.onerror = () => {
      setListening(false);
      setReply("לא שמעתי, נסה שוב");
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setTranscript("");
    setReply("");
    setListening(true);
    recognition.start();
  }, [execute, supported, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return (
    <>
      {/* Floating mic trigger */}
      <button
        onClick={() => {
          setOpen(true);
          if (!listening) startListening();
        }}
        aria-label="פקודות קוליות"
        className={cn(
          "fixed bottom-20 left-4 z-50 w-14 h-14 rounded-full shadow-lg",
          "bg-primary text-primary-foreground flex items-center justify-center",
          "transition-transform hover:scale-105",
          listening && "animate-pulse"
        )}
      >
        <Mic className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-36 z-50 flex justify-center sm:justify-start sm:right-auto sm:left-4 sm:max-w-sm">
          <Card className="w-full p-4 shadow-xl border-primary/30" dir="rtl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">עוזר פקודות קוליות</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  stopListening();
                  window.speechSynthesis?.cancel();
                  setOpen(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mb-2">
              {listening
                ? "מקשיב... אמור פקודה"
                : 'למשל: "פתח לוח בקרה", "מתי יציאת שבת", "מצב כהה", "נגן מוזיקה"'}
            </p>

            {transcript && (
              <p className="text-sm mb-2">
                <span className="text-muted-foreground">אמרת: </span>
                {transcript}
              </p>
            )}

            {(reply || thinking) && (
              <div className="flex gap-2 text-sm bg-muted rounded-lg p-3 mb-3 whitespace-pre-wrap">
                <Volume2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{thinking ? "חושב..." : reply}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={listening ? stopListening : startListening}
                variant={listening ? "destructive" : "default"}
                className="flex-1 gap-2"
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {listening ? "עצור" : "דבר אליי"}
              </Button>
              <Button variant="outline" onClick={() => execute("עזרה")}>
                מה אפשר לבקש
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default VoiceCommandBar;
