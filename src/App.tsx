import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ObservanceProvider } from "@/contexts/ObservanceContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Widget from "./pages/Widget";
import Dashboard from "./pages/Dashboard";
import InvitePage from "./pages/InvitePage";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Landing from "./pages/Landing";
import Unsubscribe from "./pages/Unsubscribe";
import { ContactBar } from "./components/ContactBar";
import { ViralShareButton } from "./components/ViralShareButton";
import { VoiceCommandBar } from "./components/VoiceCommandBar";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ObservanceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ContactBar position="top" />
          <div className="pt-8 pb-8">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/widget" element={<Widget />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invite/:code" element={<InvitePage />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/sms-shabbat" element={<Landing />} />
            <Route path="/whatsapp-shabbat" element={<Landing />} />
            <Route path="/candle-lighting-reminder" element={<Landing />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </div>
          <ContactBar position="bottom" />
          <ViralShareButton />
          <VoiceCommandBar />
        </BrowserRouter>
      </ObservanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
