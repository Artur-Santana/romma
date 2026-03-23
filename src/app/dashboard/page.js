"use client"
import supabase from "@/lib/supabase";
import { useEffect } from "react"
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function Dashboard() {
  const [usuario, setUsuario] = useState(null)
  const [edificios, setEdificios] = useState([])
  const [nome, setNome] = useState("")
  const [endereco, setEndereco] = useState("")
  const router = useRouter()
  
  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      }else{
        setUsuario(data.user)
      }
    }
    verificarSessao()
  }, [])
  async function getEdificios() {
    const { data } = await supabase.from("edificios").select("*")
    if (data) setEdificios(data)
  }
  
  useEffect(() => {
    getEdificios()
  }, [])
  async function insertEdificio(e) {
    e.preventDefault()
    const { error } = await supabase.from("edificios").insert({ nome, endereco })
    if (!error) {
      getEdificios() // re-busca a lista
    }
  }
     
    async function handleLogout() {
      await supabase.auth.signOut()
      router.push("/login")
    }

  return (
    <main>
      <form onSubmit={insertEdificio}>
        <input value={nome}
            onChange={(e)=> setNome(e.target.value)} type="text" placeholder="Nome do edificio" />
        <input value={endereco}
             onChange={(e)=> setEndereco(e.target.value)} type="text" placeholder="Endereço" />
        <button type="submit">Enviar</button>
      </form>
      <h1>Pagina de dashboard!</h1>
      <p>Olá {usuario?.email}</p>
      {edificios.map(edificio => (
      <p key={edificio.id}>{edificio.nome}</p>
      ))}
      <button onClick={handleLogout}>Sair</button>
    </main>
  )
}
