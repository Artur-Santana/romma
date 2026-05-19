import TopStrip from "@/components/ui/TopStrip"
import OwnerSidebar from "@/components/ui/OwnerSidebar"

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopStrip />
      <div style={{ display: "flex", height: "calc(100vh - 24px)" }}>
        <div className="romma-sidebar-wrapper">
          <OwnerSidebar badges={{}} />
        </div>
        <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
