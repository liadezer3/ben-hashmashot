import { Sparkles } from "lucide-react";

export const Header = () => {
  return (
    <header className="bg-gradient-shabbat text-primary-foreground shadow-soft">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8" />
          <h1 className="text-3xl md:text-4xl font-bold">זמני שבת וחגים</h1>
        </div>
        <p className="text-center mt-3 text-primary-foreground/90 text-lg">
          קבלו התראות אוטומטיות לפני כל שבת וחג
        </p>
      </div>
    </header>
  );
};
