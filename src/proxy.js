import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // WR-01: getUser() pode atualizar silenciosamente o token de sessão via setAll,
  // gravando novos cookies no objeto `response`. Redirects criados depois perderiam
  // esses cookies porque são respostas novas. Esta função copia todos os cookies de
  // `response` para a resposta de redirect, garantindo que o browser receba as
  // credenciais atualizadas mesmo quando ocorre um redirect.
  function redirectWithCookies(target) {
    const r = NextResponse.redirect(new URL(target, request.url))
    response.cookies.getAll().forEach(c => r.cookies.set(c))
    return r
  }

  const onDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const onPortal = request.nextUrl.pathname.startsWith('/portal')
  const onSignup = request.nextUrl.pathname === '/signup'

  // Usuário autenticado em /signup → redirecionar para /dashboard
  if (onSignup && user) {
    return redirectWithCookies('/dashboard')
  }

  if ((onDashboard || onPortal) && !user) {
    return redirectWithCookies('/login')
  }

  if (onDashboard || onPortal) {
    const { data: isProprietario } = await supabase.rpc('is_proprietario')
    if (onDashboard && !isProprietario) return redirectWithCookies('/')
    if (onPortal && isProprietario) return redirectWithCookies('/dashboard')
  }

  return response
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/portal', '/portal/:path*', '/signup'],
}