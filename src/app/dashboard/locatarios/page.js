"use client"

import supabase from "@/lib/supabase";
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { convidarLocatario } from "@/actions/locatarios";
import { getLocatarios } from "@/lib/queries";

export default function locatarios () {

    const [usuario, setUsuario] = useState(null)
    const [nome_razao_social, setNome_razao_social] = useState("")
    const [tipo, setTipo] = useState("")
    const [documento, setDocumento] = useState("")
    const [email, setEmail] = useState("")
    const [telefone, setTelefone] = useState("")
    const [nome_razao_socialEdit, setNome_razao_socialEdit] = useState("")
    const [tipoEdit, setTipoEdit] = useState("")
    const [documentoEdit, setDocumentoEdit] = useState("")
    const [emailEdit, setEmailEdit] = useState("")
    const [telefoneEdit, setTelefoneEdit] = useState("")
    const [editandoId, setEditandoId] = useState(null)
    const [locatarios, setlocatarios] = useState([])

    const router = useRouter()

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUsuario(data.user)
        setlocatarios(await getLocatarios())
      }
    }
    verificarSessao()
  }, [])

    async function handleConvidarLocatario(e) {
        e.preventDefault()        
        const {status} = await convidarLocatario(email, nome_razao_social, documento, telefone, tipo)
        if (status == 200){
            setlocatarios(await getLocatarios())
        }
    }
    
    async function handleDeletarlocatario(id) {
        const { error } = await supabase.from('locatarios').delete().eq('id',id)
        if (!error) {
            setlocatarios(await getLocatarios())
        } 
    }


    return (
        <main>
            <form onSubmit={handleConvidarLocatario}>
                <input placeholder="Nome" value={nome_razao_social} onChange={(e)=> setNome_razao_social(e.target.value)} type="text"></input>
                <select value={tipo} defaultValue={""} onChange={(e)=> setTipo(e.target.value)}>
                    <option value="">Selecione...</option>
                    <option key={"pf"} value={"pf"}>Pessoa Fisica</option>
                    <option key={"pj"} value={"pj"}>Pessoa Juridica</option>
                </select>
                <input placeholder="Documento" value={documento} onChange={(e)=> setDocumento(e.target.value)} type="text"></input>
                <input placeholder="Email" value={email} onChange={(e)=> setEmail(e.target.value)} type="email"></input>
                <input placeholder="Telefone " value={telefone} onChange={(e)=> setTelefone(e.target.value)} type="tel"></input>
                <button type="submit">Enviar</button>
            </form>
            {locatarios.map(locatario =>(
                <div key={locatario.id}>
                <p>{locatario.nome_razao_social}</p>
                <p>{locatario.tipo}</p>
                <p>{locatario.documento}</p>
                <p>{locatario.email}</p>
                <button onClick={()=> handleDeletarlocatario(locatario.id)} >Deletar Locatario</button>
                </div>
            ))}

        </main>
    )
}