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

  const onDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const onPortal = request.nextUrl.pathname.startsWith('/portal')
  const onSignup = request.nextUrl.pathname === '/signup'

  // Usuário autenticado em /signup → redirecionar para /dashboard
  if (onSignup && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if ((onDashboard || onPortal) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (onDashboard || onPortal) {
    const { data: isProprietario } = await supabase.rpc('is_proprietario')
    if (onDashboard && !isProprietario) return NextResponse.redirect(new URL('/', request.url))
    if (onPortal && isProprietario) return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/portal', '/portal/:path*', '/signup'],
}