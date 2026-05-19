'use client'

import { useState, useEffect } from 'react'
import { getUnidades, getEdificios } from '@/lib/queries-client'
import { fmtBRL } from '@/lib/utils'
import RealtimeDot from '@/components/ui/RealtimeDot'
import StatusBadge from '@/components/ui/StatusBadge'
import { createClient } from '@/lib/supabase-browser'

function refOf(u) {
  return 'UN-' + u.id.slice(0, 6).toUpperCase()
}

function shortenName(nome) {
  return nome
    .replace('Edifício ', '')
    .replace('Centro Empresarial ', 'CE ')
    .replace('Torre ', '')
}

function UnitDetailSheet({ u, edificio, onClose, onSimular }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'oklch(0 0 0 / 0.65)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 50,
        animation: 'rommaFadeIn 240ms var(--ease-crisp)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '85%',
          overflow: 'auto',
          background: 'var(--background)',
          borderTop: '1px solid var(--indigo)',
          padding: '24px 20px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ alignSelf: 'center', width: 32, height: 3, background: 'var(--fg-5)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-5)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {refOf(u)}
            </span>
            <h2 style={{ fontFamily: 'var(--font-display-arch)', fontWeight: 700, fontSize: 32, letterSpacing: -1.4, color: 'var(--fg-1)', lineHeight: 1, margin: 0 }}>
              {u.nome}
            </h2>
            {edificio && (
              <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>{edificio.nome}</span>
            )}
          </div>
          <button
            style={{
              all: 'unset',
              cursor: 'pointer',
              width: 32,
              height: 32,
              border: '1px solid var(--border-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--fg-3)',
              fontSize: 14,
              flexShrink: 0,
            }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            height: 160,
            background: 'oklch(0.21 0 0)',
            border: '1px solid var(--border-3)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="grid-sheet" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--fg-3)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-sheet)" />
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)', letterSpacing: 1.5, textTransform: 'uppercase', position: 'relative' }}>
            [PLANTA · {refOf(u)}]
          </span>
        </div>

        <div style={{ border: '1px solid var(--border-3)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-5)', letterSpacing: 1, textTransform: 'uppercase' }}>Área</span>
            <span style={{ fontFamily: 'var(--font-display-arch)', fontWeight: 700, fontSize: 22, color: 'var(--fg-1)', letterSpacing: -0.5 }}>
              {u.area_m2}m²
            </span>
          </div>
          <div style={{ padding: '16px 20px', borderLeft: '1px solid var(--border-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-5)', letterSpacing: 1, textTransform: 'uppercase' }}>Valor mensal</span>
            <span style={{ fontFamily: 'var(--font-display-arch)', fontWeight: 700, fontSize: 22, color: 'var(--fg-1)', letterSpacing: -0.5 }}>
              {u.valor_visivel ? fmtBRL(u.valor_mensal) : 'Consultar'}
            </span>
          </div>
        </div>

        {u.descricao && (
          <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)', margin: 0 }}>
            {u.descricao}
          </p>
        )}

        {edificio?.endereco && (
          <div
            style={{
              background: 'oklch(0.265 0 0)',
              border: '1px solid var(--border-2)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-5)', letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>
              Endereço
            </span>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', textAlign: 'right' }}>
              {edificio.endereco}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              width: '100%',
              padding: '14px 20px',
              background: 'var(--indigo)',
              fontFamily: 'var(--font-display-arch)',
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--fg-1)',
              textAlign: 'center',
              letterSpacing: 0.5,
              boxSizing: 'border-box',
            }}
            onClick={() => onSimular(u.id)}
          >
            Tenho interesse →
          </button>
          <button
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              width: '100%',
              padding: '14px 20px',
              border: '1px solid var(--border-3)',
              fontFamily: 'var(--font-display-arch)',
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--fg-3)',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
            onClick={onClose}
          >
            Voltar
          </button>
        </div>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-5)', textAlign: 'center', letterSpacing: 0.5 }}>
          Demo · &apos;Tenho interesse&apos; simula aluguel para fins de visualização
        </span>
      </div>
    </div>
  )
}

export default function UnidadesPublicas() {
  const [unidades, setUnidades] = useState([])
  const [edificios, setEdificios] = useState([])
  const [activeTab, setActiveTab] = useState('todos')
  const [selected, setSelected] = useState(null)
  const [removedIds, setRemovedIds] = useState(new Set())
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    async function load() {
      const [u, e] = await Promise.all([getUnidades(), getEdificios()])
      setUnidades(u ?? [])
      setEdificios(e ?? [])
    }
    load()

    const supabase = createClient()
    const channel = supabase
      .channel('public-unidades')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'unidades' }, () => load())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'unidades' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const disponiveis = unidades.filter(u => u.status === 'disponivel' && !removedIds.has(u.id))

  const tabs = [
    { id: 'todos', label: 'Todos' },
    ...edificios.map(e => ({ id: e.id, label: shortenName(e.nome) })),
  ]

  const filtered = activeTab === 'todos'
    ? disponiveis
    : disponiveis.filter(u => u.edificio_id === activeTab)

  function simularAluguel(uid) {
    setRemovingId(uid)
    setTimeout(() => {
      setRemovingId(null)
      setSelected(null)
      setRemovedIds(prev => new Set([...prev, uid]))
    }, 700)
  }

  function getEdificio(edificioId) {
    return edificios.find(e => e.id === edificioId) ?? null
  }

  return (
    <div
      style={{
        background: 'var(--background)',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 20px 24px', borderBottom: '1px solid var(--border-2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            GRID.OS · LIVE FEED
          </span>
          <RealtimeDot label="" compact />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display-arch)',
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: -1.6,
            color: 'var(--fg-1)',
            lineHeight: 1,
            margin: 0,
            whiteSpace: 'pre-line',
          }}
        >
          {'Unidades\nDisponíveis.'}
        </h1>
      </div>

      <div
        style={{
          padding: '16px 20px 0',
          display: 'flex',
          flexDirection: 'row',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map(tab => {
          const count = tab.id === 'todos'
            ? disponiveis.length
            : disponiveis.filter(u => u.edificio_id === tab.id).length
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              style={{
                all: 'unset',
                cursor: 'pointer',
                flexShrink: 0,
                padding: '8px 14px',
                display: 'inline-flex',
                gap: 8,
                fontFamily: 'var(--font-display-arch)',
                fontWeight: 700,
                fontSize: 10,
                lineHeight: 1.2,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                border: isActive ? '1px solid var(--indigo)' : '1px solid var(--border-3)',
                background: isActive ? 'oklch(0.339 0.179 301.68 / 0.20)' : 'transparent',
                color: isActive ? 'var(--fg-1)' : 'var(--fg-3)',
                alignItems: 'center',
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span style={{ color: isActive ? 'var(--indigo)' : 'var(--fg-5)' }}>{count}</span>
            </button>
          )
        })}
      </div>

      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)', letterSpacing: 0.5, opacity: 0.5 }}>
          {filtered.length} {filtered.length === 1 ? 'UNIDADE' : 'UNIDADES'}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)', letterSpacing: 0.5, opacity: 0.5 }}>
          SYNC · {new Date().toISOString().slice(0, 10)}
        </span>
      </div>

      <div className="romma-mobile-pane" style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '80px 32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                border: '1px solid var(--border-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: 'var(--fg-4)',
              }}
            >
              —
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display-arch)',
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: -1,
                color: 'var(--fg-2)',
                display: 'block',
              }}
            >
              Tudo ocupado.
            </span>
            <p style={{ fontSize: 12, color: 'var(--fg-4)', lineHeight: 1.5, maxWidth: 240, margin: 0 }}>
              Nenhuma unidade disponível neste filtro no momento.
            </p>
          </div>
        ) : (
          filtered.map((u, idx) => {
            const edificio = getEdificio(u.edificio_id)
            return (
              <button
                key={u.id}
                className={removingId === u.id ? 'romma-unit-out' : ''}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'block',
                  width: '100%',
                  padding: 20,
                  borderTop: idx > 0 ? '1px solid var(--border)' : 0,
                  position: 'relative',
                  boxSizing: 'border-box',
                }}
                onClick={() => setSelected(u)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-5)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {refOf(u)}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display-arch)', fontWeight: 700, fontSize: 22, letterSpacing: -0.8, color: 'var(--fg-1)', lineHeight: 1 }}>
                      {u.nome}
                    </span>
                    {edificio && (
                      <span style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>
                        {shortenName(edificio.nome)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    {u.area_m2 && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-5)', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {u.area_m2}m²
                      </span>
                    )}
                    <StatusBadge status="disponivel" />
                  </div>
                </div>

                {u.descricao && (
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: 'var(--fg-2)',
                      marginBottom: 12,
                      margin: '0 0 12px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {u.descricao}
                  </p>
                )}

                <div
                  style={{
                    paddingTop: 12,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <div>
                    {u.valor_visivel ? (
                      <span>
                        <span style={{ fontFamily: 'var(--font-display-arch)', fontWeight: 500, fontSize: 22, letterSpacing: -0.8, color: 'var(--fg-1)' }}>
                          {fmtBRL(u.valor_mensal)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-4)', marginLeft: 6 }}>
                          /mês
                        </span>
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        Valor sob consulta
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-display-arch)', fontWeight: 700, fontSize: 10, lineHeight: 1.2, color: 'var(--indigo)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Detalhes →
                  </span>
                </div>
              </button>
            )
          })
        )}

        <div style={{ padding: '32px 20px 24px', textAlign: 'center', borderTop: filtered.length > 0 ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fg-5)', letterSpacing: 1.5 }}>
            POWERED BY ROMMA · GRID.OS
          </span>
        </div>
      </div>

      {selected && (
        <UnitDetailSheet
          u={selected}
          edificio={getEdificio(selected.edificio_id)}
          onClose={() => setSelected(null)}
          onSimular={simularAluguel}
        />
      )}
    </div>
  )
}
