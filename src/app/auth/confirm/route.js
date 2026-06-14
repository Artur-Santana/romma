import { NextResponse } from "next/server"
import { createServer } from "@/lib/supabase-server"
import supabaseAdmin from "@/lib/supabaseAdmin"

async function atualizarStatusConvite(userId, userEmail) {
  // UPDATE primário por usuario_id (retorna linhas afetadas)
  const { data: rows } = await supabaseAdmin
    .from("locatarios")
    .update({ status_convite: "aceito" })
    .eq("usuario_id", userId)
    .select("id")

  // Fallback por email quando UPDATE primário não afeta linhas (locatário existe mas usuario_id ainda não vinculado)
  if (!rows || rows.length === 0) {
    await supabaseAdmin
      .from("locatarios")
      .update({ status_convite: "aceito", usuario_id: userId })
      .eq("email", userEmail)
  }
}

// AUTH-01: Todo signup confirmado vira Proprietário.
// INSERT só após verifyOtp/exchangeCodeForSession bem-sucedidos (evita registro órfão).
// Se userId já está na tabela (re-confirmação), INSERT falha silenciosamente — ok.
async function tentarRegistrarProprietario(userId, userMetadata = {}) {
  const { nome, sobrenome, telefone } = userMetadata
  const { error: insertError } = await supabaseAdmin
    .from("proprietarios")
    .insert({ usuario_id: userId, nome, sobrenome, telefone })

  // UNIQUE violation = usuário já é Proprietário (re-confirmação), tratar como sucesso
  if (insertError && insertError.code !== "23505") return false

  return true
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const code = searchParams.get("code")

  const supabase = await createServer()

  if (token_hash && type) {
    // Caminho primário: inviteUserByEmail envia token_hash + type=invite
    // Também trata type=recovery (reset de senha) e type=signup (confirmação de email via signUp)
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (error) {
      return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
    }
    if (type === "recovery") {
      return NextResponse.redirect(new URL("/auth/reset-password", request.url))
    }
    if (data?.user) {
      // Promoção a Proprietário APENAS em signup — nunca em invite ou outros fluxos (CR-01)
      if (type === "signup") {
        const viroupProprietario = await tentarRegistrarProprietario(data.user.id, data.user.user_metadata)
        if (viroupProprietario) {
          return NextResponse.redirect(new URL("/dashboard", request.url))
        }
      } else if (type === "invite") {
        await atualizarStatusConvite(data.user.id, data.user.email)
      }
    }
    return NextResponse.redirect(new URL("/portal/dashboard", request.url))
  }

  if (code) {
    // Fallback: template customizado com {{ .Code }} usa PKCE/OAuth flow
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
    }
    if (data?.user) {
      const viroupProprietario = await tentarRegistrarProprietario(data.user.id, data.user.user_metadata)
      if (viroupProprietario) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      await atualizarStatusConvite(data.user.id, data.user.email)
    }
    return NextResponse.redirect(new URL("/portal/dashboard", request.url))
  }

  // Sem parâmetros válidos
  return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
}
