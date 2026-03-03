import { createContext, useContext, useMemo, ReactNode } from "react";
import { useUserPreferences, ObservanceLevel } from "@/hooks/useUserPreferences";

interface ObservanceContextType {
  observanceLevel: ObservanceLevel;
  isReligious: boolean;
  isTraditional: boolean;
  isSecular: boolean;
  /** Show full halachic content (parsha, daf yomi, zmanim details) */
  showReligiousContent: boolean;
  /** Show lite religious content (candle lighting, basic times) */
  showBasicTimes: boolean;
  /** Show community/cultural features */
  showCommunityFeatures: boolean;
  isLoading: boolean;
}

const ObservanceContext = createContext<ObservanceContextType>({
  observanceLevel: "traditional",
  isReligious: false,
  isTraditional: true,
  isSecular: false,
  showReligiousContent: true,
  showBasicTimes: true,
  showCommunityFeatures: true,
  isLoading: true,
});

export function ObservanceProvider({ children }: { children: ReactNode }) {
  const { preferences, isLoading } = useUserPreferences();

  const value = useMemo<ObservanceContextType>(() => {
    const level = preferences?.observance_level ?? "traditional";
    return {
      observanceLevel: level,
      isReligious: level === "religious",
      isTraditional: level === "traditional",
      isSecular: level === "secular",
      // Religious + traditional see full Torah content; secular does not
      showReligiousContent: level !== "secular",
      // Everyone sees basic Shabbat times
      showBasicTimes: true,
      // Everyone sees community features
      showCommunityFeatures: true,
      isLoading,
    };
  }, [preferences?.observance_level, isLoading]);

  return (
    <ObservanceContext.Provider value={value}>
      {children}
    </ObservanceContext.Provider>
  );
}

export const useObservance = () => useContext(ObservanceContext);
