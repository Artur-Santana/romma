'use client'

import { useState, useEffect, useMemo } from 'react'
import { getUnidadesDisponiveis, getEdificiosPublicos } from '@/lib/queries-client'
import { createClient } from '@/lib/supabase-browser'
import RealtimeDot from '@/components/ui/RealtimeDot'
import UnidadePublicaCard from '@/components/features/UnidadePublicaCard'
import UnidadeDetailSheet from '@/components/features/UnidadeDetailSheet'
import Link from 'next/link'

function shortenName(nome) {
  if (!nome) return ''
  return nome
    .replace('Edifício ', '')
    .replace('Centro Empresarial ', 'CE ')
    .replace('Torre ', '')
}

const SORTS = [
  { id: 'rel', label: 'Relevância' },
  { id: 'valor_asc', label: 'Menor valor' },
  { id: 'valor_desc', label: 'Maior valor' },
  { id: 'area_desc', label: 'Maior área' },
]

function sortUnits(list, sort) {
  const a = [...list]
  if (sort === 'valor_asc') a.sort((x, y) => (x.valor_mensal ?? Infinity) - (y.valor_mensal ?? Infinity))
  else if (sort === 'valor_desc') a.sort((x, y) => (y.valor_mensal ?? -Infinity) - (x.valor_mensal ?? -Infinity))
  else if (sort === 'area_desc') a.sort((x, y) => (y.area_m2 ?? 0) - (x.area_m2 ?? 0))
  return a
}

async function resolveFotoUrl(supabase, foto_url) {
  if (!foto_url) return '/Detalhe_Arquitetonico.png'
  if (foto_url.startsWith('/')) return foto_url
  const { data } = await supabase.storage.from('unidades-fotos').createSignedUrl(foto_url, 3600)
  return data?.signedUrl ?? '/Detalhe_Arquitetonico.png'
}

export default function UnidadesPublicas() {
  const [unidades, setUnidades] = useState([])
  const [edificios, setEdificios] = useState([])
  const [activeTab, setActiveTab] = useState('todos')
  const [sort, setSort] = useState('rel')
  const [selected, setSelected] = useState(null)
  const [fotoSrcs, setFotoSrcs] = useState({})

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [u, e] = await Promise.all([getUnidadesDisponiveis(), getEdificiosPublicos()])
      setUnidades(u ?? [])
      setEdificios(e ?? [])

      // Resolve signed URLs async (D-04/D-05)
      const srcs = await Promise.all(
        (u ?? []).map(async x => [x.id, await resolveFotoUrl(supabase, x.foto_url)])
      )
      setFotoSrcs(Object.fromEntries(srcs))
    }

    load()

    const channel = supabase
      .channel('public-unidades')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'unidades' }, () => load())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'unidades' }, () => load())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const disponiveis = unidades

  const tabs = [
    { id: 'todos', label: 'Todos' },
    ...edificios.map(e => ({ id: e.id, label: shortenName(e.nome) })),
  ]

  const filtered = activeTab === 'todos'
    ? disponiveis
    : disponiveis.filter(u => u.edificio_id === activeTab)

  const sorted = sortUnits(filtered, sort)

  const edificioById = useMemo(
    () => Object.fromEntries(edificios.map(e => [e.id, e])),
    [edificios]
  )

  function getEdificio(edificioId) {
    return edificioById[edificioId] ?? null
  }

  return (
    <div className="bg-background h-dvh flex flex-col relative overflow-hidden">
      <div style={{ flexShrink: 0, padding: '18px var(--rd-gutter-m)', borderBottom: '1px solid var(--border-3)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <Link href="/" className="font-mono text-[11px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors inline-flex items-center">← Voltar</Link>
            <RealtimeDot />
          </div>
          <h1 className="font-body font-bold text-[30px] md:text-[40px] tracking-[-1.6px] text-fg-1 leading-none m-0">
            Unidades Disponíveis.
          </h1>
        </div>
      </div>

      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border-3)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px var(--rd-gutter-m)' }}>
          <div className="flex flex-row gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {tabs.map(tab => {
              const count = tab.id === 'todos'
                ? disponiveis.length
                : disponiveis.filter(u => u.edificio_id === tab.id).length
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'inline-flex',
                    gap: 8,
                    alignItems: 'center',
                    padding: '9px 14px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    border: `1px solid ${isActive ? 'var(--indigo)' : 'var(--border-3)'}`,
                    background: isActive ? 'oklch(0.339 0.179 301.68 / 0.20)' : 'transparent',
                    color: isActive ? 'var(--fg-1)' : 'var(--fg-3)',
                  }}
                >
                  {tab.label}
                  <span style={{ color: isActive ? 'var(--fg-1)' : 'var(--fg-5)' }}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Count + Sort bar */}
      <div
        style={{ flexShrink: 0, borderBottom: '1px solid var(--border-3)' }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '10px var(--rd-gutter-m)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span className="r-meta" style={{ color: 'var(--fg-3)' }}>
            {sorted.length} {sorted.length === 1 ? 'UNIDADE' : 'UNIDADES'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="r-label" style={{ fontSize: 9 }}>Ordenar</span>
            <div className="r-noscroll" style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
              {SORTS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: '5px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.5px',
                    border: `1px solid ${sort === s.id ? 'var(--indigo)' : 'var(--border-3)'}`,
                    background: sort === s.id ? 'oklch(0.339 0.179 301.68 / 0.18)' : 'transparent',
                    color: sort === s.id ? 'var(--fg-1)' : 'var(--fg-4)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--rd-gutter-m)' }}>
          {sorted.length === 0 ? (
            <div className="py-20 px-8 text-center flex flex-col gap-3 items-center">
              <div className="w-12 h-12 border border-border-3 flex items-center justify-center text-[18px] text-fg-4">
                —
              </div>
              <span className="font-body font-bold text-[22px] tracking-[-0.8px] text-fg-2 block">
                Nenhuma unidade disponível
              </span>
              <p className="text-[12px] text-fg-4 leading-[1.5] max-w-[240px] m-0">
                Todas as unidades estão ocupadas no momento. Volte em breve.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
              {sorted.map(u => {
                const edificio = getEdificio(u.edificio_id)
                return (
                  <UnidadePublicaCard
                    key={u.id}
                    unidade={u}
                    edificio={edificio}
                    onSelect={setSelected}
                    fotoSrc={fotoSrcs[u.id] ?? '/Detalhe_Arquitetonico.png'}
                  />
                )
              })}
            </div>
          )}

          <div className="py-8 px-5 text-center border-t border-border-3">
            <span className="font-mono text-[11px] text-fg-5 tracking-[1.5px]">
              POWERED BY ROMMA · GRID.OS
            </span>
          </div>
        </div>
      </div>

      {selected && (
        <UnidadeDetailSheet
          key={selected.id}
          unidade={selected}
          edificio={getEdificio(selected.edificio_id)}
          onClose={() => setSelected(null)}
          fotoSrc={fotoSrcs[selected.id] ?? '/Detalhe_Arquitetonico.png'}
        />
      )}
    </div>
  )
}
