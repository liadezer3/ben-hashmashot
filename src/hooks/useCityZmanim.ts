import { useEffect, useState } from "react";
import { getShabbatZmanim, type ShabbatZmanimResult } from "@/lib/shabbatZmanim";

const KEY = "ben-hashmashot:extras-city";

/** Client-side Shabbat times for a chosen Israeli city (remembered in the browser). */
export function useCityZmanim() {
  const [city, setCityState] = useState("jerusalem");
  const [z, setZ] = useState<ShabbatZmanimResult | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) setCityState(saved);
  }, []);

  useEffect(() => {
    setZ(getShabbatZmanim(city));
  }, [city]);

  const setCity = (c: string) => {
    localStorage.setItem(KEY, c);
    setCityState(c);
  };
  return { city, setCity, z };
}
