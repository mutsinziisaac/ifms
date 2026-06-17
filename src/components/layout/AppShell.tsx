import { Outlet } from "react-router-dom"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Topbar } from "@/components/layout/Topbar"

export function AppShell() {
  return (
    // This sidebar variant renders Radix tooltips for collapsed menu items but
    // does not bundle a TooltipProvider, so we provide one for the whole shell.
    <TooltipProvider delayDuration={0}>
      <SidebarProvider
        className="h-svh"
        style={{ "--sidebar-width": "13rem" } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="overflow-hidden md:peer-data-[variant=inset]:m-3 md:peer-data-[variant=inset]:rounded-2xl md:peer-data-[variant=inset]:shadow-lg">
          <Topbar />
          <main className="min-h-0 flex-1 overflow-auto px-6 pt-4 pb-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
