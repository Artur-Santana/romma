import Link from "next/link"
import Header from "@/components/ui/Header"
import UnidadeCardPublico from "@/components/ui/UnidadeCardPublico"
import { getUnidadesDisponiveis } from "@/lib/queries"

export default async function UnidadesPublicas() {
    const unidades = await getUnidadesDisponiveis()

    return (
        <div className="bg-neutral min-h-screen">
            <Header />

            <main className="px-5 md:px-10 lg:px-30 xl:px-60 py-10 md:py-15 flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                    <div className="text-primary-hover font-headline-hanken font-semibold text-xs tracking-[0.2em] bg-primary-hover/25 p-1 w-fit">
                        LISTAGEM PÚBLICA // INVENTÁRIO DISPONÍVEL
                    </div>
                    <h1 className="font-headline-hanken font-black text-3xl md:text-5xl tracking-[-1px] md:tracking-[-2px]">
                        UNIDADES DISPONÍVEIS
                    </h1>
                </div>

                {!unidades || unidades.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-white/50 font-headline-hanken tracking-widest text-sm">
                            Nenhuma unidade disponível no momento
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unidades.map(unidade => (
                            <UnidadeCardPublico unidade={unidade} key={unidade.id} />
                        ))}
                    </div>
                )}
            </main>

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
                        <div className="text-primary-hover font-headline-hanken font-semibold text-xs tracking-[0.2em]">
                            PLATAFORMA
                        </div>
                        <div className="flex flex-col gap-3 font-headline-hanken text-white/50 text-sm tracking-widest">
                            <Link href="/unidades" className="animacao-underscore w-fit">PROPRIEDADES</Link>
                            <Link href="#" className="animacao-underscore w-fit">CONTRATOS</Link>
                            <Link href="#" className="animacao-underscore w-fit">PORTAIS</Link>
                            <Link href="#" className="animacao-underscore w-fit">DASHBOARD</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="text-primary-hover font-headline-hanken font-semibold text-xs tracking-[0.2em]">
                            SUPORTE
                        </div>
                        <div className="flex flex-col gap-3 font-headline-hanken text-white/50 text-sm tracking-widest">
                            <Link href="#" className="animacao-underscore w-fit">DOCUMENTAÇÃO</Link>
                            <Link href="#" className="animacao-underscore w-fit">CENTRAL DE AJUDA</Link>
                            <Link href="#" className="animacao-underscore w-fit">FALE CONOSCO</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="text-primary-hover font-headline-hanken font-semibold text-xs tracking-[0.2em]">
                            ACESSO
                        </div>
                        <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 lg:gap-3">
                            <Link
                                href="/login"
                                className="font-headline-hanken font-normal tracking-widest text-sm text-white/50 animacao-underscore w-fit"
                            >
                                ENTRAR
                            </Link>
                            <button type="button" className="w-fit text-white font-headline-hanken font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-3 px-6 text-sm cursor-pointer">
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
                        <Link href="#" className="animacao-underscore">PRIVACIDADE</Link>
                        <Link href="#" className="animacao-underscore">TERMOS</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
