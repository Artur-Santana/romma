import { redirect } from "next/navigation"
import { createServer } from "@/lib/supabase-server"
import TopStrip from "@/components/ui/TopStrip"

export default async function PortalLayout({ children }) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopStrip />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
