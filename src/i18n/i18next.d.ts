// Type-safe translation keys: `t("…")` autocompletes and a typo or removed key
// fails the build. The resource shape is the English tree (the source of truth).
import "i18next"

import type { Resources } from "./locales/en"

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation"
    resources: {
      translation: Resources
    }
  }
}
