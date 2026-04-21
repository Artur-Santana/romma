import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-neutral">
      {/* Cabeçalho — logo/nome + navegação */}
      <header>
        <div className="bg-surface/95 flex justify-between py-1.25 px-5">
          <div className="text-white/40 font-headline-hanken font-bold text-xs tracking-[0.2em]">
            REF: RM-2026-X // GRID.OS.ALFA
          </div>
          <div className="text-white/40 font-headline-hanken font-bold text-xs tracking-[0.2em]">
            LOC: -23.608713° N, 46.754611°
          </div>
          <div className="text-white/40 font-headline-hanken font-bold text-xs tracking-[0.2em]">
            DATA: 09.06.2026 // STATUS: OTIMIZADO
          </div>
        </div>
        <nav className="bg-neutral py-3 px-5 flex justify-between content-start border-white/12 border">
          <div className="content-center">
            <div className="text-white font-headline-hanken font-bold text-3xl tracking-[-1.2px]">
              ROMMA
            </div>
          </div>
          <div className="text-white/50 md:ml-25 flex gap-15 font-headline-hanken font-normal tracking-widest text-sm p-0.5 content-center">
            <Link href="/unidades" className="animacao-underscore content-center">
              PROPRIEDADES
            </Link>
            <Link href="#" className="animacao-underscore content-center">
              CONTRATOS
            </Link>
            <Link href="#" className="animacao-underscore content-center">
              PORTAIS
            </Link>
            <Link href="#" className="animacao-underscore content-center">
              DASHBOARD
            </Link>
          </div>
          <div className="text-white/70 font-headline-hanken flex gap-3 content-center">
            <Link
              href="/login"
              className="content-center font-normal tracking-widest text-sm p-3 animacao-underscore"
            >
              ENTRAR
            </Link>
            <button type="button" className="content-center text-white font-semibold tracking-4 bg-linear-45 from-primary to-primary-hover py-4 px-10 cursor-pointer">
              COMEÇAR AGORA
            </button>
          </div>
        </nav>
      </header>

      <main className="flex flex-col gap-15">
        <section className="px-60  bg-black flex-col border">
          <div className= "text-highlight font-headline-hanken font-semibold text-xs tracking-[0.2em] px-5 pt-15">◼ SISTEMA_DE_COMANDO.v4</div>
          <div className= "text-white flex">
            <div className="p-5 basis-7/10 flex flex-col gap-8">
              <div className="font-headline-hanken font-black text-7xl flex flex-col gap-2">
                <span className="text-white tracking-[-3.5px]" >GERENCIE SUAS PROPRIEDADES.</span>
                <span className="text-primary-hover tracking-[0]">CONTROLE CADA CONTRATO.</span>
              </div>
              <div>
                <p className="text-white/60 font-body pr-50 text-balance mt-5">
                  O blueprint digital para operações imobiliárias modernas.
                  Calibrado para uma grade matemática rigorosa para eliminar
                  fricção e escalar seu portfólio com eficiência geométrica.
                </p>
              </div>
              <div className="flex gap-5 font-headline-hanken font-semibold tracking-4 " >
                  <button type="button" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover ">INICIE GRATUITAMENTE</button>
                  <button type="button" className="py-4 px-10 bg-background " >VER PROJETOS</button>
              </div>
            </div>

            <div className="p-5 basis-5/10">
            <div className="relative">
              <img
                src="/Detalhe_Arquitetonico.png"
                alt=""
                className="w-full"
              />
              <div className=" absolute inset-0 bg-primary-hover/20">

              </div>
            </div>
            </div>
          </div>
        </section>

        <section>
          <div className="px-60 bg-neutral flex flex-col gap-8">
            <div className="flex flex-row gap-3 ">
              <img src='/horizontal_divider.svg'></img>
              <div className= "text-primary-hover font-headline-hanken font-semibold text-sm tracking-[0.2em] bg-primary-hover/25 p-1">VISÃO GERAL DO SISTEMA // MÉTRICAS EM TEMPO REAL</div>
            </div>
            <div className="md:mr-120">
              <span className="font-headline-hanken font-black text-7xl tracking-[-3.0px]">COMPONENTES DE UM SISTEMA INTERCONECTADO.</span>
            </div>
            <div className="">
              <div className="grid grid-cols-3 gap-y-1 font-headline-hanken bg-white/10 ">
                <div className="p-8 bg-background border border-neutral/25">
                  <div className="flex flex-col gap-5">
                    <div className= "text-primary-hover font-headline-hanken font-semibold text-sm tracking-[0.2em] flex gap-5">
                      <img src="/icon_qr_01.svg" className="w-7"></img>
                      <span className="bg-primary-hover/10 p-1">SISTEMA.01</span>
                    </div>
                    <div className="text-white font-bold tracking-[-1px] text-2xl">LISTAGEM DE UNIDADES</div>
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
                      <img src="/icon_doc_02.svg" className="w-5"></img>
                      <span className="bg-primary-hover/10 p-1">SISTEMA.02</span>
                    </div>
                    <div className="text-white font-bold tracking-[-1px] text-2xl">CONTRATOS AUTOMATIZADOS</div>
                    <div>
                      <p className="font-body text-white/50 tracking-[0] text-lg wrap-normal">Entrada manual zero para contratos de aluguel.
                        Templates jurídicos são gerados instantaneamente
                        com base nos dados do inquilino e conformidade
                        regional.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-background border border-neutral/25">
                  <div className="flex flex-col gap-5">
                    <div className= "text-primary-hover font-headline-hanken font-semibold text-sm tracking-[0.2em] flex gap-5">
                      <img src="/icon_conect_03.svg" className="w-7"></img>
                      <span className="bg-primary-hover/10 p-1">SISTEMA.03</span>
                    </div>
                    <div className="text-white font-bold tracking-[-1px] text-2xl">PORTAL DO LOCATÁRIO</div>
                    <div>
                      <p className="font-body text-white/50 tracking-[0] text-lg wrap-normal">Um espaço de trabalho dedicado para seus
                        inquilinos. Solicite manutenção, pague faturas e
                        renove contratos sem precisar de chamadas
                        telefônicas.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-background">
                  <div className="flex flex-col gap-5">
                    <div className= "text-primary-hover font-headline-hanken font-semibold text-sm tracking-[0.2em] flex gap-5">
                      <img src="/icon_graph_04.svg" className="w-7"></img>
                      <span className="bg-primary-hover/10 p-1">SISTEMA.04</span>
                    </div>
                    <div className="text-white font-bold tracking-[-1px] text-2xl">PAINEL DO PROPRIETÁRIO</div>
                    <div>
                      <p className="font-body text-white/50 tracking-[0] text-lg wrap-normal">Transparência total para os stakeholders. Visões financeiras
                      detalhadas e modelagem preditiva de fluxo de caixa.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-background"></div>
                <div className="p-8 bg-background flex items-center justify-center">
                  <button type="button" className="py-4 px-10 bg-linear-45 from-primary to-primary-hover font-headline-hanken font-semibold tracking-[0.2em] text-white text-sm cursor-pointer">
                    ACESSE ANALITYCS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-background/50 font-headline-hanken">
          <div className="py-15 ">
          <div className="bg-background/60 mx-60 px-5 py-10 grid grid-cols-2 gap-4 border ">
            <div className="flex flex-col gap-10">
              <div className=" w-min text-nowrap px-2">
                <span className="text-highlight/70 font-normal tracking-[1.5px] ">DASHBOARD // HUB_PRINCIPAL</span>
              </div>
              <div className="px-10 flex flex-col gap-8">
                <div className= "text-primary-hover font-headline-hanken font-semibold text-sm tracking-[0.2em] bg-primary-hover/25 p-1 w-min text-nowrap px-2">VISÃO GERAL DO SISTEMA // MÉTRICAS EM TEMPO REAL</div>
                <span className="font-headline-hanken font-black text-5xl tracking-[-3.0px]">CENTRAL DE DADOS E INSIGHTS ESTRATÉGICOS.</span>
                <div className="bg-neutral">
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between">
                      <span className="font-headline-hanken font-medium tracking-[1.5px] text-sm text-white/40">ÍNDICE DE DEMANDA REGIONAL</span>
                      <span className="font-headline-hanken font-bold tracking-[1.5px] text-sm text-primary-hover">+12.4% ESTE MÊS</span>
                    </div>
                    <div>
                      <img className="w-full" src="/data_regional_demand_graph.png"></img>
                    </div>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="bg-neutral w-full">
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
                  <div className="bg-neutral w-full">
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
              <div className="px-10 py-40 align-middle ">
                <div className="p-8 bg-background/85">
                  <div className="flex flex-col gap-10">
                    <span className="text-white font-headline-hanken font-medium traking-[1.5px]">PREVISÃO_FLUXO_2026</span>
                    <div className="border-t border-gray-300/15"></div>
                    <div className="pl-2 pr-2 flex flex-col gap-5">
                      <div className="grid grid-cols-8 gap-5">
                        <div>
                          <span className="text-white/40 font-normal traking-[1.5px]">ABRIL</span>
                        </div>
                        <div className="col-span-6 flex w-full">
                          <div className="bg-primary-hover shadow-[0_0_6px_0px_var(--color-primary-hover)] self-center h-3 w-[45%]"></div>
                          <div className="bg-secondary self-center h-3 w-[60%]"></div>
                        </div>
                        
                        <span className="text-white/60 font-normal traking-[1.5px] text-nowrap">R$ 1.2M</span>
                      </div>
                      <div className="grid grid-cols-8 gap-5">
                        <div>
                          <span className="text-white/40 font-normal traking-[1.5px]">MAIO</span>
                        </div>
                        <div className=" col-span-6 flex w-full">
                          <div className="bg-primary-hover shadow-[0_0_6px_0px_var(--color-primary-hover)] self-center h-3 w-[65%]"></div>
                          <div className="bg-secondary self-center h-3 w-[45%]"></div>
                        </div>
                        
                        <span className="text-white/60 font-normal traking-[1.5px] text-nowrap">R$ 1.8M</span>
                      </div>
                      <div className="grid grid-cols-8 gap-5">
                        <div>
                          <span className="text-white/40 font-normal traking-[1.5px]">JUNHO</span>
                        </div>
                        <div className="col-span-6 flex w-full">
                          <div className="bg-highlight shadow-[0_0_6px_0px_var(--color-highlight)] self-center h-3 w-[85%]"></div>
                          <div className="bg-secondary self-center h-3 w-[15%]"></div>
                        </div>
                        
                        <span className="text-white/60 font-normal traking-[1.5px] text-nowrap">R$ 2.4M</span>
                      </div>
                      <div className="grid grid-cols-8 gap-5">
                        <span className="col-span-1 text-white/40 font-normal traking-[1.5px]">JULHO</span>
                        <div className="col-span-6 flex w-full">
                          <div className="bg-primary-hover shadow-[0_0_6px_0px_var(--color-primary-hover)] self-center h-3 w-[77%]"></div>
                          <div className="bg-secondary self-center h-3 w-[23%]"></div>
                        </div>
                        
                        <span className="text-white/60 font-normal traking-[1.5px] text-nowrap">R$ 2.1M</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-300/15"></div>
                    <div className="flex justify-between">
                      <div>
                        <span className="text-white/30 font-headline-hanken font-medium traking-[1.5px]">ID: INSIGHT_#4492</span>
                      </div>
                      <div>
                        <span className="text-highlight font-headline-hanken font-medium traking-[1.5px] ">A ROMMA TRANSFORMOU NOSSA GESTÃO...</span>
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
      <footer className="bg-neutral">
        <div className="px-60 pt-15 pb-10 grid grid-cols-4 gap-10">
          <div className="flex flex-col gap-5">
            <div className="text-white font-headline-hanken font-bold text-3xl tracking-[-1.2px]">
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
            <div className="flex flex-col gap-3">
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

        <div className="px-60 py-5 border-t border-white/10 flex justify-between">
          <div className="font-headline-hanken text-white/40 text-xs tracking-[0.2em]">
            ©2026 ROMMA — Artur Santana
          </div>
          <div className="flex gap-8 font-headline-hanken text-white/40 text-xs tracking-[0.2em]">
            <Link href="#" className="animacao-underscore">PRIVACIDADE</Link>
            <Link href="#" className="animacao-underscore">TERMOS</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
