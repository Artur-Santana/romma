import Link from "next/link";

export default function Header() {
  return (
    <header>
      <div className="bg-surface/95 flex justify-center md:justify-between py-1.25 px-5">
        <div className="hidden md:block text-white/40 font-headline-hanken font-bold text-xs tracking-[0.2em]">
          REF: RM-2026-X // GRID.OS.ALFA
        </div>
        <div className="text-white/40 font-headline-hanken font-bold text-xs tracking-[0.2em]">
          LOC: -23.608713° N, 46.754611°
        </div>
        <div className="hidden md:block text-white/40 font-headline-hanken font-bold text-xs tracking-[0.2em]">
          DATA: 09.06.2026 // STATUS: OTIMIZADO
        </div>
      </div>

      <nav className="bg-neutral py-3 px-5 flex justify-between content-start border-white/12 border relative">
        <div className="content-center">
          <div className="text-white font-headline-hanken font-bold text-3xl tracking-[-1.2px]">
            ROMMA
          </div>
        </div>

        <div className="hidden md:flex text-white/50 md:ml-25 gap-15 font-headline-hanken font-normal tracking-widest text-sm p-0.5 content-center">
          <Link href="/unidades" className="animacao-underscore content-center">
            UNIDADES DISPONIVEIS
          </Link>
          <Link href="/dashboard/contratos" className="animacao-underscore content-center">
            CONTRATOS
          </Link>
          <Link href="/portal/dashboard" className="animacao-underscore content-center">
            PORTAIS
          </Link>
          <Link href="/dashboard" className="animacao-underscore content-center">
            DASHBOARD
          </Link>
        </div>

        <div className="hidden md:flex text-white/70 font-headline-hanken gap-3 content-center">
          <Link
            href="/dashboard"
            className="content-center font-normal tracking-widest text-sm p-3 animacao-underscore"
          >
            ENTRAR
          </Link>
          <Link
            href="/signup"
            className="content-center text-white font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-4 px-10 cursor-pointer"
          >
            COMEÇAR AGORA
          </Link>
        </div>

        <details className="md:hidden group">
          <summary className="list-none [&::-webkit-details-marker]:hidden [&::marker]:hidden flex flex-col justify-center items-center w-10 h-10 cursor-pointer">
            <span className="block h-px w-6 bg-white transition-transform duration-300 group-open:translate-y-1.75 group-open:rotate-45"></span>
            <span className="block h-px w-6 bg-white my-1.5 transition-opacity duration-300 group-open:opacity-0"></span>
            <span className="block h-px w-6 bg-white transition-transform duration-300 group-open:-translate-y-1.75 group-open:-rotate-45"></span>
          </summary>

          <div className="absolute left-0 right-0 top-full bg-neutral border-x border-b border-white/12 z-20">
            <div className="flex flex-col p-5 gap-5 font-headline-hanken">
              <Link
                href="/unidades"
                className="text-white/70 font-normal tracking-widest text-sm animacao-underscore w-fit"
              >
                PROPRIEDADES
              </Link>
              <Link
                href="/dashboard/contratos"
                className="text-white/70 font-normal tracking-widest text-sm animacao-underscore w-fit"
              >
                CONTRATOS
              </Link>
              <Link
                href="/portal/dashboard"
                className="text-white/70 font-normal tracking-widest text-sm animacao-underscore w-fit"
              >
                PORTAIS
              </Link>
              <Link
                href="/dashboard"
                className="text-white/70 font-normal tracking-widest text-sm animacao-underscore w-fit"
              >
                DASHBOARD
              </Link>
              <div className="border-t border-white/10 pt-5 flex flex-col gap-3">
                <Link
                  href="/login"
                  className="text-white/70 font-normal tracking-widest text-sm animacao-underscore w-fit"
                >
                  ENTRAR
                </Link>
                <Link
                  href="/login"
                  className="w-full text-white font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-4 px-10 cursor-pointer text-center"
                >
                  COMEÇAR AGORA
                </Link>
              </div>
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
