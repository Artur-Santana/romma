"use client"

import supabase from "@/lib/supabase";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getContratos, getLocatarios, getUnidades } from "@/lib/queries";


export default function Contratos() {
    const [usuario, setUsuario] = useState(null)
    const [unidades, setUnidades] = useState([])
    const [locatarios, setLocatarios] = useState([])
    const [contratos, setContratos] = useState([])
    const [form, setForm] = useState({})
    const [formEdit, setFormEdit] = useState({})
    const [editandoId, setEditandoId] = useState(null)

    const router = useRouter()

    useEffect(()=> {
        async function verificarSessao(){
            const { data } = await supabase.auth.getUser()
            if (!data.user) {
                router.push('/login')
            } else {
                setUsuario(data.user)
                setContratos(await getContratos())
                setForm({
                    data_inicio: '',
                    data_fim: '',
                    status: 'ativo',
                    observacoes: '',
                    unidade_id: '',
                    locatario_id: '',
                })
                setUnidades(await getUnidades())
                setLocatarios(await getLocatarios())
            }
        }
        verificarSessao()
    }, [])

    // não coloquei ainda o seletor de locatario e unidade para validar primeiro a base da o arquivo
    return (
        <main>
            <form>
                <input placeholder="Data Inicio" value={form.data_inicio} onChange={(e)=> setForm({...form,data_inicio:e.target.value})}></input>
                <input placeholder="Data Fim" value={form.data_fim} onChange={(e)=> setForm({...form,data_fim:e.target.value})}></input>
                <input placeholder="Status" value={form.status} onChange={(e)=> setForm({...form,status:e.target.value})}></input>
                <input placeholder="Observacoes" value={form.observacoes} onChange={(e)=> setForm({...form,observacoes:e.target.value})}></input>
                <select value={form.unidade_id}>
                    <option value={""}>Selecione</option>
                    {unidades.map(unidade =>(
                        <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
                    ))}
                </select>
                <select>
                    <option value={""}>Selecione</option>
                    {locatarios.map(locatario =>(
                        <option key={locatario.id} value={locatario.id}>{locatario.name}</option>
                    ))}
                </select>



            </form>
        </main>
    )

}