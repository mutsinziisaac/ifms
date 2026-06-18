// English resource tree — the source of truth for keys. `am` is typed against
// this (`typeof en`), so a missing/renamed Amharic key fails `tsc -b`.
import admin from "./en/admin"
import auth from "./en/auth"
import common from "./en/common"
import dashboard from "./en/dashboard"
import enums from "./en/enums"
import events from "./en/events"
import forms from "./en/forms"
import geozones from "./en/geozones"
import incidents from "./en/incidents"
import nav from "./en/nav"
import providers from "./en/providers"
import reports from "./en/reports"
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
  events,
  providers,
  geozones,
  routes,
  reports,
  incidents,
  admin,
}

export type Resources = typeof en
