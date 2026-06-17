'use client'

import { useState } from 'react'
import Image from 'next/image'
import { fmtBRL, fmtBRLk, shortBuilding } from '@/lib/utils'

export default function UnidadeDetailSheet({ unidade, edificio, onClose, fotoSrc }) {
  // enviado reseta naturalmente: o pai remonta o sheet via key={selected.id}
  const [enviado, setEnviado] = useState(false)

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'oklch(0 0 0 / 0.7)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--surface)',
          borderTop: '1px solid var(--indigo)',
          maxHeight: '92%',
          overflowY: 'auto',
          animation: 'rSheetUp 320ms var(--ease-crisp) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: 24 }}>
          {/* Header: eyebrow + título + ✕ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <span className="r-eyebrow indigo" style={{ marginBottom: 6 }}>
                Unidade · {shortBuilding(edificio?.nome)}
              </span>
              <h2 className="r-title" style={{ fontSize: 28 }}>{unidade.nome}</h2>
            </div>
            <button
              onClick={onClose}
              style={{
                all: 'unset',
                cursor: 'pointer',
                width: 30,
                height: 30,
                border: '1px solid var(--border-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--fg-3)',
                fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}
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
            <p className="r-body" style={{ marginBottom: 18 }}>{unidade.descricao}</p>
          )}

          {/* Grade 2 colunas: Área | Valor mensal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--border-3)', marginBottom: 18 }}>
            <div style={{ padding: 18, borderRight: '1px solid var(--border-3)' }}>
              <div className="r-label" style={{ marginBottom: 8 }}>Área</div>
              <div className="r-metric" style={{ fontSize: 30 }}>
                {unidade.area_m2 ?? '—'}<span style={{ fontSize: 14, color: 'var(--fg-4)' }}> m²</span>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div className="r-label" style={{ marginBottom: 8 }}>Valor mensal</div>
              <div className="r-metric" style={{ fontSize: 30, color: unidade.valor_visivel ? 'var(--primary-hover)' : 'var(--fg-4)' }}>
                {unidade.valor_visivel ? fmtBRLk(unidade.valor_mensal) : '—'}
              </div>
              {!unidade.valor_visivel && (
                <div className="r-meta" style={{ marginTop: 4 }}>Consulte o proprietário</div>
              )}
            </div>
          </div>

          {/* Valor/m² — só quando valor visível e área > 0 (D-13, guard divisão por zero) */}
          {unidade.valor_visivel && unidade.area_m2 > 0 && (
            <div style={{ border: '1px solid var(--border-3)', padding: '12px 16px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="r-label">Valor / m²</span>
              <span className="r-data" style={{ fontSize: 14, color: 'var(--fg-1)' }}>
                {fmtBRL(Math.round(unidade.valor_mensal / unidade.area_m2))}
                <span className="r-meta">/m²</span>
              </span>
            </div>
          )}

          {/* Refs LOC + REF (D-13) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <span className="r-meta">LOC: −23.561° S, 46.656° W</span>
            <span className="r-meta">REF: RM-2026-{unidade.id.slice(0, 6).toUpperCase()}</span>
          </div>

          {/* CTA bracket: [>] Falar com Proprietário ENTER → [✓] Solicitação enviada */}
          <button
            onClick={() => setEnviado(true)}
            disabled={enviado}
            style={{
              all: 'unset',
              cursor: enviado ? 'default' : 'pointer',
              boxSizing: 'border-box',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '16px 22px',
              minHeight: 44,
              background: enviado ? 'var(--success)' : 'var(--indigo)',
              color: enviado ? 'var(--background)' : 'var(--fg-1)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.5px' }}>
              {enviado ? '[✓]' : '[>]'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {enviado ? 'Solicitação enviada' : 'Falar com Proprietário'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.5px', color: enviado ? 'var(--background)' : 'var(--fg-2)' }}>
              {enviado ? '' : 'ENTER'}
            </span>
          </button>
          {enviado && (
            <p className="r-meta" style={{ marginTop: 12, textAlign: 'center' }}>
              O Proprietário entrará em contato em breve.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
