import { Route, Routes } from "react-router-dom"

import { RequireAuth } from "@/auth/RequireAuth"
import { AppShell } from "@/components/layout/AppShell"
import { AdminRolesPage } from "@/features/admin/AdminRolesPage"
import { AdminUsersPage } from "@/features/admin/AdminUsersPage"
import { LoginPage } from "@/features/auth/LoginPage"
import { DashboardPage } from "@/features/dashboard/DashboardPage"
import { DriverDetailPage } from "@/features/drivers/DriverDetailPage"
import { DriversPage } from "@/features/drivers/DriversPage"
import { EventRulesPage } from "@/features/events/EventRulesPage"
import { EventsPage } from "@/features/events/EventsPage"
import { FinesPage } from "@/features/fines/FinesPage"
import { GeozonesPage } from "@/features/geozones/GeozonesPage"
import { IncidentsPage } from "@/features/incidents/IncidentsPage"
import { MaintenancePage } from "@/features/maintenance/MaintenancePage"
import { MaintenanceTaskDetailPage } from "@/features/maintenance/MaintenanceTaskDetailPage"
import { ProviderDetailPage } from "@/features/providers/ProviderDetailPage"
import { ProvidersPage } from "@/features/providers/ProvidersPage"
import { ReportsPage } from "@/features/reports/ReportsPage"
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
        <Route path="fleet" element={<VehiclesPage />} />
        <Route path="fleet/:id" element={<VehicleDetailPage />} />
        <Route path="drivers" element={<DriversPage />} />
        <Route path="drivers/:id" element={<DriverDetailPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="providers/:id" element={<ProviderDetailPage />} />
        <Route path="geozones" element={<GeozonesPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="config/events" element={<EventRulesPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="maintenance/:id" element={<MaintenanceTaskDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="fines" element={<FinesPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/roles" element={<AdminRolesPage />} />
      </Route>
    </Routes>
  )
}

export default App
