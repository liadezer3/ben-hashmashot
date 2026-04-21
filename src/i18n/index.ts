import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import he from "./locales/he.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: he },
      en: { translation: en },
    },
    fallbackLng: "he",
    supportedLngs: ["he", "en"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "app_language",
      caches: ["localStorage"],
    },
  });

// Set document direction & lang based on language
const applyDir = (lng: string) => {
  const dir = lng === "he" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", dir);
  document.documentElement.setAttribute("lang", lng);
};
applyDir(i18n.language || "he");
i18n.on("languageChanged", applyDir);

export default i18n;
