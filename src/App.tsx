import { Route, Routes } from "react-router-dom"

import { RequireAuth } from "@/auth/RequireAuth"
import { AppShell } from "@/components/layout/AppShell"
import { AdminRolesPage } from "@/features/admin/AdminRolesPage"
import { AdminUsersPage } from "@/features/admin/AdminUsersPage"
import { LoginPage } from "@/features/auth/LoginPage"
import { DashboardPage } from "@/features/dashboard/DashboardPage"
import { EventRulesPage } from "@/features/events/EventRulesPage"
import { EventRuleWizardPage } from "@/features/events/EventRuleWizardPage"
import { EventsPage } from "@/features/events/EventsPage"
import { GeozoneEditorPage } from "@/features/geozones/GeozoneEditorPage"
import { GeozonesPage } from "@/features/geozones/GeozonesPage"
import { IncidentsPage } from "@/features/incidents/IncidentsPage"
import { LiveMapPage } from "@/features/live/LiveMapPage"
import { ProviderDetailPage } from "@/features/providers/ProviderDetailPage"
import { ProvidersPage } from "@/features/providers/ProvidersPage"
import { ReportsPage } from "@/features/reports/ReportsPage"
import { RouteEditorPage } from "@/features/routes/RouteEditorPage"
import { RoutesPage } from "@/features/routes/RoutesPage"
import { VehicleDetailPage } from "@/features/vehicles/VehicleDetailPage"
import { VehiclesPage } from "@/features/vehicles/VehiclesPage"

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="live-map" element={<LiveMapPage />} />
        <Route path="fleet" element={<VehiclesPage />} />
        <Route path="fleet/:id" element={<VehicleDetailPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="providers/:id" element={<ProviderDetailPage />} />
        <Route path="geozones" element={<GeozonesPage />} />
        <Route path="geozones/new" element={<GeozoneEditorPage />} />
        <Route path="geozones/:id/edit" element={<GeozoneEditorPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="routes/new" element={<RouteEditorPage />} />
        <Route path="routes/:id/edit" element={<RouteEditorPage />} />
        <Route path="config/events" element={<EventRulesPage />} />
        <Route path="config/events/new" element={<EventRuleWizardPage />} />
        <Route
          path="config/events/:id/edit"
          element={<EventRuleWizardPage />}
        />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/roles" element={<AdminRolesPage />} />
      </Route>
    </Routes>
  )
}

export default App
