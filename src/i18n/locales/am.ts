// Amharic resource tree. Typed as `typeof en` so its shape must match exactly —
// any missing key is a compile error.
import type { Resources } from "./en"
import admin from "./am/admin"
import auth from "./am/auth"
import common from "./am/common"
import dashboard from "./am/dashboard"
import enums from "./am/enums"
import events from "./am/events"
import forms from "./am/forms"
import geozones from "./am/geozones"
import incidents from "./am/incidents"
import nav from "./am/nav"
import providers from "./am/providers"
import reports from "./am/reports"
import routes from "./am/routes"
import topbar from "./am/topbar"
import vehicles from "./am/vehicles"

export const am: Resources = {
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
