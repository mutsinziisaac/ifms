import { Route, Routes } from "react-router-dom"

import { RequireAuth } from "@/auth/RequireAuth"
import { AppShell } from "@/components/layout/AppShell"
import { LoginPage } from "@/features/auth/LoginPage"
import { DashboardPage } from "@/features/dashboard/DashboardPage"
import { DriverDetailPage } from "@/features/drivers/DriverDetailPage"
import { DriversPage } from "@/features/drivers/DriversPage"
import { GeozonesPage } from "@/features/geozones/GeozonesPage"
import { MaintenancePage } from "@/features/maintenance/MaintenancePage"
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
        <Route path="geozones" element={<GeozonesPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
      </Route>
    </Routes>
  )
}

export default App
