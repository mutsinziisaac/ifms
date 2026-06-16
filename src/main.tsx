import { StrictMode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import "./i18n"
import App from "./App.tsx"
import { AuthProvider } from "@/auth/auth-context"
import { MapsProvider } from "@/components/map/MapsProvider"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner"
import { queryClient } from "@/lib/query-client"
import { SimulationProvider } from "@/sim/SimulationProvider"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <MapsProvider>
          <SimulationProvider>
            <BrowserRouter>
              <AuthProvider>
                <App />
                <Toaster richColors position="top-right" />
              </AuthProvider>
            </BrowserRouter>
          </SimulationProvider>
        </MapsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
