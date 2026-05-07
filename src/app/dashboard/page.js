"use client"

import { useEffect } from "react";
import { useState } from "react";
import GestaoEdificios from "@/components/features/GestaoEdificios";
import { getMetricas } from "@/lib/queries-client";

export default function Dashboard() {
  const [metricas, setMetricas] = useState({})

  useEffect(() => {
    async function grabMetricas() {
      setMetricas(await getMetricas())
    }
    grabMetricas()
  }, [])

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