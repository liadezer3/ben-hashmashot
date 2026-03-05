import { useEffect, useRef } from "react";
import { ShabbatModePhase } from "@/hooks/useShabbatMode";

/**
 * Automatically switches between dark/light mode based on Shabbat phase.
 * - Enters dark mode at candle lighting (shabbat phase)
 * - Returns to previous theme at havdalah (motzei-shabbat)
 */
export const useAutoTheme = (phase: ShabbatModePhase) => {
  const previousTheme = useRef<string | null>(null);

  useEffect(() => {
    const autoThemeEnabled = localStorage.getItem("auto_shabbat_theme") !== "false";
    if (!autoThemeEnabled) return;

    if (phase === "shabbat") {
      // Save current theme and switch to dark
      const currentTheme = localStorage.getItem("theme") || "light";
      if (currentTheme !== "dark") {
        previousTheme.current = currentTheme;
        localStorage.setItem("theme_before_shabbat", currentTheme);
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      }
    } else if (phase === "motzei-shabbat") {
      // Restore previous theme
      const savedPrevious = previousTheme.current || localStorage.getItem("theme_before_shabbat");
      if (savedPrevious && savedPrevious !== "dark") {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", savedPrevious);
        localStorage.removeItem("theme_before_shabbat");
        previousTheme.current = null;
      }
    }
  }, [phase]);
};
