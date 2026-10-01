// Browser-only guest mode (used when Supabase anonymous sign-ins are disabled).
const KEY = "guest_mode";
const CITY_KEY = "guest_city";

export const isGuestMode = () => localStorage.getItem(KEY) === "1";
export const enableGuestMode = () => localStorage.setItem(KEY, "1");
export const disableGuestMode = () => localStorage.removeItem(KEY);
export const getGuestCity = () => localStorage.getItem(CITY_KEY) || "Jerusalem";
export const setGuestCity = (city: string) => localStorage.setItem(CITY_KEY, city);
