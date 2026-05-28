'use client'

import StatusBadge from '@/components/ui/StatusBadge'
import { fmtBRL } from '@/lib/utils'

function refOf(u) {
  return 'UN-' + u.id.slice(0, 6).toUpperCase()
}

export default function UnidadePublicaCard({ unidade, edificio, onSelect, isRemoving }) {
  return (
    <button
      style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box' }}
      className={`px-5 py-5 border-t border-border-3 transition-opacity duration-700 ${isRemoving ? 'opacity-0' : 'opacity-100'}`}
      onClick={() => onSelect(unidade)}
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">
            {refOf(unidade)}
          </span>
          <span className="font-body font-bold text-[22px] tracking-[-0.8px] text-fg-1 leading-tight">
            {unidade.nome}
          </span>
          {edificio && (
            <span className="text-[12px] text-fg-3 mt-0.5">{edificio.nome}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {unidade.area_m2 && (
            <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase whitespace-nowrap">
              {unidade.area_m2}m²
            </span>
          )}
          <StatusBadge status="disponivel" />
        </div>
      </div>
      <div className="pt-3 border-t border-border-3 flex justify-between items-baseline">
        <div>
          {unidade.valor_visivel ? (
            <span>
              <span className="font-body font-bold text-[22px] tracking-[-0.8px] text-fg-1">
                {fmtBRL(unidade.valor_mensal)}
              </span>
              <span className="font-mono text-[11px] text-fg-4 ml-1.5">/mês</span>
            </span>
          ) : (
            <span className="font-mono text-[11px] text-fg-3 tracking-[1px] uppercase">
              Valor sob consulta
            </span>
          )}
        </div>
        <span className="font-body font-bold text-[11px] text-indigo uppercase tracking-[1px]">
          Detalhes →
        </span>
      </div>
    </button>
  )
}
