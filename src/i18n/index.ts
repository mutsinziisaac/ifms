// i18next bootstrap. Imported for its side effect once, early, in main.tsx.
// Language is detected from / persisted to localStorage under "ifms.lang"
// (matching the app's "ifms.*" key convention) and falls back to English.
import i18n from "i18next"
import type { ParseKeys } from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import { am } from "./locales/am"
import { en } from "./locales/en"

export const SUPPORTED_LANGUAGES = ["en", "am"] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export const LANGUAGE_STORAGE_KEY = "ifms.lang"

/** Union of every valid translation key — for typing stored t() keys. */
export type TranslationKey = ParseKeys

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    // Treat "am-ET" etc. as "am".
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
  })

// Keep <html lang> in sync so the Ethiopic font fallback and accessibility
// tooling reflect the active language.
function syncHtmlLang(lng: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng
  }
}
syncHtmlLang(i18n.resolvedLanguage ?? i18n.language ?? "en")
i18n.on("languageChanged", syncHtmlLang)

// Cross-tab sync: mirror the theme provider's behaviour so changing language in
// one tab updates the others.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (
      event.storageArea === localStorage &&
      event.key === LANGUAGE_STORAGE_KEY &&
      event.newValue &&
      event.newValue !== i18n.language
    ) {
      void i18n.changeLanguage(event.newValue)
    }
  })
}

export default i18n
