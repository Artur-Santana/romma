'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function HeaderDashboard() {
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navLinks = [
    { href: '/dashboard', label: 'VISÃO GERAL' },
    { href: '/dashboard/unidades', label: 'UNIDADES' },
    { href: '/dashboard/locatarios', label: 'LOCATÁRIOS' },
    { href: '/dashboard/contratos', label: 'CONTRATOS' },
  ]

  return (
    <header>
      <nav className="bg-neutral py-3 px-5 flex justify-between items-center border-b border-white/12">
        <div className="text-white font-headline-hanken font-bold text-3xl tracking-[-1.2px]">
          ROMMA
        </div>

        <div className="hidden md:flex gap-8 font-headline-hanken font-normal tracking-widest text-sm">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`animacao-underscore content-center ${
                pathname === href ? 'text-white' : 'text-white/50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="text-white/70 font-headline-hanken font-normal tracking-widest text-sm p-3 animacao-underscore cursor-pointer"
        >
          SAIR
        </button>
      </nav>
    </header>
  )
}
