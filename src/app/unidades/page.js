import Header from "@/components/ui/Header"
import UnidadeCardPublico from "@/components/ui/UnidadeCardPublico"
import Footer from "@/components/ui/Footer"
import { getUnidadesDisponiveis } from "@/lib/queries-server"

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

            <Footer />
        </div>
    )
}
