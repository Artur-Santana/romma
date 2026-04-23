import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-neutral">
      <div className="px-5 md:px-10 lg:px-30 xl:px-60 pt-10 md:pt-15 pb-8 md:pb-10 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
        <div className="flex flex-col gap-5 col-span-2 lg:col-span-1">
          <div className="text-white font-headline-hanken font-bold text-2xl md:text-3xl tracking-[-1.2px]">
            ROMMA
          </div>
          <p className="text-white/60 font-body text-balance text-sm">
            GESTÃO DE PROPRIEDADES DE NÍVEL PROFISSIONAL PARA A ELITE ARQUITETÔNICA. CALIBRADO PARA PERFORMANCE.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-primary-hover font-headline-hanken font-semibold text-xs tracking-[0.2em]">
            PLATAFORMA
          </h2>
          <div className="flex flex-col gap-3 font-headline-hanken text-white/50 text-sm tracking-widest">
            <Link href="/unidades" className="animacao-underscore w-fit">PROPRIEDADES</Link>
            <Link href="#" aria-disabled="true" tabIndex={-1} className="animacao-underscore w-fit">CONTRATOS</Link>
            <Link href="#" aria-disabled="true" tabIndex={-1} className="animacao-underscore w-fit">PORTAIS</Link>
            <Link href="#" aria-disabled="true" tabIndex={-1} className="animacao-underscore w-fit">DASHBOARD</Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-primary-hover font-headline-hanken font-semibold text-xs tracking-[0.2em]">
            SUPORTE
          </h2>
          <div className="flex flex-col gap-3 font-headline-hanken text-white/50 text-sm tracking-widest">
            <Link href="#" aria-disabled="true" tabIndex={-1} className="animacao-underscore w-fit">DOCUMENTAÇÃO</Link>
            <Link href="#" aria-disabled="true" tabIndex={-1} className="animacao-underscore w-fit">CENTRAL DE AJUDA</Link>
            <Link href="#" aria-disabled="true" tabIndex={-1} className="animacao-underscore w-fit">FALE CONOSCO</Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-primary-hover font-headline-hanken font-semibold text-xs tracking-[0.2em]">
            ACESSO
          </h2>
          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-3">
            <Link
              href="/login"
              className="font-headline-hanken font-normal tracking-widest text-sm text-white/50 animacao-underscore w-fit"
            >
              ENTRAR
            </Link>
            <button type="button" disabled className="w-fit text-white font-headline-hanken font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-3 px-6 text-sm cursor-pointer">
              COMEÇAR AGORA
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-10 lg:px-30 xl:px-60 py-5 border-t border-white/10 flex flex-col md:flex-row gap-3 md:gap-0 justify-between">
        <div className="font-headline-hanken text-white/40 text-xs tracking-[0.2em]">
          ©2026 ROMMA — Artur Santana
        </div>
        <div className="flex gap-5 md:gap-8 font-headline-hanken text-white/40 text-xs tracking-[0.2em]">
          <Link href="#" aria-disabled="true" tabIndex={-1} className="animacao-underscore">PRIVACIDADE</Link>
          <Link href="#" aria-disabled="true" tabIndex={-1} className="animacao-underscore">TERMOS</Link>
        </div>
      </div>
    </footer>
  )
}
