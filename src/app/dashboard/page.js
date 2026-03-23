"use client"
import supabase from "@/lib/supabase";
import { useEffect } from "react"
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function Dashboard() {
  const [usuario, setUsuario] = useState(null)
  const router = useRouter()
 
  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      }else{
        setUsuario(data.user)
      }
    }
    verificarSessao()
  }, [])
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <main>
      <h1>Pagina de dashboard!</h1>
      <p>Olá {usuario?.email}</p>
      <button onClick={handleLogout}>Sair</button>
    </main>
  )
}
