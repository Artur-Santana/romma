"use client"

import supabase from "@/lib/supabase";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getEdificios, getUnidades } from "@/lib/queries"



export default function Unidades() {
    const [usuario, setUsuario] = useState(null)
    const [unidades, setUnidades] = useState([])
    const [nome, setNome] = useState("")
    const [descricao, setDescricao] = useState("")
    const [area_m2, setArea_m2] = useState("")
    const [valor_mensal, setValor_mensal] = useState("")
    const [valor_visivel, setValor_visivel] = useState("")
    const [status , setStatus ] = useState("")
    const [edificio_id , setEdificio_id ] = useState("")
    const [listaEdificios, setListaEdificios] = useState([])
  
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

    

     useEffect(() => {
        async function getEdificio() {
            const data = await  getEdificios()
        setListaEdificios(data)
        }
        getEdificio()
    }, [])

    return (
        <main>
            <form>
            <select 
                value={edificio_id}
                onChange={(e)=>setEdificio_id(e.target.value)}>
                {listaEdificios.map(edificio =>(
                    <option key={edificio.id} value={edificio.id}>{edificio.nome}</option>
                ))}
            </select> 
            </form>

        </main>
    )





}
