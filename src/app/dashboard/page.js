"use client"

import supabase from "@/lib/supabase";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GestaoEdificios from "@/components/features/GestaoEdificios";
import { getMetricas } from "@/lib/queries-client";

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null)
  const [metricas, setMetricas] = useState({})
  
  const router = useRouter()

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUsuario(data.user)
      }
    }
    async function grabMetricas() {
      setMetricas(await getMetricas())
    }
    verificarSessao()
    grabMetricas()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <main>
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