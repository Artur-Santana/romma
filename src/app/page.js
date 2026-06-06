import Link from "next/link";
import Image from "next/image";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <div className="bg-neutral">
      <Header />

      <main className="flex flex-col gap-8 md:gap-12 lg:gap-15">
        <section className="relative overflow-hidden px-5 md:px-10 lg:px-30 xl:px-60 bg-black flex-col border">
          <Image
            src="/Detalhe_Arquitetonico.png"
            alt=""
            aria-hidden="true"
            fill
            className="lg:hidden object-cover opacity-20"
            sizes="100vw"
            priority
          />
          <div className="lg:hidden absolute inset-0 bg-black/40 pointer-events-none" />
          <div className="relative z-10 text-highlight font-headline-hanken font-semibold text-xs tracking-[0.2em] px-5 pt-8 md:pt-12 lg:pt-15">
            ◼ SISTEMA_DE_COMANDO.v4
          </div>
          <div className="relative z-10 text-white flex flex-col lg:flex-row">
            <div className="p-5 basis-full lg:basis-7/10 flex flex-col gap-6 md:gap-8">
              <div className="font-headline-hanken font-black text-4xl md:text-6xl lg:text-7xl flex flex-col gap-2">
                <span className="text-white tracking-[-1.5px] md:tracking-[-2.5px] lg:tracking-[-3.5px]">
                  GERENCIE SUAS PROPRIEDADES.
                </span>
                <span className="text-primary-hover tracking-[0]">
                  CONTROLE CADA CONTRATO.
                </span>
              </div>
              <div>
                <p className="text-white/60 font-body pr-0 lg:pr-50 text-balance mt-5">
                  O blueprint digital para operações imobiliárias modernas.
                  Calibrado para uma grade matemática rigorosa para eliminar
                  fricção e escalar seu portfólio com eficiência geométrica.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 font-headline-hanken font-semibold tracking-4">
                <Link href="/login" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover cursor-pointer text-center">
                  ACESSAR DASHBOARD
                </Link>
                <Link href="/unidades" className="py-4 px-10 bg-background cursor-pointer text-center">
                  VER UNIDADES
                </Link>
              </div>
            </div>

            <div className="hidden lg:block p-5 basis-5/10">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/Detalhe_Arquitetonico.png"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40vw"
                />
                <div className="absolute inset-0 bg-primary-hover/20"></div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="px-5 md:px-10 lg:px-30 xl:px-60 bg-neutral flex flex-col gap-6 md:gap-8">
            <div className="flex flex-row gap-3 items-center">
              <Image src="/horizontal_divider.svg" alt="" width={32} height={1} unoptimized className="hidden sm:block" />
              <div className="text-primary-hover font-headline-hanken font-semibold text-xs md:text-sm tracking-[0.2em] bg-primary-hover/25 p-1">
                VISÃO GERAL DO SISTEMA // MÉTRICAS EM TEMPO REAL
              </div>
            </div>
            <div className="md:mr-0 lg:mr-60 xl:mr-120">
              <span className="font-headline-hanken font-black text-3xl md:text-5xl lg:text-7xl tracking-[-1px] md:tracking-[-2px] lg:tracking-[-3px]">
                COMPONENTES DE UM SISTEMA INTERCONECTADO.
              </span>
            </div>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-1 font-headline-hanken bg-white/10">
                <div className="p-8 bg-background border border-neutral/25">
                  <div className="flex flex-col gap-5">
                    <div className= "text-primary-hover font-headline-hanken font-semibold text-sm tracking-[0.2em] flex gap-5">
                      <Image src="/icon_qr_01.svg" alt="" width={28} height={28} unoptimized className="w-7" />
                      <span className="bg-primary-hover/10 p-1">SISTEMA.01</span>
                    </div>
                    <div className="text-white font-bold tracking-[-1px] text-xl md:text-2xl">LISTAGEM DE UNIDADES</div>
                    <div>
                      <p className="font-body text-white/50 tracking-[0] text-lg wrap-normal">Sincronização de inventário ao vivo em todos os
                        portais. Gerencie taxas de ocupação com algoritmos
                        inteligentes que priorizam leads de alto valor.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-background border border-neutral/25">
                  <div className="flex flex-col gap-5">
                    <div className= "text-primary-hover font-headline-hanken font-semibold text-sm tracking-[0.2em] flex gap-5">
                      <Image src="/icon_doc_02.svg" alt="" width={20} height={20} unoptimized className="w-5" />
                      <span className="bg-primary-hover/10 p-1">SISTEMA.02</span>
                    </div>
                    <div className="text-white font-bold tracking-[-1px] text-xl md:text-2xl">CONTRATOS AUTOMATIZADOS</div>
                    <div>
                      <p className="font-body text-white/50 tracking-[0] text-lg wrap-normal">Entrada manual zero para contratos de aluguel.
                        Templates jurídicos são gerados instantaneamente
                        com base nos dados do Locatário e conformidade
                        regional.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-background border border-neutral/25">
                  <div className="flex flex-col gap-5">
                    <div className= "text-primary-hover font-headline-hanken font-semibold text-sm tracking-[0.2em] flex gap-5">
                      <Image src="/icon_conect_03.svg" alt="" width={28} height={28} unoptimized className="w-7" />
                      <span className="bg-primary-hover/10 p-1">SISTEMA.03</span>
                    </div>
                    <div className="text-white font-bold tracking-[-1px] text-xl md:text-2xl">PORTAL DO LOCATÁRIO</div>
                    <div>
                      <p className="font-body text-white/50 tracking-[0] text-lg wrap-normal">Um espaço de trabalho dedicado para seus
                        Locatários. Solicite manutenção, pague faturas e
                        renove contratos sem precisar de chamadas
                        telefônicas.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-background">
                  <div className="flex flex-col gap-5">
                    <div className= "text-primary-hover font-headline-hanken font-semibold text-sm tracking-[0.2em] flex gap-5">
                      <Image src="/icon_graph_04.svg" alt="" width={28} height={28} unoptimized className="w-7" />
                      <span className="bg-primary-hover/10 p-1">SISTEMA.04</span>
                    </div>
                    <div className="text-white font-bold tracking-[-1px] text-xl md:text-2xl">PAINEL DO PROPRIETÁRIO</div>
                    <div>
                      <p className="font-body text-white/50 tracking-[0] text-lg wrap-normal">Transparência total para os stakeholders. Visões financeiras
                      detalhadas e modelagem preditiva de fluxo de caixa.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block p-8 bg-background"></div>
                <div className="p-8 bg-background flex items-center justify-center col-span-1 md:col-span-2 lg:col-span-1">
                  <Link href="/login" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover font-headline-hanken font-semibold tracking-[0.2em] text-white text-sm cursor-pointer text-center">
                    ACESSAR PAINEL
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-background/50 font-headline-hanken">
          <div className="py-8 md:py-12 lg:py-15">
          <div className="bg-background/60 mx-5 md:mx-10 lg:mx-30 xl:mx-60 px-3 md:px-5 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-2 gap-4 border">
            <div className="flex flex-col gap-8 md:gap-10">
              <div className="w-min text-nowrap px-2">
                <span className="text-highlight/70 font-normal tracking-[1.5px]">DASHBOARD // HUB_PRINCIPAL</span>
              </div>
              <div className="px-4 md:px-6 lg:px-10 flex flex-col gap-6 md:gap-8">
                <div className="text-primary-hover font-headline-hanken font-semibold text-xs md:text-sm tracking-[0.2em] bg-primary-hover/25 p-1 px-2 lg:w-min lg:text-nowrap">VISÃO GERAL DO SISTEMA // MÉTRICAS EM TEMPO REAL</div>
                <span className="font-headline-hanken font-black text-2xl md:text-4xl lg:text-5xl tracking-[-1px] md:tracking-[-2px] lg:tracking-[-3px]">CENTRAL DE DADOS E INSIGHTS ESTRATÉGICOS.</span>
                <div className="bg-neutral">
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between">
                      <span className="font-headline-hanken font-medium tracking-[1.5px] text-sm text-white/40">ÍNDICE DE DEMANDA REGIONAL</span>
                      <span className="font-headline-hanken font-bold tracking-[1.5px] text-sm text-primary-hover">+12.4% ESTE MÊS</span>
                    </div>
                    <div className="relative h-32">
                      <Image fill className="object-contain" src="/data_regional_demand_graph.png" alt="Gráfico de demanda regional" sizes="100vw" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
                  <div className="bg-neutral w-full min-w-0">
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex justify-between">
                        <span className="font-headline-hanken font-medium tracking-[1.5px] text-sm text-white/40 text-nowrap">TAXA DE VACÂNCIA</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-highlight  font-bold tracking-0 text-3xl">2.1%</span>
                        <span className="text-green-500 font-normal tracking-0 text-sm">↓ 0.4% vs prev.</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral w-full min-w-0">
                    <div className="p-5 flex flex-col gap-3">
                      <div className="flex justify-between">
                        <span className="font-headline-hanken font-medium tracking-[1.5px] text-sm text-white/40 text-nowrap">CAP RATE MÉDIO</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white  font-bold tracking-0 text-3xl">6.8%</span>
                        <span className="text-white/20 font-normal tracking-0 text-sm">Estavel</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-body text-white/50 tracking-[0] text-lg wrap-normal">Relatórios analíticos gerados via inteligência neural cruzando dados de
                  mercado com performance interna do portfólio.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[url(/data_background.png)] bg-no-repeat bg-cover">
              <div className="px-4 md:px-6 lg:px-10 py-10 md:py-20 lg:py-40 align-middle">
                <div className="p-5 md:p-8 bg-background/85">
                  <div className="flex flex-col gap-10">
                    <span className="text-white font-headline-hanken font-medium tracking-[1.5px]">PREVISÃO_FLUXO_2026</span>
                    <div className="border-t border-gray-300/15"></div>
                    <div className="lg:pl-2 lg:pr-2 flex flex-col gap-5">
                      <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-8 gap-3 md:gap-5 items-center">
                        <span className="text-white/40 font-normal tracking-[1.5px]">ABRIL</span>
                        <div className="md:col-span-6 flex min-w-0 overflow-hidden w-full">
                          <div className="bg-primary-hover shadow-[0_0_6px_0px_var(--color-primary-hover)] self-center h-3 w-[45%] shrink-0"></div>
                          <div className="bg-secondary self-center h-3 w-[60%] shrink-0"></div>
                        </div>
                        <span className="text-white/60 font-normal tracking-[1.5px] text-nowrap">R$ 1.2M</span>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-8 gap-3 md:gap-5 items-center">
                        <span className="text-white/40 font-normal tracking-[1.5px]">MAIO</span>
                        <div className="md:col-span-6 flex min-w-0 overflow-hidden w-full">
                          <div className="bg-primary-hover shadow-[0_0_6px_0px_var(--color-primary-hover)] self-center h-3 w-[65%] shrink-0"></div>
                          <div className="bg-secondary self-center h-3 w-[45%] shrink-0"></div>
                        </div>
                        <span className="text-white/60 font-normal tracking-[1.5px] text-nowrap">R$ 1.8M</span>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-8 gap-3 md:gap-5 items-center">
                        <span className="text-white/40 font-normal tracking-[1.5px]">JUNHO</span>
                        <div className="md:col-span-6 flex min-w-0 overflow-hidden w-full">
                          <div className="bg-highlight shadow-[0_0_6px_0px_var(--color-highlight)] self-center h-3 w-[85%] shrink-0"></div>
                          <div className="bg-secondary self-center h-3 w-[15%] shrink-0"></div>
                        </div>
                        <span className="text-white/60 font-normal tracking-[1.5px] text-nowrap">R$ 2.4M</span>
                      </div>
                      <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-8 gap-3 md:gap-5 items-center">
                        <span className="text-white/40 font-normal tracking-[1.5px]">JULHO</span>
                        <div className="md:col-span-6 flex min-w-0 overflow-hidden w-full">
                          <div className="bg-primary-hover shadow-[0_0_6px_0px_var(--color-primary-hover)] self-center h-3 w-[77%] shrink-0"></div>
                          <div className="bg-secondary self-center h-3 w-[23%] shrink-0"></div>
                        </div>
                        <span className="text-white/60 font-normal tracking-[1.5px] text-nowrap">R$ 2.1M</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-300/15"></div>
                    <div className="flex flex-col lg:flex-row lg:justify-between gap-2 lg:gap-0">
                      <div>
                        <span className="text-white/30 font-headline-hanken font-medium tracking-[1.5px]">ID: INSIGHT_#4492</span>
                      </div>
                      <div>
                        <span className="text-highlight font-headline-hanken font-medium tracking-[1.5px] ">A ROMMA TRANSFORMOU NOSSA GESTÃO...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
