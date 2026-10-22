import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user dismissed the banner before
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate 
      ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24) 
      : Infinity;

    // Show again after 7 days
    if (daysSinceDismissed < 7) {
      return;
    }

    // Listen for the beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // For iOS, show manual instructions after a delay
    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 5000); // Show after 5 seconds on iOS
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", new Date().toISOString());
  };

  // Don't show if already installed
  if (isStandalone || !showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up" dir="rtl">
      <div className="max-w-lg mx-auto bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-2xl p-4 text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-2 left-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="סגור"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg">התקן את בין השמשות</h3>
            <p className="text-sm text-amber-100 mt-0.5">
              {isIOS 
                ? "הוסף למסך הבית לגישה מהירה" 
                : "גישה מהירה מהמסך הראשי, ללא דפדפן"}
            </p>
          </div>
        </div>

        {isIOS ? (
          // iOS instructions
          <div className="mt-4 p-3 bg-white/10 rounded-lg text-sm">
            <p className="font-medium mb-2">איך להתקין באייפון:</p>
            <ol className="space-y-1 text-amber-100">
              <li>1. לחץ על כפתור השיתוף <span className="inline-block px-1.5 py-0.5 bg-white/20 rounded text-xs">⬆️</span></li>
              <li>2. גלול ובחר "הוסף למסך הבית"</li>
              <li>3. לחץ "הוסף" בפינה העליונה</li>
            </ol>
          </div>
        ) : (
          // Android/Chrome install button
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-white text-amber-600 hover:bg-amber-50 gap-2"
            >
              <Download className="w-4 h-4" />
              התקן עכשיו
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              לא עכשיו
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
