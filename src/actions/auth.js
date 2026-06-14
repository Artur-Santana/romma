"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// emailRedirectTo usa SITE_URL (env server-only) pois window não está disponível em Server Actions.
export async function cadastrarProprietario({ email, senha, nome, sobrenome, telefone }) {
  if (!email || !senha || !nome || !sobrenome || !telefone) {
    return { status: 400, erroMessage: "Todos os campos são obrigatórios." }
  }

  // Criar conta via cliente Supabase com cookies do browser (necessário para
  // que o Supabase SSR gerencie a sessão corretamente no fluxo de confirmação de email)
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, sobrenome, telefone },
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  })

  if (error) {
    return { status: error.status ?? 500, erroMessage: error.message }
  }

  return { status: 200 }
}
