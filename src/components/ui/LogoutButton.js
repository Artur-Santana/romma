"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"

const supabase = createClient()

function SairButton() {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)
  const [erro, setErro] = useState(false)

  async function handleSair() {
    setSaindo(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setErro(true)
      setSaindo(false)
      return
    }
    router.push("/login")
  }

  return (
    <div>
      <button
        style={{ all: "unset", cursor: "pointer" }}
        className="font-mono text-[10px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors"
        onClick={handleSair}
        disabled={saindo}
      >
        {saindo ? "Saindo..." : "Sair"}
      </button>
      {erro && (
        <p style={{ color: "var(--danger-fg)", fontSize: "10px", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
          Erro ao sair. Recarregue a página.
        </p>
      )}
    </div>
  )
}

export default SairButton
