import { NavLink, useLocation } from "react-router-dom"
import {
  ChevronDown,
  Hexagon,
  IdCard,
  LayoutDashboard,
  RadioTower,
  Route,
  Siren,
  SlidersHorizontal,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  path: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  collapsible?: boolean
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Management",
    items: [
      { title: "Overview", path: "/", icon: LayoutDashboard },
      { title: "Fleet", path: "/fleet", icon: Truck },
      { title: "Drivers", path: "/drivers", icon: IdCard },
      { title: "Events", path: "/events", icon: Siren },
      { title: "Providers", path: "/providers", icon: RadioTower },
      { title: "Maintenance", path: "/maintenance", icon: Wrench },
    ],
  },
  {
    label: "Configuration",
    collapsible: true,
    items: [
      { title: "Geofencing", path: "/geozones", icon: Hexagon },
      { title: "Routes", path: "/routes", icon: Route },
      { title: "Event Rules", path: "/config/events", icon: SlidersHorizontal },
    ],
  },
]

function NavMenu({
  items,
  isActive,
}: {
  items: NavItem[]
  isActive: (path: string) => boolean
}) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon
        const active = isActive(item.path)
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={item.title}
              className={cn(
                "relative",
                active &&
                  "before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary [&>svg]:text-sidebar-primary"
              )}
            >
              <NavLink to={item.path}>
                <Icon />
                <span>{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

export function AppSidebar() {
  const location = useLocation()

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path)

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1">
          <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-800 ring-1 ring-sidebar-primary/60">
            <Truck className="size-5 text-white" />
          </div>
          <div className="grid group-data-[collapsible=icon]:hidden">
            <span className="font-heading leading-none font-bold">IFMS</span>
            <span className="mt-1 text-[10px] leading-tight text-sidebar-foreground/70">
              Ministry of Transport &amp; Logistics
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) =>
          group.collapsible ? (
            <Collapsible
              key={group.label}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger>
                    {group.label}
                    <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <NavMenu items={group.items} isActive={isActive} />
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ) : (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavMenu items={group.items} isActive={isActive} />
              </SidebarGroupContent>
            </SidebarGroup>
          )
        )}
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 py-1 text-[10px] leading-tight text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          IFMS v1.0 · Federal Democratic Republic of Ethiopia
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
