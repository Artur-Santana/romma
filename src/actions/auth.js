"use server"

import supabaseAdmin from "@/lib/supabaseAdmin"

export async function cadastrarProprietario({ email, senha, nome, sobrenome, telefone }) {
  if (!email || !senha || !nome || !sobrenome || !telefone) {
    return { status: 400, erroMessage: "Todos os campos são obrigatórios." }
  }

  const siteUrl = process.env.SITE_URL
  if (!siteUrl) {
    return { status: 500, erroMessage: "Configuração de servidor incompleta. Contate o administrador." }
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: false,
    user_metadata: { nome, sobrenome, telefone },
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    },
  })

  if (error) {
    return { status: error.status ?? 500, erroMessage: error.message }
  }

  return { status: 200 }
}
