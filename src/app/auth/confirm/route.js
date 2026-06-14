import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServer } from "@/lib/supabase-server"
import supabaseAdmin from "@/lib/supabaseAdmin"

async function atualizarStatusConvite(userId, userEmail) {
  // UPDATE primário por usuario_id (retorna linhas afetadas)
  const { data: rows, error: errPrimary } = await supabaseAdmin
    .from("locatarios")
    .update({ status_convite: "aceito" })
    .eq("usuario_id", userId)
    .select("id")

  if (errPrimary) {
    console.error("[auth/confirm] atualizarStatusConvite primary update error:", errPrimary)
  }

  // Fallback por email quando UPDATE primário não afeta linhas (locatário existe mas usuario_id ainda não vinculado)
  if (!rows || rows.length === 0) {
    const { error: errFallback } = await supabaseAdmin
      .from("locatarios")
      .update({ status_convite: "aceito", usuario_id: userId })
      .eq("email", userEmail)
    if (errFallback) {
      console.error("[auth/confirm] atualizarStatusConvite fallback update error:", errFallback)
    }
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

// Redireciona copiando os cookies de sessão estagiados pelo Supabase SSR (setAll)
// para o NextResponse — em Route Handlers GET, mutações em cookies() não propagam
// para um NextResponse.redirect separado, então a sessão se perde sem esta cópia (CR-02).
async function redirectComSessao(path, request) {
  const res = NextResponse.redirect(new URL(path, request.url))
  const cookieStore = await cookies()
  for (const cookie of cookieStore.getAll()) {
    res.cookies.set(cookie.name, cookie.value, cookie)
  }
  return res
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const code = searchParams.get("code")
  const next = searchParams.get("next")

  const supabase = await createServer()

  if (token_hash && type) {
    // Caminho primário: inviteUserByEmail envia token_hash + type=invite
    // Também trata type=recovery (reset de senha) e type=signup (confirmação de email via signUp)
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (error) {
      return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
    }
    if (type === "recovery") {
      // Recovery: estabelece a sessão (cookies copiados) e ativa o sub-fluxo
      // define-new-password em /auth/reset-password.
      return redirectComSessao("/auth/reset-password", request)
    }
    if (data?.user) {
      // Promoção a Proprietário APENAS em signup — nunca em invite ou outros fluxos (CR-01)
      if (type === "signup") {
        const viroupProprietario = await tentarRegistrarProprietario(data.user.id, data.user.user_metadata)
        if (viroupProprietario) {
          return redirectComSessao("/dashboard", request)
        }
        // Promoção falhou (erro transitório de DB, não UNIQUE). Como fallback, tentar
        // atualizar status_convite caso o email coincida com um locatário pendente
        // (evita que o convite fique em "pendente" para sempre).
        await atualizarStatusConvite(data.user.id, data.user.email)
      } else if (type === "invite") {
        await atualizarStatusConvite(data.user.id, data.user.email)
      }
    }
    return redirectComSessao("/portal/dashboard", request)
  }

  if (code) {
    // Fallback: template customizado com {{ .Code }} usa PKCE/OAuth flow
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
    }
    // Recovery via PKCE (reset de senha): o link de recovery do @supabase/ssr volta
    // como ?code=...&next=recovery. Estabelece a sessão e envia ao sub-fluxo
    // define-new-password — NUNCA promove a Proprietário neste caminho.
    if (next === "recovery") {
      return redirectComSessao("/auth/reset-password", request)
    }
    if (data?.user) {
      // type não está disponível no caminho code — inferir papel via user_metadata.
      // Apenas promover a Proprietário quando user_metadata.nome está presente
      // (definido por cadastrarProprietario no signUp). Usuários convidados
      // (locatários) não possuem esses metadados e nunca devem ser promovidos.
      const meta = data.user.user_metadata ?? {}
      if (meta.nome) {
        const viroupProprietario = await tentarRegistrarProprietario(data.user.id, meta)
        if (viroupProprietario) {
          return redirectComSessao("/dashboard", request)
        }
      }
      await atualizarStatusConvite(data.user.id, data.user.email)
    }
    return redirectComSessao("/portal/dashboard", request)
  }

  // Sem parâmetros válidos
  return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
}
