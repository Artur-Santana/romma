# CLAUDE.md — Romma

**Romma** = sistema de aluguel corporativo (TCC). Proprietário ↔ Locatário. Ciclo: listagem pública de Unidades → Contratos → Parcelas.

---

## Stack

Next.js 16 App Router (JS, sem TS) · Tailwind v4 · shadcn/ui · Supabase (Postgres + Auth + RLS + Edge Functions Deno) · Turbopack · Vercel

> **Next.js 16** quebra muitas convenções de versões anteriores — não use conhecimento de versões anteriores.

---

## Terminologia (nunca use sinônimos)

| Conceito | Termo |
|---|---|
| Dono do espaço | **Proprietário** (único por instância) |
| Inquilino | **Locatário** |
| Prédio | **Edifício** |
| Espaço alugável | **Unidade** |
| Contrato de locação | **Contrato** |
| Pagamento mensal | **Parcela** |

---

## Schema (colunas id/created_at implícitas em todas tabelas)

**edificios:** `nome`, `endereco`

**unidades:** `edificio_id` (FK), `nome`, `descricao`, `area_m2`, `valor_mensal`, `valor_visivel` (BOOLEAN — false → exibir "Consulte o Proprietário"), `status` ENUM(`disponivel`, `alugada`)

**locatarios:** `usuario_id` (FK Auth), `nome_razao_social`, `tipo` ENUM(`pf`,`pj`), `documento` (CPF/CNPJ só dígitos), `email`, `telefone`

**contratos:** `unidade_id` (FK), `locatario_id` (FK), `data_inicio`, `data_fim`, `status` ENUM(`ativo`,`encerrado`,`cancelado`), `observacoes`
- Constraint: no máx 1 contrato `ativo` por `unidade_id` (partial unique index)

**parcelas:** `contrato_id` (FK), `numero` (INT sequencial), `data_fechamento`, `data_vencimento` (fechamento+7d), `data_pagamento` (nullable), `status` ENUM(`futura`,`pendente`,`paga`,`vencida`)

---

## Regras de Negócio

**Status Unidade:** `alugada` ao criar contrato `ativo`; volta `disponivel` ao encerrar/cancelar. Ambas transições no frontend.

**Geração de Parcelas** (via Edge Function `gerar-parcelas`, atômica):
- Parcela 1: se `data_inicio + 7d` mesmo mês → `fechamento = data_inicio`, `vencimento = +7d`. Se mês diferente → `fechamento = dia 1 mês seguinte`, `vencimento = +7d`.
- Parcelas 2+: `fechamento = dia 1` de cada mês subsequente. Todas criadas como `futura`.
- Status date-driven: `futura → pendente` quando `fechamento <= hoje`; `pendente → vencida` quando `vencimento < hoje` e não paga.

**Invite Locatário:** `inviteUserByEmail` via Server Action (admin API). Nunca importar `supabaseAdmin` em client components.

**Realtime — limitação conhecida:** `disponivel → alugada` não propaga em tempo real (RLS descarta evento). Card some só no refresh. Reversas/INSERT/DELETE funcionam.

---

## Clientes Supabase

| Arquivo | Chave | Uso |
|---|---|---|
| `lib/supabase.js` | anon | queries client-side gerais |
| `lib/supabase-browser.js` | anon | browser-specific |
| `lib/supabase-server.js` | anon | Server Components / Server Actions |
| `lib/supabaseAdmin.js` | service role | admin/bypass RLS — **server-only** |
| `lib/supabaseJWT.js` | legacy JWT | `functions.invoke()` apenas |

---

## Convenções de Código

- Queries Supabase centralizadas em `src/lib/queries.js` — funções puras, sem hooks/state. Chamadas em `useEffect`.
- Form state: objeto único, não `useState` por campo.
- Reset de form: função nomeada, não inline.
- RLS: políticas por operação (SELECT/INSERT/UPDATE/DELETE). Falta de uma → 403 só nessa op.
- Server Actions em `src/actions/`. Retornam `{ status: 200 }` ou `{ status: 500, erroMessage: '...' }`.
- Commits via extensão `vivaxy.vscode-conventional-commits` (type, scope, gitmoji, descrição).

---

## Edge Function: `gerar-parcelas`

`supabase/functions/gerar-parcelas/index.ts` · Deno · POST `{ contrato_id }` · Auth: legacy JWT via header · chamada com `supabaseJWT` client · CORS completo.

---

## Env Vars

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_JWT=        # server-only, Edge Functions
SUPABASE_ROLE_KEY=   # server-only, admin
```

**Supabase Project:** `vfymttcajeyhrmsyhrtj` · `https://vfymttcajeyhrmsyhrtj.supabase.co`
