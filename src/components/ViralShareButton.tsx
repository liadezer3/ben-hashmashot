import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, X, Copy, Send, Facebook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/shareUtils";
import whatsappIcon from "@/assets/whatsapp-icon.png";

const LANDING_URL = "https://ben-hashmashot.com";

const VIRAL_MESSAGE = `🕯️ *התנסה עכשיו - אפליקציית בין השמשות* ✨

לא שוכחים יותר כניסת שבת!
📅 זמני שבת מדויקים לפי המיקום שלך
🔔 התראות אוטומטיות בוואטסאפ, מייל ו-SMS
👨‍👩‍👧‍👦 לכל המשפחה

👈 לחץ והתנסה עכשיו בחינם:
${LANDING_URL}

שבת שלום! 🌅`;

export const ViralShareButton = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(VIRAL_MESSAGE)}`;
    window.open(url, "_blank");
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(LANDING_URL)}&text=${encodeURIComponent(VIRAL_MESSAGE)}`;
    window.open(url, "_blank");
  };

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(LANDING_URL)}`,
      "_blank"
    );
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(VIRAL_MESSAGE);
    if (ok) toast({ title: "הטקסט הועתק!", description: "שתפו בכל פלטפורמה" });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "אפליקציית בין השמשות",
          text: VIRAL_MESSAGE,
          url: LANDING_URL,
        });
        return;
      } catch {
        /* user cancelled */
      }
    }
    shareWhatsApp();
  };

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="שתף את האפליקציה"
        className="fixed bottom-16 left-4 z-40 flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-3 rounded-full shadow-2xl transition-transform hover:scale-105 animate-pulse"
      >
        <img src={whatsappIcon} alt="" className="w-6 h-6" />
        <span className="font-bold text-sm hidden sm:inline">התנסה עכשיו - שתף</span>
        <span className="font-bold text-sm sm:hidden">שתף</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">התנסה עכשיו - שתף עם חברים</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-muted"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              שלחו לחברים ולמשפחה הזמנה להתנסות באפליקציה
            </p>

            <div className="bg-muted/50 p-3 rounded-lg text-xs whitespace-pre-line max-h-40 overflow-y-auto border border-border">
              {VIRAL_MESSAGE}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={shareWhatsApp}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2"
              >
                <img src={whatsappIcon} alt="" className="w-5 h-5" />
                WhatsApp
              </Button>
              <Button
                onClick={shareTelegram}
                className="bg-[#0088cc] hover:bg-[#006699] text-white gap-2"
              >
                <Send className="w-4 h-4" />
                Telegram
              </Button>
              <Button
                onClick={shareFacebook}
                className="bg-[#1877F2] hover:bg-[#0d5cc7] text-white gap-2"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </Button>
              <Button onClick={handleCopy} variant="secondary" className="gap-2">
                <Copy className="w-4 h-4" />
                העתק
              </Button>
            </div>

            <Button
              onClick={handleNativeShare}
              variant="outline"
              className="w-full gap-2"
            >
              <Share2 className="w-4 h-4" />
              שיתוף מערכת (כל האפליקציות)
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
