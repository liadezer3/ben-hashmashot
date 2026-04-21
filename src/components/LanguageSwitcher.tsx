import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const change = (lng: "he" | "en") => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          title={t("header.language")}
          aria-label={t("header.language")}
        >
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => change("he")}
          className={i18n.language === "he" ? "font-bold" : ""}
        >
          🇮🇱 עברית
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => change("en")}
          className={i18n.language === "en" ? "font-bold" : ""}
        >
          🇺🇸 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
