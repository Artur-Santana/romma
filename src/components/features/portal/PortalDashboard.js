'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { getLocatarioByUserId, getContratoAtivoByLocatario, getTodasParcelasPortal } from "@/lib/queries-client"
import ContratoCard from "./ContratoCard"
import ProgressoContrato from "./ProgressoContrato"
import ParcelsTable from "./ParcelsTable"
import VencimentoDestaque from "./VencimentoDestaque"
import PixModal from "./PixModal"
import LogoutButton from "@/components/ui/LogoutButton"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function PortalDashboard() {
  const supabase = createClient()
  const [locatario, setLocatario] = useState(null)
  const [contrato, setContrato] = useState(null)
  const [todasParcelas, setTodasParcelas] = useState([])
  const [pixModal, setPixModal] = useState({ open: false, parcela: null })
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
        const todasParc = await getTodasParcelasPortal(ct.id)
        setTodasParcelas(todasParc ?? [])
      } catch (e) {
        setErro(e.message ?? "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function refetchParcelas() {
    if (!contrato) return
    const todasParc = await getTodasParcelasPortal(contrato.id)
    setTodasParcelas(todasParc ?? [])
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--background)", minHeight: "100vh" }}>
      {/* Page body */}
      <div className="r-scroll r-fade" style={{ flex: 1 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "var(--rd-page-y) var(--rd-gutter) 64px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span className="r-eyebrow indigo">Portal do Locatário</span>
            <LogoutButton />
          </div>
          <h1 className="r-title" style={{ fontSize: "var(--rt-title)" }}>Seu Contrato.</h1>
          <p className="r-meta" style={{ marginTop: 6, marginBottom: "var(--rd-block)" }}>
            {locatario?.nome_razao_social
              ? `${locatario.nome_razao_social} · acesso restrito — contrato e histórico de parcelas.`
              : "Acesso restrito — contrato e histórico de parcelas."}
          </p>

          {erro ? (
            <div style={{ padding: "10px 16px", background: "color-mix(in oklch, var(--destructive) 14%, transparent)", border: "1px solid var(--danger-fg)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--danger-fg)" }}>
              <strong>Erro ao carregar dados</strong><br />Não foi possível buscar seu contrato. Tente recarregar a página.
            </div>
          ) : loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Skeleton className="h-40 w-full rounded-none" />
              <Skeleton className="h-16 w-full rounded-none" />
              <Skeleton className="h-8 w-full rounded-none" />
              <Skeleton className="h-8 w-full rounded-none" />
            </div>
          ) : !contrato ? (
            <div>
              <h2 className="r-section">Nenhum contrato ativo</h2>
              <p className="r-meta" style={{ marginTop: 8 }}>Você não possui contrato ativo. Entre em contato com o proprietário.</p>
            </div>
          ) : (
            <>
              {/* Two-column: VencimentoDestaque + ProgressoContrato */}
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "var(--rd-block-sm)", marginBottom: "var(--rd-block)" }}>
                <VencimentoDestaque
                  parcelas={todasParcelas}
                  contrato={contrato}
                  onPagar={(parcela) => setPixModal({ open: true, parcela })}
                />
                <ProgressoContrato
                  parcelas={todasParcelas}
                  contrato={contrato}
                />
              </div>

              {/* ContratoCard — flat info grid */}
              <div style={{ marginBottom: "var(--rd-block)" }}>
                <ContratoCard contrato={contrato} />
              </div>

              {/* Histórico de Parcelas */}
              <ParcelsTable
                parcelas={todasParcelas}
                locatario={locatario}
                contrato={contrato}
              />

              <PixModal
                open={pixModal.open}
                parcela={pixModal.parcela}
                contrato={contrato}
                onClose={() => setPixModal({ open: false, parcela: null })}
                onSucesso={async () => { await refetchParcelas(); toast.success("Pagamento registrado") }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
