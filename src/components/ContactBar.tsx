import { Phone, Mail } from "lucide-react";

interface ContactBarProps {
  position: "top" | "bottom";
}

export const ContactBar = ({ position }: ContactBarProps) => {
  return (
    <div
      className={`fixed left-0 right-0 z-50 bg-primary text-primary-foreground shadow-md ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
    >
      <div className="container mx-auto px-3 py-1.5 flex items-center justify-center gap-3 text-xs sm:text-sm flex-wrap">
        <span className="font-semibold">אפליקציית בין השמשות</span>
        <span className="opacity-60">|</span>
        <span>ליעד עזר</span>
        <span className="opacity-60">|</span>
        <a
          href="tel:+972509151878"
          className="flex items-center gap-1 hover:underline font-medium"
          dir="ltr"
        >
          <Phone className="w-3.5 h-3.5" />
          +972 50-915-1878
        </a>
      </div>
    </div>
  );
};
