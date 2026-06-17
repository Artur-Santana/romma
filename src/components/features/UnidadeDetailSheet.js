'use client'

import Image from 'next/image'
import { fmtBRL, refOf } from '@/lib/utils'

export default function UnidadeDetailSheet({ unidade, edificio, onClose, onSimular, fotoSrc, simulating }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.65)] flex items-end"
      onClick={onClose}
    >
      <div
        style={{ animation: 'rSheetUp 320ms var(--ease-crisp) both' }}
        className="w-full max-h-[85dvh] overflow-auto bg-surface border-t border-indigo px-5 pt-6 pb-8 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="self-center w-8 h-[3px] bg-fg-5" />

        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">
              {refOf(unidade)}
            </span>
            <h2 className="font-body font-bold text-[32px] tracking-[-1.6px] text-fg-1 leading-none m-0">
              {unidade.nome}
            </h2>
            {edificio && (
              <span className="text-[13px] text-fg-3">{edificio.nome}</span>
            )}
          </div>
          <button
            style={{ all: 'unset', cursor: 'pointer', display: 'flex', width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            className="border border-border-3 text-fg-3 text-[14px]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Imagem real (D-13) */}
        <div style={{ position: 'relative', height: 160, marginBottom: 18, overflow: 'hidden', border: '1px solid var(--border-3)' }}>
          <Image
            fill
            alt=""
            src={fotoSrc}
            sizes="520px"
            style={{ objectFit: 'cover', filter: 'grayscale(0.3) contrast(1.1) brightness(0.65)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'var(--primary-hover)', opacity: 0.16 }} />
        </div>

        {/* Descrição */}
        {unidade.descricao && (
          <p className="font-body text-[13px] text-fg-2 leading-[1.55] m-0">
            {unidade.descricao}
          </p>
        )}

        {/* Grade 2 colunas: Área | Valor mensal */}
        <div className="border border-border-3 grid grid-cols-2">
          <div className="p-4 flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">Área</span>
            <span className="font-body font-bold text-[22px] tracking-[-0.8px] text-fg-1">
              {unidade.area_m2 != null ? `${unidade.area_m2}m²` : '—'}
            </span>
          </div>
          <div className="p-4 border-l border-border-3 flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">Valor Mensal</span>
            <span
              className="font-body font-bold text-[22px] tracking-[-0.8px]"
              style={{ color: unidade.valor_visivel ? 'var(--primary-hover)' : 'var(--fg-1)' }}
            >
              {unidade.valor_visivel ? fmtBRL(unidade.valor_mensal) : 'Consulte o Proprietário'}
            </span>
          </div>
        </div>

        {/* Valor/m² — só quando valor visível e área > 0 (D-13, guard divisão por zero) */}
        {unidade.valor_visivel && unidade.area_m2 > 0 && (
          <div style={{ border: '1px solid var(--border-3)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="r-label">Valor / m²</span>
            <span className="r-data" style={{ fontSize: 14, color: 'var(--fg-1)' }}>
              {fmtBRL(Math.round(unidade.valor_mensal / unidade.area_m2))}
              <span className="r-meta">/m²</span>
            </span>
          </div>
        )}

        {/* Refs LOC + REF (D-13) */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="r-meta">LOC: −23.561° S, 46.656° W</span>
          <span className="r-meta">REF: RM-2026-{unidade.id.slice(0, 6).toUpperCase()}</span>
        </div>

        {/* Endereço */}
        {edificio?.endereco && (
          <div className="bg-surface border border-border-3 px-4 py-3 flex justify-between items-center gap-3">
            <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase shrink-0">
              Endereço
            </span>
            <span className="text-[12px] text-fg-3 text-right">
              {edificio.endereco}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {/* CTA Simular Aluguel (D-14) */}
          <button
            style={{ all: 'unset', cursor: simulating ? 'not-allowed' : 'pointer', display: 'block', width: '100%', boxSizing: 'border-box', minHeight: 44 }}
            className="py-[14px] px-5 bg-indigo font-mono font-bold text-[13px] text-fg-1 text-center tracking-[0.5px] min-h-[44px]"
            onClick={() => onSimular(unidade.id)}
            disabled={simulating}
          >
            {simulating ? '[···] Processando' : '[>] Simular Aluguel'}
          </button>
          <button
            style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', boxSizing: 'border-box', minHeight: 44 }}
            className="py-[14px] px-5 border border-border-3 font-body font-bold text-[13px] text-fg-3 text-center min-h-[44px]"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
