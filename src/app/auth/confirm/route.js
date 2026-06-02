import { NextResponse } from "next/server"
import { createServer } from "@/lib/supabase-server"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const code = searchParams.get("code")

  const supabase = await createServer()

  if (token_hash && type) {
    // Caminho primário: inviteUserByEmail envia token_hash + type=invite
    // Também trata type=recovery (reset de senha)
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (error) {
      return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
    }
    if (type === "recovery") {
      return NextResponse.redirect(new URL("/auth/reset-password", request.url))
    }
    return NextResponse.redirect(new URL("/portal/dashboard", request.url))
  }

  if (code) {
    // Fallback: template customizado com {{ .Code }} usa PKCE/OAuth flow
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
    }
    return NextResponse.redirect(new URL("/portal/dashboard", request.url))
  }

  // Sem parâmetros válidos
  return NextResponse.redirect(new URL("/login?error=invite_invalid", request.url))
}
