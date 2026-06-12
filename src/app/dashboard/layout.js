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
          <div style={{ maxWidth: "1570px", margin: "0 auto", padding: "0 24px" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
