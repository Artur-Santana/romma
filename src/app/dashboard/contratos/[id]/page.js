"use client"

import { use } from "react"
import Parcelas from "@/components/features/Parcelas"

export default function ContratoDetalhePage({ params }) {
    const { id } = use(params)
    return <Parcelas contratoId={id} />
}
