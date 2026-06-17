'use client'

import Image from 'next/image'
import StatusBadge from '@/components/ui/StatusBadge'
import { fmtBRL, shortBuilding } from '@/lib/utils'

export default function UnidadePublicaCard({ unidade, edificio, onSelect, fotoSrc }) {
  return (
    <button
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        padding: 18,
        gap: 14,
        background: 'var(--surface)',
        border: '1px solid var(--border-2)',
      }}
      onClick={() => onSelect(unidade)}
    >
      {/* Imagem de capa com overlay e StatusBadge absoluto */}
      <div style={{ position: 'relative', height: 116, overflow: 'hidden', border: '1px solid var(--border-3)' }}>
        <Image
          fill
          alt=""
          src={fotoSrc}
          sizes="(min-width: 768px) 280px, 100vw"
          style={{ objectFit: 'cover', filter: 'grayscale(0.3) contrast(1.1) brightness(0.6)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'var(--primary-hover)', opacity: 0.12 }} />
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <StatusBadge status={unidade.status} />
        </div>
      </div>

      {/* Nome e edifício */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div className="r-subhead" style={{ fontSize: 17, letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {unidade.nome}
          </div>
          {edificio && (
            <div className="r-meta" style={{ marginTop: 4, letterSpacing: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shortBuilding(edificio.nome)}
            </div>
          )}
        </div>
      </div>

      {/* Descrição (quando disponível) */}
      {unidade.descricao && (
        <p className="r-body" style={{ fontSize: 13, margin: 0, color: 'var(--fg-4)' }}>
          {unidade.descricao}
        </p>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-2)' }} />

      {/* Footer: área | valor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {unidade.area_m2 != null && (
          <span className="r-meta" style={{ letterSpacing: '1px' }}>{unidade.area_m2} m²</span>
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.5px', color: unidade.valor_visivel ? 'var(--primary-hover)' : 'var(--fg-4)' }}>
          {unidade.valor_visivel ? `${fmtBRL(unidade.valor_mensal)}/mês` : 'Consulte o proprietário'}
        </span>
      </div>
    </button>
  )
}
