"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { getUnidadesDisponiveis } from "@/lib/queries-client"

function applyEvent(state, event) {
    const { eventType, new: next, old } = event

    if (eventType === 'DELETE') {
        return state.filter(u => u.id !== old.id)
    }

    if (eventType === 'INSERT') {
        if (next.status !== 'disponivel') return state
        const already = state.some(u => u.id === next.id)
        return already ? state : [...state, next]
    }

    if (eventType === 'UPDATE') {
        if (next.status === 'disponivel') {
            const exists = state.some(u => u.id === next.id)
            return exists
                ? state.map(u => u.id === next.id ? next : u)
                : [...state, next]
        }
        return state.filter(u => u.id !== next.id)
    }

    return state
}

function eventNeedsEnrichment(event) {
    if (event.eventType === 'DELETE') return false
    return event.new?.status === 'disponivel'
}

export function useUnidadesRealtime() {
    const [unidades, setUnidades] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        const supabase = createClient()

        async function bootstrap() {
            const data = await getUnidadesDisponiveis()
            if (cancelled) return
            setUnidades(data ?? [])
            setLoading(false)
        }

        async function refetchAll() {
            const data = await getUnidadesDisponiveis()
            if (cancelled) return
            setUnidades(data ?? [])
        }

        function handleEvent(payload) {
            if (eventNeedsEnrichment(payload)) {
                refetchAll()
                return
            }
            setUnidades(prev => applyEvent(prev, payload))
        }

        bootstrap()

        const channel = supabase
            .channel('public:unidades')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'unidades' },
                handleEvent
            )
            .subscribe(status => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    refetchAll()
                }
            })

        return () => {
            cancelled = true
            supabase.removeChannel(channel)
        }
    }, [])

    return { unidades, loading }
}
