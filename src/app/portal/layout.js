import { redirect } from "next/navigation"
import { createServer } from "@/lib/supabase-server"
import TopStrip from "@/components/ui/TopStrip"

export default async function PortalLayout({ children }) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <TopStrip />
      <main style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
        {children}
      </main>
    </div>
  )
}
