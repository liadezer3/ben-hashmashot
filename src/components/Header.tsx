import { User, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.jpg";
import { ThemeToggle } from "./ThemeToggle";
import { HebrewDateDisplay } from "./HebrewDateDisplay";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

export const Header = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        // Check admin status
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .single();
        
        setIsAdmin(!!roles);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      
      if (session) {
        setTimeout(async () => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .single();
          
          setIsAdmin(!!roles);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="bg-gradient-shabbat text-primary-foreground shadow-soft">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 justify-center">
            <img src={logo} alt={t("app.name")} className="w-12 h-12 rounded-lg" />
            <h1 className="text-3xl md:text-4xl font-bold cursor-pointer" onClick={() => navigate("/")}>
              {t("app.title")}
            </h1>
          </div>
          <div className="absolute left-4 flex gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/admin")}
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                    title={t("header.adminTitle")}
                  >
                    <Shield className="h-6 w-6" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/profile")}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <User className="h-6 w-6" />
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                onClick={() => navigate("/auth")}
                className="font-semibold"
              >
                {t("nav.login")}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 mt-3">
          <HebrewDateDisplay variant="header" />
          <p className="text-primary-foreground/90 text-lg">
            {t("app.subtitle")}
          </p>
        </div>
      </div>
    </header>
  );
};
