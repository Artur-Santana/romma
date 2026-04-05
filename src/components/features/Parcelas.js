"use client"

import supabase from "@/lib/supabase"
import { useEffect, useState } from "react"
import { getParcelasByContrato } from "@/lib/queries"
import Link from "next/link"

const statusConfig = {
    futura:   { label: 'Futura',   classe: 'bg-[#1A1A1A] text-[#666666] border border-[#444444]/20' },
    pendente: { label: 'Pendente', classe: 'bg-[#4B0082]/20 text-[#9B59B6] border border-[#4B0082]/30' },
    paga:     { label: 'Paga',     classe: 'bg-[#0A0A0A] text-[#22C55E] border border-[#22C55E]/20' },
    vencida:  { label: 'Vencida',  classe: 'bg-[#2D0000] text-[#EF4444] border border-[#EF4444]/30' },
}

export default function Parcelas({ contratoId }) {
    const [parcelas, setParcelas] = useState([])

    useEffect(() => {
        async function carregarParcelas() {
            setParcelas(await getParcelasByContrato(contratoId))
        }
        carregarParcelas()
    }, [contratoId])

    async function marcarComoPaga(parcela) {
        const { error } = await supabase
            .from('parcelas')
            .update({
                status: 'paga',
                data_pagamento: new Date().toISOString().split('T')[0]
            })
            .eq('id', parcela.id)
        if (!error) {
            setParcelas(await getParcelasByContrato(contratoId))
        }
    }

    return (
        <main className="bg-black min-h-screen p-8">
            <div className="mb-6">
                <Link
                    href="/dashboard/contratos"
                    className="border border-white/20 text-white px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-[#1A1A1A]"
                >
                    ← Voltar
                </Link>
            </div>

            <h1 className="text-white text-3xl font-extrabold uppercase tracking-tight mb-2">
                Parcelas
            </h1>
            <div className="w-16 h-1 bg-[#4B0082] mb-8"></div>

            <div className="flex flex-col gap-0">
                {parcelas.map(parcela => (
                    <div
                        key={parcela.id}
                        className="bg-[#121212] border border-[#444444]/20 p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors"
                    >
                        <div className="flex items-center gap-6">
                            <span className="text-white text-sm font-bold w-8">
                                #{parcela.numero}
                            </span>
                            <span className={`px-2 py-1 text-xs uppercase tracking-widest font-bold ${statusConfig[parcela.status]?.classe}`}>
                                {statusConfig[parcela.status]?.label}
                            </span>
                            <div className="text-[#666666] text-xs uppercase tracking-widest">
                                <span>Fechamento: <span className="text-white">{parcela.data_fechamento}</span></span>
                                <span className="mx-3">|</span>
                                <span>Vencimento: <span className="text-white">{parcela.data_vencimento}</span></span>
                                {parcela.status === 'paga' && (
                                    <>
                                        <span className="mx-3">|</span>
                                        <span>Pago em: <span className="text-[#22C55E]">{parcela.data_pagamento}</span></span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            {(parcela.status === 'pendente' || parcela.status === 'vencida') && (
                                <button
                                    onClick={() => marcarComoPaga(parcela)}
                                    className="bg-[#4B0082] text-white px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-[#6B20A2]"
                                >
                                    Marcar como paga
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {parcelas.length === 0 && (
                <p className="text-[#666666] text-sm uppercase tracking-widest mt-8">
                    Nenhuma parcela encontrada.
                </p>
            )}
        </main>
    )
}
