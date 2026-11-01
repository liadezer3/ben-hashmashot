import { useEffect, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ObservanceProvider } from "@/contexts/ObservanceContext";
import { ContactBar } from "@/components/ContactBar";
import { ViralShareButton } from "@/components/ViralShareButton";
import { VoiceCommandBar } from "@/components/VoiceCommandBar";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import NotFound from "@/pages/NotFound";
import { reportLovableError } from "@/lib/lovable-error-reporting";
// ported from main.tsx
import "@/i18n";
import appCss from "../styles.css?url";

const SITE_TITLE = "בין השמשות – זמני שבת וחג, התראות ותיעוד רגעי השבת";
const SITE_DESC =
  "אתר בין השמשות מספק זמני כניסת ויציאת שבת וחג מדויקים לפי מיקום, התראות מותאמות אישית, מפת בתי כנסת ותיעוד רגעים קהילתיים של שבת וחג.";

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "בין השמשות",
  alternateName: "ben-hashmashot",
  url: "https://ben-hashmashot.com/",
  inLanguage: "he",
};

const appLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "בין השמשות",
  alternateName: "Ben Hashmashot",
  url: "https://ben-hashmashot.com",
  description: "אפליקציה לתזכורות שבת וחגים - קבלו התראות על זמני הדלקת נרות וצאת שבת",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web, iOS, Android",
  offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" },
  author: { "@type": "Person", name: "ליעד עזר", email: "liadezer3@gmail.com" },
  inLanguage: "he",
  audience: { "@type": "Audience", audienceType: "Jewish community" },
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESC },
      {
        name: "keywords",
        content:
          "תזכורת כניסת שבת, התראת שבת SMS, זמני שבת וואטסאפ, הדלקת נרות, יציאת שבת, אפליקציית שבת, זמני שבת ירושלים, זמני שבת תל אביב, הבדלה, מוצאי שבת, candle lighting times, shabbat reminder",
      },
      { name: "author", content: "בין השמשות - Ben Hashmashot" },
      { name: "robots", content: "index, follow" },
      { property: "og:locale", content: "he_IL" },
      { name: "theme-color", content: "#f59e0b" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "בין השמשות" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ben-hashmashot.com/" },
      { property: "og:title", content: "בין השמשות - תזכורת שבת חכמה 🕯️" },
      {
        property: "og:description",
        content: "לא תשכחו יותר להדליק נרות! קבלו תזכורת אוטומטית על כניסת שבת - SMS, וואטסאפ או מייל. חינם ומדויק לפי המיקום שלכם.",
      },
      { property: "og:image", content: "https://ben-hashmashot.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "בין השמשות - אפליקציית תזכורת שבת" },
      { property: "og:site_name", content: "בין השמשות" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:url", content: "https://ben-hashmashot.com/" },
      { name: "twitter:title", content: "בין השמשות - תזכורת שבת חכמה 🕯️" },
      {
        name: "twitter:description",
        content: "לא תשכחו יותר להדליק נרות! תזכורת אוטומטית על כניסת שבת - SMS, וואטסאפ או מייל.",
      },
      { name: "twitter:image", content: "https://ben-hashmashot.com/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(websiteLd) },
      { type: "application/ld+json", children: JSON.stringify(appLd) },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // ported from main.tsx: offline + push service worker (published site only)
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const host = window.location.hostname.toLowerCase();
    const isPreview =
      !import.meta.env.PROD ||
      window.self !== window.top ||
      /^(id-preview|preview)(-[a-z0-9]+)?--/.test(host) ||
      host.endsWith("lovableproject.com") ||
      host === "localhost";
    if (isPreview) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ObservanceProvider>
          <Toaster />
          <Sonner />
          <ContactBar position="top" />
          <div className="pt-8 pb-8">
            <Outlet />
          </div>
          <ContactBar position="bottom" />
          <ViralShareButton />
          <VoiceCommandBar />
          <PWAInstallBanner />
        </ObservanceProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function RootError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">העמוד לא נטען</h1>
        <p className="text-muted-foreground">משהו השתבש. נסו שוב או חזרו לדף הבית.</p>
        <div className="flex gap-2 justify-center">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            נסו שוב
          </button>
          <Link to="/" className="px-4 py-2 rounded-md border border-border">
            לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}
