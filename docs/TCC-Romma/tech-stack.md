# 🔧 Tech Stack

# Arquitetura do Sistema

```
[Usuário] → Next.js + Tailwind + shadcn/ui (Frontend)
                    ↕ API automática (PostgREST + Realtime)
          Supabase (Auth + Banco PostgreSQL + Backend)
                    ↕
             Vercel (Deploy gratuito)
```

---

# Stack Detalhado

| Camada | Tecnologia | Motivo |
| --- | --- | --- |
| Frontend | Next.js + Tailwind CSS + shadcn/ui | Rápido, componentes prontos, ótima DX |
| Backend | Supabase (PostgREST) | API automática a partir do schema do banco |
| Banco de Dados | PostgreSQL (via Supabase) | Relacional, robusto, adequado para contratos e relações |
| Autenticação | Supabase Auth | Auth nativo, integrado ao banco, sem servidor extra |
| Tempo Real | Supabase Realtime | Atualização ao vivo da listagem pública de Unidades |
| Deploy | Vercel | Feito para Next.js, deploy em minutos, gratuito |

---

# Por que essa arquitetura?

O Supabase elimina a necessidade de um servidor backend separado ao expor automaticamente uma API REST e Realtime sobre o banco PostgreSQL. Isso reduz drasticamente o volume de código a ser escrito e mantido por um desenvolvedor solo, sem sacrificar robustez técnica.

O Next.js foi escolhido por centralizar frontend e, caso necessário, chamadas server-side em um único projeto e repositório, simplificando o deploy na Vercel.

---

# O que foi descartado e por quê

**Microsserviços** — overhead desnecessário para um projeto solo.

**GraphQL** — curva de aprendizado alta sem ganho real para esse escopo.

**MongoDB** — os dados do sistema (contratos, parcelas, unidades) têm relações claras e se beneficiam de um banco relacional. Além disso, um banco relacional valoriza na banca avaliadora.

**Prisma ORM** — substituído pelo cliente nativo do Supabase, que já oferece tipagem e é mais simples de configurar dentro desse stack.

---

# Pacotes Instalados (package.json)

| Pacote | Versão | Uso |
| --- | --- | --- |
| `next` | `16.2.0` | Framework principal |
| `react` / `react-dom` | `19.2.4` | Runtime React |
| `@supabase/supabase-js` | `^2.99.2` | Cliente Supabase principal |
| `@supabase/ssr` | `^0.9.0` | Utilitários para SSR com Supabase (cookies, server client) |
| `tailwindcss` | `^4` | Estilização |
| `@tailwindcss/postcss` | `^4` | Plugin PostCSS para Tailwind v4 |
| `babel-plugin-react-compiler` | `1.0.0` | Otimização em tempo de compilação pelo React Compiler |
| `eslint` / `eslint-config-next` | `^9` / `16.2.0` | Linting |

> ⚠️ **shadcn/ui** está planejado na stack (Fase 3 — Refinamento Visual) mas ainda **não instalado**. O projeto usa apenas Tailwind CSS diretamente até essa fase.