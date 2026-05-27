'use client'

import { useState, useEffect } from 'react'
import { getUnidadesDisponiveis, getEdificios } from '@/lib/queries-client'
import { createClient } from '@/lib/supabase-browser'
import RealtimeDot from '@/components/ui/RealtimeDot'
import UnidadePublicaCard from '@/components/features/UnidadePublicaCard'
import UnidadeDetailSheet from '@/components/features/UnidadeDetailSheet'

function shortenName(nome) {
  return nome
    .replace('Edifício ', '')
    .replace('Centro Empresarial ', 'CE ')
    .replace('Torre ', '')
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
      const [u, e] = await Promise.all([getUnidadesDisponiveis(), getEdificios()])
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

  const disponiveis = unidades.filter(u => !removedIds.has(u.id))

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
    <div className="bg-background h-dvh flex flex-col relative overflow-hidden">
      <div className="px-5 pt-5 pb-6 border-b border-border-3 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[11px] text-fg-5 tracking-[1px] uppercase">
            Unidades Disponíveis
          </span>
          <RealtimeDot />
        </div>
        <h1 className="font-body font-bold text-[32px] tracking-[-1.6px] text-fg-1 leading-none m-0 whitespace-pre-line">
          {'Unidades\nDisponíveis.'}
        </h1>
      </div>

      <div className="flex flex-row gap-1.5 px-5 pt-4 pb-1 overflow-x-auto [scrollbar-width:none]">
        {tabs.map(tab => {
          const count = tab.id === 'todos'
            ? disponiveis.length
            : disponiveis.filter(u => u.edificio_id === tab.id).length
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              style={{ all: 'unset', cursor: 'pointer', flexShrink: 0, boxSizing: 'border-box' }}
              className={`px-3.5 py-2 inline-flex gap-2 font-body font-bold text-[10px] uppercase tracking-[0.5px] items-center border ${
                isActive
                  ? 'border-indigo bg-[oklch(0.339_0.179_301.68/0.20)] text-fg-1'
                  : 'border-border-3 bg-transparent text-fg-3'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              <span className={isActive ? 'text-indigo' : 'text-fg-5'}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="px-5 py-4 border-b border-border-3 flex justify-between items-baseline">
        <span className="font-mono text-[11px] text-fg-4 tracking-[0.5px] opacity-50">
          {filtered.length} {filtered.length === 1 ? 'UNIDADE' : 'UNIDADES'}
        </span>
        <span className="font-mono text-[11px] text-fg-4 tracking-[0.5px] opacity-50">
          SYNC · {new Date().toISOString().slice(0, 10)}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
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
          filtered.map(u => {
            const edificio = getEdificio(u.edificio_id)
            return (
              <UnidadePublicaCard
                key={u.id}
                unidade={u}
                edificio={edificio}
                onSelect={setSelected}
                isRemoving={removingId === u.id}
              />
            )
          })
        )}

        <div className="py-8 px-5 text-center border-t border-border-3">
          <span className="font-mono text-[11px] text-fg-5 tracking-[1.5px]">
            POWERED BY ROMMA · GRID.OS
          </span>
        </div>
      </div>

      {selected && (
        <UnidadeDetailSheet
          unidade={selected}
          edificio={getEdificio(selected.edificio_id)}
          onClose={() => setSelected(null)}
          onSimular={simularAluguel}
        />
      )}
    </div>
  )
}
