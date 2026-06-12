"use client"

import { usePathname, useRouter } from "next/navigation"
import { MobileTopBar, MobileBottomNav } from "@/components/ui/MobileNav"
import TopStrip from "@/components/ui/TopStrip"
import OwnerSidebar from "@/components/ui/OwnerSidebar"

const NAV_ITEMS = [
  { href: "/dashboard",              label: "Início",     code: "OVW" },
  { href: "/dashboard/unidades",     label: "Unidades",   code: "UNI" },
  { href: "/dashboard/contratos",    label: "Contratos",  code: "CTR" },
  { href: "/dashboard/locatarios",   label: "Locatários", code: "LOC" },
]

const ROUTE_TITLES = {
  "/dashboard":             "Dashboard",
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
    <>
      {/* Desktop chrome — romma-desktop-only hidden at ≤768px via globals.css media query */}
      <div className="romma-desktop-only">
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <TopStrip />
        <div style={{ display: "flex", height: "calc(100vh - 24px)" }}>
          <div className="romma-sidebar-wrapper">
            <OwnerSidebar badges={{}} />
          </div>
          <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
            <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px" }}>
              {children}
            </div>
          </main>
        </div>
        </div>
      </div>

      {/* Mobile chrome — romma-mobile-only shown at ≤768px via globals.css */}
      <div className="romma-mobile-only">
        <MobileTopBar title={title} onBack={onBack} />
        <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
          {children}
        </main>
        <MobileBottomNav items={NAV_ITEMS} />
      </div>
    </>
  )
}
