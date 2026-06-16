// English resource tree — the source of truth for keys. `am` is typed against
// this (`typeof en`), so a missing/renamed Amharic key fails `tsc -b`.
import auth from "./en/auth"
import common from "./en/common"
import dashboard from "./en/dashboard"
import drivers from "./en/drivers"
import enums from "./en/enums"
import events from "./en/events"
import forms from "./en/forms"
import geozones from "./en/geozones"
import maintenance from "./en/maintenance"
import nav from "./en/nav"
import providers from "./en/providers"
import routes from "./en/routes"
import topbar from "./en/topbar"
import vehicles from "./en/vehicles"

export const en = {
  common,
  nav,
  topbar,
  auth,
  enums,
  forms,
  dashboard,
  vehicles,
  drivers,
  events,
  providers,
  geozones,
  routes,
  maintenance,
}

export type Resources = typeof en
