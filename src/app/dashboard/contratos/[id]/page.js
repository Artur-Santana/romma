"use client"

import { use } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser";
const supabase = createClient();
import Parcelas from "@/components/features/Parcelas"

export default function ContratoDetalhePage({ params }) {
    const { id } = use(params)
    const [usuario, setUsuario] = useState(null)
    const router = useRouter()

    useEffect(() => {
        async function verificarSessao() {
            const { data } = await supabase.auth.getUser()
            if (!data.user) {
                router.push('/login')
            } else {
                setUsuario(data.user)
            }
        }
        verificarSessao()
    }, [])

    return <Parcelas contratoId={id} />
}
