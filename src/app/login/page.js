// Client Component — necessário por usar useState e eventos de usuário
"use client"

import supabase from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Login() {

  // Estados dos campos do formulário — cada input tem seu próprio estado
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")

  // Estado de erro — null significa "sem erro". Quando preenchido, exibe a mensagem na tela.
  const [erro, setErro] = useState(null)

  // useRouter permite redirecionar para outra página via código (sem clique em link)
  const router = useRouter()

  // Handler do submit — chamado quando o usuário clica em "Entrar"
  async function handleLogin(e) {
    e.preventDefault() // impede o form de recarregar a página (comportamento padrão do HTML)

    // signInWithPassword tenta autenticar com email e senha no Supabase Auth
    // Retorna { error } — se error for null, o login foi bem-sucedido
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha
    })

    if (error) {
      setErro(error.message) // preenche o estado de erro para exibir na tela
    } else {
      router.push("/dashboard") // login ok → redireciona para o dashboard
    }
  }

  return (
    <main>
      <h1>Login</h1>

      {/* onSubmit no <form> captura o submit do botão type="submit" dentro dele */}
      <form onSubmit={handleLogin}>

        {/* Inputs controlados — value reflete o estado, onChange atualiza o estado */}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Seu email"
        />
        <input
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password"
          placeholder="Sua senha"
        />
        <button type="submit">Entrar</button>
      </form>

      {/* Renderização condicional — só renderiza o <p> quando erro não for null */}
      {erro && <p>{erro}</p>}
    </main>
  )
}