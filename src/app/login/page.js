"use client"

import supabase from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useState } from "react"



export default function Login() {
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [erro,setErro] = useState(null)
    const router = useRouter()
    async function handleLogin(e){
        e.preventDefault()
        const { error } = await supabase.auth.signInWithPassword({
            email:email,
            password: senha
        })

        if (error) {
            setErro(error.message)
        } else{
            router.push("/dashboard")
        }
    } 

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input value={email}
            onChange={(e)=> setEmail(e.target.value)} type="email" placeholder="Seu email" />
        <input value={senha}
             onChange={(e)=> setSenha(e.target.value)} type="password" placeholder="Sua senha" />
        <button type="submit">Entrar</button>
      </form>
      {erro && <p>{erro}</p>}
    </main>
  )
}