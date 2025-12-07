import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Clock, Calendar, BookOpen, Heart, Users, Bell, Sparkles, Send, Facebook } from "lucide-react";
import { shareViaWhatsApp, shareViaEmail, copyToClipboard } from "@/lib/shareUtils";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpg";
import whatsappIcon from "@/assets/whatsapp-icon.png";
import gmailIcon from "@/assets/gmail-icon.png";

// Share via Telegram
const shareViaTelegram = (text: string): void => {
  const encodedText = encodeURIComponent(text);
  window.open(`https://t.me/share/url?text=${encodedText}`, '_blank');
};

// Share via Facebook
const shareViaFacebook = (url: string): void => {
  const encodedUrl = encodeURIComponent(url);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
};

export const AppPromotion = () => {
  const { toast } = useToast();
  const appUrl = window.location.origin;
  
  const promotionText = `🕯️ גילית את האפליקציה הכי שימושית לשבת!

✨ זמני שבת וחג - האפליקציה המשפחתית שלך

📱 מה מקבלים?
📅 זמני שבת מדויקים לפי המיקום שלך
🔔 התראות אוטומטיות במייל, SMS ווואטסאפ
📋 רשימת משימות להכנה לשבת
📖 דבר תורה שבועי מעודכן
💝 יומן זיכרונות משפחתי
⭐ חגים קרובים ותאריכים חשובים
👨‍👩‍👧‍👦 ניהול משפחה והתראות לכולם

🔗 הצטרפו עכשיו: ${appUrl}

שבת שלום! ✨`;

  const emailSubject = "גיליתי אפליקציה מדהימה לזמני שבת - חייבים לנסות!";

  const handleShareWhatsApp = () => {
    shareViaWhatsApp(promotionText);
  };

  const handleShareEmail = () => {
    shareViaEmail(emailSubject, promotionText);
  };

  const handleCopyLink = async () => {
    const copied = await copyToClipboard(appUrl);
    if (copied) {
      toast({
        title: "הקישור הועתק!",
        description: "שתפו את הקישור עם חברים ומשפחה",
      });
    }
  };

  const handleCopyPromotion = async () => {
    const copied = await copyToClipboard(promotionText);
    if (copied) {
      toast({
        title: "הטקסט הועתק!",
        description: "כעת ניתן לשתף בכל פלטפורמה",
      });
    }
  };

  const features = [
    { icon: Clock, text: "זמני שבת מדויקים", color: "text-primary" },
    { icon: Bell, text: "התראות אוטומטיות", color: "text-secondary" },
    { icon: Calendar, text: "חגים קרובים", color: "text-primary" },
    { icon: BookOpen, text: "דבר תורה שבועי", color: "text-secondary" },
    { icon: Heart, text: "זיכרונות משפחתיים", color: "text-primary" },
    { icon: Users, text: "ניהול משפחה", color: "text-secondary" },
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20 shadow-lg">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border-2 border-primary/30">
            <img src={logo} alt="לוגו האפליקציה" className="w-full h-full object-cover" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          שתפו את האפליקציה
          <Sparkles className="w-6 h-6 text-primary" />
        </h2>
        <p className="text-muted-foreground">הזמינו חברים ומשפחה להצטרף לחוויית השבת המושלמת</p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="flex items-center gap-2 p-3 bg-background/60 rounded-lg border border-border/50"
          >
            <feature.icon className={`w-5 h-5 ${feature.color}`} />
            <span className="text-sm font-medium">{feature.text}</span>
          </div>
        ))}
      </div>

      {/* Share Buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white"
          >
            <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5" />
            שתף בוואטסאפ
          </Button>
          <Button 
            onClick={() => shareViaTelegram(promotionText)}
            className="flex items-center gap-2 bg-[#0088cc] hover:bg-[#006699] text-white"
          >
            <Send className="w-4 h-4" />
            שתף בטלגרם
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => shareViaFacebook(appUrl)}
            className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#0d5cc7] text-white"
          >
            <Facebook className="w-4 h-4" />
            שתף בפייסבוק
          </Button>
          <Button 
            onClick={handleShareEmail}
            variant="outline"
            className="flex items-center gap-2"
          >
            <img src={gmailIcon} alt="Email" className="w-5 h-5" />
            שלח במייל
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleCopyLink}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            העתק קישור
          </Button>
          <Button 
            onClick={handleCopyPromotion}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            העתק פרסומת
          </Button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="mt-6 p-4 bg-background/80 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground mb-2">תצוגה מקדימה:</p>
        <div className="text-sm whitespace-pre-line text-foreground/80 max-h-32 overflow-y-auto">
          {promotionText}
        </div>
      </div>
    </Card>
  );
};
