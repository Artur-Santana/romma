'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { getLocatarioByUserId, getContratoAtivoByLocatario, getParcelasPortal } from "@/lib/queries-client"
import ContratoCard from "./ContratoCard"
import ParcelsTable from "./ParcelsTable"
import LogoutButton from "@/components/ui/LogoutButton"
import { Skeleton } from "@/components/ui/skeleton"

export default function PortalDashboard() {
  const supabase = createClient()
  const [locatario, setLocatario] = useState(null)
  const [contrato, setContrato] = useState(null)
  const [parcelas, setParcelas] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const loc = await getLocatarioByUserId(user.id)
        setLocatario(loc)
        if (!loc) { setLoading(false); return }
        const ct = await getContratoAtivoByLocatario(loc.id)
        setContrato(ct)
        if (!ct) { setLoading(false); return }
        const parc = await getParcelasPortal(ct.id)
        setParcelas(parc ?? [])
      } catch (e) {
        setErro(e.message ?? "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="romma-page bg-background min-h-full px-12 pt-12 pb-20">
      <div className="flex justify-between items-center">
        <span className="eyebrow eyebrow--indigo">PORTAL DO LOCATÁRIO</span>
        <LogoutButton />
      </div>
      <h1 className="font-display font-bold text-[72px] leading-none tracking-[-2.4px] text-fg-1 m-0">Seu Contrato.</h1>
      <p className="font-mono text-[17px] text-fg-4 mt-2">Acesso restrito — contrato e histórico de parcelas.</p>

      {erro ? (
        <div className="px-4 py-[10px] mt-8 bg-[var(--danger-bg2)] border border-danger-fg font-mono text-[18px] text-danger-fg">
          <strong>Erro ao carregar dados</strong><br />Não foi possível buscar seu contrato. Tente recarregar a página.
        </div>
      ) : loading ? (
        <div className="mt-8 flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-none" />
          <Skeleton className="h-8 w-full rounded-none" />
          <Skeleton className="h-8 w-full rounded-none" />
          <Skeleton className="h-8 w-full rounded-none" />
          <Skeleton className="h-8 w-full rounded-none" />
        </div>
      ) : !contrato ? (
        <div className="mt-8">
          <h2 className="font-display font-bold text-[42px] text-fg-1">Nenhum contrato ativo</h2>
          <p className="font-mono text-[18px] text-fg-4 mt-2">Você não possui contrato ativo. Entre em contato com o proprietário.</p>
        </div>
      ) : (
        <>
          <div className="mt-8">
            <ContratoCard contrato={contrato} />
          </div>
          <ParcelsTable parcelas={parcelas} />
        </>
      )}
    </div>
  )
}
