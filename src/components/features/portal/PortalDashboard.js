'use client'

export default function PortalDashboard() {
  return (
    <div className="romma-page bg-background min-h-full px-12 pt-12 pb-20">
      <span className="eyebrow eyebrow--indigo">PORTAL DO LOCATÁRIO</span>
      <h1 className="font-display font-bold text-[48px] leading-none tracking-[-2.4px] text-fg-1 m-0">Seu Contrato.</h1>
      <p className="font-mono text-[11px] text-fg-4 mt-2">Acesso restrito — contrato e histórico de parcelas.</p>
      <div data-testid="parcelas-table-region" className="mt-8 font-mono text-[12px] text-fg-4">Carregando...</div>
    </div>
  )
}
