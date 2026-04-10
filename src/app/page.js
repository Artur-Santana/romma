"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  async function pushLogin() {
    router.push("/login");
  }

  return (
    <div className="bg-gray-700">
      {/* Cabeçalho — logo/nome + navegação */}
      <header>
        <div className="bg-[#1A1A1A] flex justify-between py-1.25 px-5 ">
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
        <nav className="bg-black py-3 px-5 flex justify-between content-start border-white/12 border-1">
          <div className="content-center">
            <div className="text-white font-headline-hanken font-bold text-3xl tracking-[-1.2px]">
              ROMMA
            </div>
          </div>
          <div className="text-white/50 md:ml-25 flex gap-15 font-headline-hanken font-normal tracking-widest text-sm p-0.5 content-center">
            <span className="animacao-underscore content-center cursor-pointer">
              PROPRIEDADES
            </span>
            <span className="animacao-underscore content-center cursor-pointer">
              CONTRATOS
            </span>
            <span className="animacao-underscore content-center cursor-pointer">
              PORTAIS
            </span>
            <span className="animacao-underscore content-center cursor-pointer">
              DASHBOARD
            </span>
          </div>
          <div className="text-white/70 font-headline-hanken flex gap-3 content-center">
            <button
              className="content-center font-normal tracking-widest text-sm p-3 animacao-underscore"
              onClick={pushLogin}
            >
              ENTRAR
            </button>
            <button className="content-center text-white font-semibold tracking-4 bg-linear-45 from-(--color-primary) to-(--color-primary-hover) py-4 px-10 cursor-pointer">
              COMEÇAR AGORA
            </button>{" "}
            {/* Nós temos uma tela de cadastro? Se não talvez tenhamos que criar uma ou reutilizar a de login */}
          </div>
        </nav>
      </header>

      <main className="">
        <section className="px-60  bg-black flex-col">
          <div className= "text-(--color-highlight) font-headline-hanken font-semibold text-xs tracking-[0.2em] px-5 pt-15">◼ SISTEMA_DE_COMANDO.v4</div>
          <div className= "text-white flex">
            <div className="p-5 basis-7/10 flex flex-col gap-8">
              <div className="font-headline-hanken font-bold text-7xl flex flex-col gap-2">
                <span className="text-white tracking-[-3.5px]" >GERENCIE SUAS PROPRIEDADES.</span>
                <span className="text-(--color-primary-hover) tracking-[0]">CONTROLE CADA CONTRATO.</span>
              </div>
              <div>
                <p className="text-white/60 font-body pr-50 text-balance mt-5">
                  O blueprint digital para operações imobiliárias modernas.
                  Calibrado para uma grade matemática rigorosa para eliminar
                  fricção e escalar seu portfólio com eficiência geométrica.
                </p>
              </div>
              <div className="flex gap-5 font-headline-hanken font-semibold tracking-4 " >
                  <button className="py-4 px-10 bg-linear-45 from-(--color-primary) to-(--color-primary-hover) ">INICIE GRATUITAMENTE</button>
                  <button className="py-4 px-10 bg-(--color-secondary) " >VER PROJETOS</button>
              </div>
            </div>
            
            <div className="p-5 basis-5/10">
            <div className="relative">
              <img className="w-screen" src="/Detalhe_Arquitetonico.png"></img>
              <div className=" absolute inset-0 bg-(--color-primary-hover)/20"> 

              </div>
            </div>
            </div>
          </div>
        </section>

        <section>
        </section>
      </main>
      <footer></footer>
    </div>
  );
}
