"use client"

import { usePathname, useRouter } from "next/navigation"
import { MobileTopBar, MobileBottomNav } from "@/components/ui/MobileNav"
import TopStrip from "@/components/ui/TopStrip"
import OwnerSidebar from "@/components/ui/OwnerSidebar"

const NAV_ITEMS = [
  { href: "/dashboard",              label: "Início",     code: "OVW" },
  { href: "/dashboard/edificios",    label: "Edifícios",  code: "ED"  },
  { href: "/dashboard/unidades",     label: "Unidades",   code: "UNI" },
  { href: "/dashboard/contratos",    label: "Contratos",  code: "CTR" },
  { href: "/dashboard/locatarios",   label: "Locatários", code: "LOC" },
]

const ROUTE_TITLES = {
  "/dashboard":             "Dashboard",
  "/dashboard/edificios":   "Edifícios",
  "/dashboard/unidades":    "Unidades",
  "/dashboard/contratos":   "Contratos",
  "/dashboard/locatarios":  "Locatários",
}

export default function DashboardShell({ children }) {
  const pathname = usePathname()
  const router = useRouter()

  const isParcelasRoute = pathname.startsWith("/dashboard/contratos/") && pathname !== "/dashboard/contratos"
  const title = isParcelasRoute ? "Parcelas" : (ROUTE_TITLES[pathname] ?? "Dashboard")
  const onBack = isParcelasRoute ? () => router.back() : undefined

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Desktop TopStrip / Mobile TopBar — toggled via CSS */}
      <div className="romma-desktop-only">
        <TopStrip />
      </div>
      <div className="romma-mobile-only">
        <MobileTopBar title={title} onBack={onBack} />
      </div>

      {/* Content row — sidebar hidden on mobile via CSS */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div className="romma-sidebar-wrapper">
          <OwnerSidebar badges={{}} />
        </div>
        <main style={{ flex: 1, overflow: "auto", minHeight: 0, background: "var(--background)" }}>
          <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px", minHeight: 0 }}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile BottomNav — hidden on desktop via CSS */}
      <div className="romma-mobile-only">
        <MobileBottomNav items={NAV_ITEMS} />
      </div>
    </div>
  )
}
