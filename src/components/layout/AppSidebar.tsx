import { NavLink, useLocation } from "react-router-dom"
import {
  ChevronDown,
  FileText,
  Hexagon,
  LayoutDashboard,
  RadioTower,
  Route,
  Shield,
  ShieldAlert,
  Siren,
  SlidersHorizontal,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import type { TranslationKey } from "@/i18n"
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

// `titleKey`/`labelKey` are i18n keys resolved with t() at render. `as const`
// keeps them as literals so the typed t() accepts them.
interface NavItem {
  titleKey: TranslationKey
  path: string
  icon: LucideIcon
}

interface NavGroup {
  labelKey: TranslationKey
  collapsible?: boolean
  items: NavItem[]
}

const NAV_GROUPS = [
  {
    labelKey: "nav.groups.management",
    items: [
      { titleKey: "nav.items.overview", path: "/", icon: LayoutDashboard },
      { titleKey: "nav.items.fleet", path: "/fleet", icon: Truck },
      { titleKey: "nav.items.events", path: "/events", icon: Siren },
      { titleKey: "nav.items.providers", path: "/providers", icon: RadioTower },
    ],
  },
  {
    labelKey: "nav.groups.analytics",
    items: [
      { titleKey: "nav.items.reports", path: "/reports", icon: FileText },
      { titleKey: "nav.items.incidents", path: "/incidents", icon: ShieldAlert },
    ],
  },
  {
    labelKey: "nav.groups.configuration",
    collapsible: true,
    items: [
      { titleKey: "nav.items.geofencing", path: "/geozones", icon: Hexagon },
      { titleKey: "nav.items.routes", path: "/routes", icon: Route },
      {
        titleKey: "nav.items.eventRules",
        path: "/config/events",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    labelKey: "nav.groups.administration",
    collapsible: true,
    items: [
      { titleKey: "nav.items.users", path: "/admin/users", icon: Users },
      { titleKey: "nav.items.roles", path: "/admin/roles", icon: Shield },
    ],
  },
] satisfies NavGroup[]

function NavMenu({
  items,
  isActive,
}: {
  items: readonly NavItem[]
  isActive: (path: string) => boolean
}) {
  const { t } = useTranslation()
  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon
        const active = isActive(item.path)
        const title = t(item.titleKey)
        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={title}
              className={cn(
                "relative",
                active &&
                  "before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary [&>svg]:text-sidebar-primary"
              )}
            >
              <NavLink to={item.path}>
                <Icon />
                <span>{title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

export function AppSidebar() {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path)

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1">
          <img
            src="/logo.jpeg"
            alt={t("nav.brand")}
            className="size-9 rounded-lg object-cover ring-1 ring-sidebar-primary/60"
          />
          <div className="grid group-data-[collapsible=icon]:hidden">
            <span className="font-heading leading-none font-bold">
              {t("nav.brand")}
            </span>
            <span className="mt-1 text-[10px] leading-tight text-sidebar-foreground/70">
              {t("nav.brandSubtitle")}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) =>
          group.collapsible ? (
            <Collapsible
              key={group.labelKey}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel asChild>
                  <CollapsibleTrigger>
                    {t(group.labelKey)}
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
            <SidebarGroup key={group.labelKey}>
              <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavMenu items={group.items} isActive={isActive} />
              </SidebarGroupContent>
            </SidebarGroup>
          )
        )}
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 py-1 text-[10px] leading-tight text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          {t("nav.footer")}
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
