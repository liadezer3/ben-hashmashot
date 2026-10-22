import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  BarChart3,
  Settings,
  Bell,
  MapPin,
  Users,
  Cake,
  ShoppingCart,
  Mail,
  UtensilsCrossed,
  BookOpen,
  Clock,
  Car,
  Bot,
  HelpCircle,
  Info,
  Shield,
  X,
  Menu,
  Sparkles,
  LogOut,
  User,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SidebarMenuProps {
  userCity?: string;
  hebrewDate?: string;
  isGuest?: boolean;
  onClose?: () => void;
}

const MENU_SECTIONS = [
  {
    title: "ניווט מהיר",
    items: [
      { icon: Home, label: "דף הבית", href: "/", desc: null },
      { icon: BarChart3, label: "דשבורד", href: "/dashboard", desc: null },
      { icon: Settings, label: "הגדרות", href: "/settings", desc: null },
    ],
  },
  {
    title: "התראות",
    items: [
      { icon: Bell, label: "ערוצי התראה", href: "/settings?tab=notifications", desc: "WhatsApp, Push, Email" },
      { icon: MapPin, label: "מיקומים", href: "/settings?tab=locations", desc: null },
    ],
  },
  {
    title: "משפחה וקהילה",
    items: [
      { icon: Users, label: "בני משפחה", href: "/settings?tab=family", desc: null },
      { icon: Cake, label: "ימי הולדת ואירועים", href: "/settings?tab=family", desc: null },
      { icon: ShoppingCart, label: "רשימת קניות", href: "/settings?tab=family", desc: null },
      { icon: Mail, label: "הזמנות לשבת", href: "/settings?tab=invitations", desc: null },
    ],
  },
  {
    title: "כלים",
    items: [
      { icon: UtensilsCrossed, label: "מתכונים לשבת", href: "/settings?tab=recipes", desc: "מתכונים עם AI", hasAI: true },
      { icon: BookOpen, label: "דבר תורה", href: "/settings?tab=torah", desc: null, hasAI: true },
      { icon: Clock, label: "זמני היום", href: "/settings?tab=times", desc: null },
      { icon: Car, label: "חלון יציאה", href: "/", desc: "המלצה חכמה", hasAI: true },
      { icon: Bot, label: "קונסיירז' ערב שבת", href: "/", desc: null, hasAI: true },
    ],
  },
  {
    title: "עוד",
    items: [
      { icon: HelpCircle, label: "עזרה", href: "/help", desc: null },
      { icon: Info, label: "אודות", href: "/about", desc: null },
      { icon: Shield, label: "פרטיות", href: "/privacy", desc: null },
      { icon: Sparkles, label: "שימוש ב-AI", href: "/ai-disclosure", desc: null },
    ],
  },
];

export function SidebarMenu({ userCity = "ירושלים", hebrewDate = "", isGuest = true, onClose }: SidebarMenuProps) {
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "להתראות! 👋",
      description: "התנתקת בהצלחה",
    });
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 text-white p-5">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="סגור תפריט"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg">
              {isGuest ? "שלום, אורח! 👋" : "שלום! 👋"}
            </h2>
            <p className="text-sm text-amber-100">
              {userCity} {hebrewDate && `• ${hebrewDate}`}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="flex-1 overflow-y-auto">
        {MENU_SECTIONS.map((section) => (
          <div key={section.title} className="py-3 px-4 border-b border-gray-100 last:border-b-0">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-3 font-medium">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== "/" && location.pathname.startsWith(item.href.split("?")[0]));
                
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                      isActive
                        ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900"
                        : "hover:bg-amber-50 text-gray-700"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isActive ? "text-amber-600" : "text-gray-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium text-sm",
                          isActive && "text-amber-900"
                        )}>
                          {item.label}
                        </span>
                        {item.hasAI && (
                          <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                            AI
                          </span>
                        )}
                      </div>
                      {item.desc && (
                        <span className="text-xs text-gray-400">{item.desc}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        {isGuest ? (
          <Link to="/auth" onClick={onClose}>
            <Button variant="outline" className="w-full gap-2">
              <User className="w-4 h-4" />
              התחבר עם Google
            </Button>
          </Link>
        ) : (
          <Button variant="outline" className="w-full gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            התנתק
          </Button>
        )}
      </div>
    </div>
  );
}

interface HamburgerMenuProps {
  userCity?: string;
  hebrewDate?: string;
  isGuest?: boolean;
}

export function HamburgerMenu({ userCity, hebrewDate, isGuest }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "w-11 h-11 rounded-xl border border-gray-200 bg-white",
          "flex flex-col justify-center items-center gap-1.5",
          "hover:bg-amber-50 hover:border-amber-300 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        )}
        aria-label="פתח תפריט"
        aria-expanded={isOpen}
      >
        <span className="w-5 h-0.5 bg-gray-600 rounded-full" />
        <span className="w-5 h-0.5 bg-gray-600 rounded-full" />
        <span className="w-5 h-0.5 bg-gray-600 rounded-full" />
      </button>

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-[300px] max-w-[85vw] bg-white shadow-2xl z-50",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="תפריט ראשי"
      >
        <SidebarMenu
          userCity={userCity}
          hebrewDate={hebrewDate}
          isGuest={isGuest}
          onClose={() => setIsOpen(false)}
        />
      </aside>
    </>
  );
}

export default HamburgerMenu;
