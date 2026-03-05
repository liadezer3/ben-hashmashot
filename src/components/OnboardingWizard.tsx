import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Heart, Bell, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { CitySelector } from "@/components/CitySelector";
import { useUserPreferences, ObservanceLevel } from "@/hooks/useUserPreferences";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { icon: MapPin, title: "איפה אתה גר?", subtitle: "נחשב זמני שבת מדויקים למיקום שלך" },
  { icon: Heart, title: "מה הסגנון שלך?", subtitle: "נתאים את התוכן והחוויה בשבילך" },
  { icon: Bell, title: "איך להתריע?", subtitle: "בחר איך תרצה לקבל תזכורות לשבת" },
];

const OBSERVANCE_OPTIONS: { value: ObservanceLevel; label: string; emoji: string; desc: string }[] = [
  { value: "religious", label: "דתי", emoji: "🕍", desc: "כל התכנים ההלכתיים, פרשת שבוע, זמנים מדויקים" },
  { value: "traditional", label: "מסורתי", emoji: "🕯️", desc: "זמני שבת, מנהגים, תכנים מותאמים" },
  { value: "secular", label: "חילוני", emoji: "✨", desc: "זמני שבת בסיסיים, מוזיקה, משפחה וקהילה" },
];

const CHANNEL_OPTIONS = [
  { key: "push", label: "התראות Push", emoji: "📱", desc: "התראה ישירה לטלפון" },
  { key: "email", label: "אימייל", emoji: "📧", desc: "סיכום שבועי לאימייל" },
  { key: "whatsapp", label: "וואטסאפ", emoji: "💬", desc: "הודעה בוואטסאפ" },
];

export const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState("Jerusalem");
  const [observance, setObservance] = useState<ObservanceLevel>("traditional");
  const [channels, setChannels] = useState({ push: true, email: false, whatsapp: false, sms: false });
  const { updatePreferencesAsync, isUpdating } = useUserPreferences();

  const toggleChannel = (key: string) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleFinish = async () => {
    try {
      await updatePreferencesAsync({
        observance_level: observance,
        channels,
      });
      localStorage.setItem("onboarding_complete", "true");
      onComplete();
    } catch {
      // Still complete onboarding even if save fails
      localStorage.setItem("onboarding_complete", "true");
      onComplete();
    }
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6 overflow-hidden">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                i === step ? "bg-primary w-8" : i < step ? "bg-primary/60" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step header */}
        <div className="text-center space-y-2">
          <motion.div
            key={step}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <StepIcon className="w-7 h-7 text-primary" />
          </motion.div>
          <h2 className="text-xl font-bold">{STEPS[step].title}</h2>
          <p className="text-sm text-muted-foreground">{STEPS[step].subtitle}</p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {step === 0 && (
              <CitySelector
                value={city}
                onChange={setCity}
              />
            )}

            {step === 1 && (
              <div className="space-y-3">
                {OBSERVANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setObservance(opt.value)}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-right transition-all",
                      observance === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <p className="font-semibold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      {observance === opt.value && (
                        <Check className="w-5 h-5 text-primary mr-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                {CHANNEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => toggleChannel(opt.key)}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-right transition-all",
                      channels[opt.key as keyof typeof channels]
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <p className="font-semibold">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      {channels[opt.key as keyof typeof channels] && (
                        <Check className="w-5 h-5 text-primary mr-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
              <ChevronRight className="w-4 h-4" />
              חזרה
            </Button>
          )}
          <Button
            className="flex-1 gap-1"
            onClick={step < 2 ? () => setStep(step + 1) : handleFinish}
            disabled={isUpdating}
          >
            {step < 2 ? (
              <>
                המשך
                <ChevronLeft className="w-4 h-4" />
              </>
            ) : isUpdating ? (
              "שומר..."
            ) : (
              "🎉 יאללה, מתחילים!"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
