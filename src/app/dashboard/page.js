"use client"

import { createClient } from "@/lib/supabase-browser";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GestaoEdificios from "@/components/features/GestaoEdificios";
import { getMetricas } from "@/lib/queries-client";

export default function Dashboard() {
  const [metricas, setMetricas] = useState({})

  const router = useRouter()

  useEffect(() => {
    async function grabMetricas() {
      setMetricas(await getMetricas())
    }
    grabMetricas()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <main>
      <button onClick={handleLogout}>Sair</button>
      <p>Unidades Disponiveis: {metricas.unidadesDisponiveis}</p>
      <p>Unidades Alugadas: {metricas.unidadesAlugadas}</p>
      <p>Contratos Ativos: {metricas.contratosAtivos}</p>
      <p>Parcelas Pendentes: {metricas.parcelasPendentes}</p>
      <p>Parcelas Vencidas: {metricas.parcelasVencidas}</p>

      <GestaoEdificios>

      </GestaoEdificios>
    </main>
  )
}