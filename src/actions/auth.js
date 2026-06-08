"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import supabaseAdmin from "@/lib/supabaseAdmin"

export async function checkProprietarioExiste() {
  const { count, error } = await supabaseAdmin
    .from("proprietarios")
    .select("*", { count: "exact", head: true })

  if (error) {
    return { status: 500, erroMessage: error.message }
  }

  return { status: 200, existe: count > 0 }
}

// WR-02: Server Action para criar conta do Proprietário com guard server-side.
// Re-verifica via supabaseAdmin se já existe Proprietário antes de chamar signUp,
// impedindo criação de contas órfãs via bypass do client-side (devtools, fetch direto, JS desativado).
// emailRedirectTo usa SITE_URL (env server-only) pois window não está disponível em Server Actions.
export async function cadastrarProprietario({ email, senha }) {
  if (!email || !senha) {
    return { status: 400, erroMessage: "Email e senha são obrigatórios." }
  }

  // Guard server-side: checar se instância já está configurada
  const { count, error: countError } = await supabaseAdmin
    .from("proprietarios")
    .select("*", { count: "exact", head: true })

  if (countError) {
    return { status: 500, erroMessage: "Erro ao verificar configuração da instância." }
  }

  if (count > 0) {
    return { status: 409, erroMessage: "Esta instância já possui um Proprietário configurado." }
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
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  })

  if (error) {
    return { status: error.status ?? 500, erroMessage: error.message }
  }

  return { status: 200 }
}
