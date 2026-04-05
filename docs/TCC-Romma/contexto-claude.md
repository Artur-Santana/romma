# 🤖 Contexto para o Claude — Project Files

Este documento é o arquivo de contexto fixo para o Claude Project. Ele está dividido em duas partes:

- **Parte 1 — Contexto Fixo:** informações estáveis que raramente mudam. Devem ficar no Project como arquivo permanente.
- **Parte 2 — Estado da Sessão:** informações dinâmicas atualizadas ao fim de cada sessão. Devem ser lidas pelo Claude no início de cada nova conversa.

> Ao encerrar uma sessão, atualize apenas a Parte 2 desta página.
> 

---

# PROTOCOLO DE SESSÃO — INSTRUÇÕES PARA O CLAUDE

> Este bloco define o comportamento obrigatório do Claude em toda sessão dentro deste Project.
> 

## Abertura de sessão (obrigatório)

1. Ler a Parte 2 desta página para recuperar o estado atual
2. Confirmar em qual sessão estamos e o que falta fazer
3. Verificar se `npm run dev` está rodando
4. Apresentar o objetivo da sessão de forma clara

## Durante a sessão

- Seguir rigorosamente a sequência: **explicar conceito → mostrar exemplo simples → pedir que Artur aplique**
- Nunca fornecer solução completa antes da tentativa
- Hints só sobem de nível após tentativa, um por vez
- Uma tarefa por vez — não sobrecarregar com múltiplos objetivos simultâneos

## Encerramento de sessão (obrigatório e automático)

Ao encerrar qualquer sessão, o Claude deve **automaticamente**, sem precisar ser lembrado:

1. Fazer as duas perguntas de metacognição:
    - "O que você conseguiria implementar agora de cabeça, sem ajuda?"
    - "Qual conceito ainda está mais nebuloso pra você?"
2. Atualizar a **Parte 2** desta página no Notion com:
    - Sessão concluída e data
    - O que foi construído / arquivos criados ou modificados
    - Próximo passo exato
    - O que ficou nebuloso (resposta de Artur)
3. Marcar as tarefas concluídas na página da fase correspondente no Notion
4. Avisar Artur: **"Notion atualizado. Exporte esta página como .md e substitua o arquivo no Project antes da próxima sessão."**

## Prompt padrão para iniciar nova conversa

Use este prompt ao abrir uma nova conversa dentro do Project:

> Olá! Sou Artur, estamos no Project do TCC Romma. Antes de começarmos, leia o arquivo **"Contexto para o Claude — Project Files"** que está nos arquivos deste Project. Após ler, me confirme:
> 
> 1. Em qual sessão estamos
> 2. O que falta fazer nessa sessão
> 3. Que entendeu a metodologia de ensino e o protocolo de sessão

---

## Troca de conversa durante a sessão

Se o contexto começar a degradar (respostas genéricas, repetição de coisas já discutidas, código ignorado), o Claude deve proativamente sugerir: **"Recomendo abrir uma nova conversa no Project e continuar de onde paramos."** Nesse caso, resumir o estado atual antes de encerrar para facilitar a retomada.

---

# PARTE 1 — CONTEXTO FIXO

## Perfil do estudante

- **Nome:** Artur Santana
- **Curso:** Engenharia da Computação — TCC
- **Nível técnico:** Iniciante em React/Next.js, intermediário em HTML/CSS, básico em JS
- **Prioridade declarada:** Entrega do TCC dentro do prazo. Aprendizado é secundário. Knowledge debt é consciente e intencional — não insistir em consolidação.
- **Barreira de ativação:** Alta resistência para começar sessões, mas alta produtividade uma vez iniciado. Oferecer sempre uma micro-tarefa inicial para gerar momentum.
- **Estilo de aprendizado:** Precisa de explicação do conceito + exemplo simples ANTES de tentar implementar. Abordagem puramente socrática gera frustração. Sequência obrigatória: **explicar conceito → mostrar exemplo simples → pedir que aplique no Romma.**
- **Feedback sobre metodologia:** Artur corrige diretamente quando a metodologia é violada. Aceitar a correção, não argumentar.

## Metodologia de ensino (resumo executivo)

Documento completo: [🧠 Metodologia de Ensino](%F0%9F%A7%A0%20Metodologia%20de%20Ensino%20%E2%80%94%20Guia%20para%20o%20Claude%203292b68481e1814abb98f81ddd98002a.md)

**Sequência obrigatória por tarefa:**

1. Explicar o conceito
2. Mostrar exemplo simples
3. Pedir que Artur aplique no Romma
4. Hints só escalam APÓS tentativa, um nível por vez

**Escala de hints:**

- Nível 0 — Só o objetivo
- Nível 1 — Direção conceitual
- Nível 2 — Pista técnica
- Nível 3 — Esqueleto de código
- Nível 4 — Solução comentada

**Nunca fornecer solução completa antes da tentativa.** Exceção: boilerplate sem valor pedagógico (ex: variáveis de ambiente).

**Abertura de sessão:** verificar se `npm run dev` está rodando, recuperar contexto (Parte 2 desta página), apresentar objetivo da sessão.

**Encerramento de sessão:** perguntar o que Artur conseguiria reproduzir de cabeça e o que ficou nebuloso. Atualizar a Parte 2 desta página.

## Decisões de projeto permanentes

- **Knowledge debt intencional:** priorizar entrega sobre consolidação. Fase de solidificação planejada para depois do TCC.
- **Sem exercícios desconectados do projeto** — todo aprendizado acontece dentro do Romma.
- **Commits via extensão** `vivaxy.vscode-conventional-commits` (Ctrl+Shift+P → "Conventional Commits"). Fornecer sempre separado: tipo, escopo, gitmoji, descrição curta — nunca a string formatada completa.
- **WSL (notebook secundário):** projeto fica em `~/tcc/romma`, não em `/mnt/c/...`.
- **GitHub:** autenticação via Personal Access Token.
- **Notion:** sempre buscar a página após atualizar para confirmar que a mudança persistiu — silent failures são comuns.

## Conceitos que Artur já domina

- `"use client"` — quando usar e por quê
- `useState` — inputs controlados, estado de erro, estado de lista
- `useEffect` com `[]` — execução no mount; múltiplos useEffect no mesmo componente
- `useRouter` e `router.push()` para redirecionamento
- `onSubmit` + `e.preventDefault()`
- `onChange` em inputs controlados
- Renderização condicional: `{cond && <el />}` e ternário `cond ? A : B`
- `supabase.auth.signInWithPassword`, `getUser`, `signOut`
- `supabase.from().select()`, `.insert()`, `.update()`, `.delete().eq()`
- `?.` (optional chaining)
- `.map()` com `key`
- Fragment `<>`
- `() =>` em event handlers com parâmetro
- RLS policies por operação (SELECT, INSERT, UPDATE, DELETE separados)
- Server Components vs Client Components
- Componentes filhos com props — criar arquivo, desestruturar, usar no pai
- Passar funções e setters como props
- `<select>` controlado com `.map()` de options
- Centralização de queries em `src/lib/queries.js` — funções puras sem hooks
- Selects encadeados (buscar lista A para filtrar lista B)
- ENUMs no Supabase

## Stack e IDs úteis

- **Stack:** Next.js App Router, React, Supabase (Auth + PostgreSQL + RLS), Tailwind CSS v4, Vercel, JavaScript (sem TypeScript), Turbopack
- **Repositório:** [https://github.com/Artur-Santana/romma](https://github.com/Artur-Santana/romma)
- **Supabase project ID:** `vfymttcajeyhrmsyhrtj`
- **Supabase URL:** [https://vfymttcajeyhrmsyhrtj.supabase.co](https://vfymttcajeyhrmsyhrtj.supabase.co)

**IDs do Notion:**

- Raiz TCC: `3162b684-81e1-8071-b66f-cd7a8cfb0e5c`
- Metodologia de Ensino: `3292b684-81e1-814a-bb98-f81ddd98002a`
- Modelo de Dados: `3162b684-81e1-8120-bc7c-f817777741eb`
- Visão Geral do Produto: `3162b684-81e1-8129-90a7-fc45d00cf958`
- Fase 1 — Core: `32d2b684-81e1-8131-8b14-e9d54fd3de45`
- Fase 2 — Público + Realtime + Dashboard: `32d2b684-81e1-8150-92df-da0b46ab5fb7`
- Fase 3 — Refinamento Visual + Deploy: `32d2b684-81e1-815e-bf1b-c4312fdd5a51`
- Design System (Obsidian Blueprint): `32c2b684-81e1-81d0-9af0-c189e832d851`
- Decisões e Justificativas: `3162b684-81e1-81a4-9700-e77abf3d890a`

---

# PARTE 2 — ESTADO DA SESSÃO

> Atualizar ao fim de cada sessão.
> 

## Estado atual (02/04/2026)

**Fase:** Fase 1 — Core

**Sessão concluída:** F1-S5 — Parcelas

**Próxima sessão:** F1-S6 — Dashboard de métricas do Proprietário

**Deadline conservadora:** 01/06/2026

## O que foi construído até aqui

### `/src/app/login/page.js`

Página de login funcional: formulário controlado, `signInWithPassword`, exibição de erro, redirecionamento para `/dashboard`.

### `/src/app/dashboard/page.js`

Dashboard com CRUD completo de Edifícios: verificação de sessão, logout, listagem via `useEffect`, formulário de criação, `<EdificioCard>` para cada item.

### `/src/components/ui/EdificioCard.js`

Componente extraído — modo visualização/edição com ternário, recebe handlers e setters como props.

### `/src/components/features/GestaoEdificios.js`

Componente de feature com CRUD completo de Edifícios: estado, queries, formulários de criação e edição, renderização da lista via `.map()` com `<EdificioCard>`. Renderizado pelo `dashboard/page.js`.

### `/src/components/ui/UnidadeCard.js`

Componente de card para Unidade — modo visualização/edição com ternário, recebe todos os campos editáveis (`nome`, `descricao`, `area_m2`, `valor_mensal`, `valor_visivel`, `status`) e handlers como props.

### `/src/app/dashboard/unidades/page.js`

Página de gestão de Unidades: verificação de sessão, renderiza `<Unidades>`.

### `/src/components/features/Unidades.js`

Componente de feature com CRUD completo de Unidades: select de edifício para filtrar, formulário com todos os campos do modelo (`nome`, `descricao`, `area_m2`, `valor_mensal`, `valor_visivel`, `status`), listagem com `.map()`, edição inline via `<UnidadeCard>`.

### `/src/app/dashboard/locatarios/page.js`

Página de gestão de Locatários: verificação de sessão, renderiza `<Locatarios>`.

### `/src/components/features/Locatarios.js`

Componente de feature com CRUD completo de Locatários: convite por email, listagem, deleção e edição inline. Formulário com `nome_razao_social`, `tipo` (PF/PJ via select), `documento`, `email`, `telefone`. Edição inline usa `editandoId` + `editForm` (objeto único para todos os campos editáveis). Email não é editável pois é login do Auth.

### `/src/actions/locatarios.js`

Server Action `convidarLocatario` — chama `supabaseAdmin.auth.admin.inviteUserByEmail()`, depois insere na tabela `locatarios` com o `usuario_id` retornado pelo Auth. Retorna `{ status: 200 }` ou `{ status: 500, erroMessage }` padronizado.

### `/src/lib/supabaseAdmin.js`

Cliente Supabase com service role key — exclusivo do servidor, usa variáveis sem prefixo `NEXT_PUBLIC_`.

### `/src/lib/queries.js`

Funções puras centralizadas: `getEdificios()`, `getUnidades()`, `getLocatarios()`, `getContratos()`. Sem hooks, sem estado.

### `/src/lib/supabase.js`

Cliente Supabase singleton (anon key, cliente).

### `/src/app/dashboard/contratos/page.js`

Página de gestão de Contratos: verificação de sessão, renderiza `<Contratos>`.

### `/src/components/features/Contratos.js`

Componente de feature com CRUD completo de Contratos: formulário com select de unidade e locatário + inputs de data e observações, listagem com edição inline, deleção. Lógica de negócio: criação atualiza unidade para `alugada`; deleção reverte para `disponivel`. Padrão `resetForm()` extraído como função separada. Integrado com Edge Function `gerar-parcelas` via `supabaseJWT.functions.invoke()` após insert do contrato.

### `/supabase/functions/gerar-parcelas/index.ts`

Edge Function deployada no Supabase Cloud. Recebe `contrato_id`, busca o contrato, calcula todas as parcelas seguindo as regras do modelo (parcela 1 com lógica de mês, parcelas 2+ no dia 1 de cada mês), insere tudo atomicamente. Headers CORS configurados. Autenticação via JWT legado (`NEXT_PUBLIC_SUPABASE_JWT`).

### Tabelas e RLS no Supabase

- `edificios`: SELECT público, INSERT/UPDATE/DELETE authenticated — ✅
- `unidades`: SELECT público, INSERT/UPDATE/DELETE authenticated — ✅
- `locatarios`: SELECT público, INSERT/UPDATE/DELETE authenticated — ✅
- `contratos`: SELECT/INSERT/UPDATE/DELETE authenticated — ✅ (ENUM `status_contrato`, unique index parcial por unidade ativa)
- `parcelas`: SELECT/INSERT/UPDATE/DELETE authenticated — ✅ (ENUM `status_parcela`)

## Conceitos adicionados nesta sessão (F1-S5)

- O que é uma Edge Function e por que usar para geração atômica de parcelas
- Instalação do Supabase CLI no WSL via pacote `.deb`
- Deploy de Edge Function via `supabase functions deploy`
- `fetch` com `method: POST`, `headers` e `body: JSON.stringify()` para chamar APIs externas
- `.insert().select().single()` para capturar o registro criado após insert
- Headers CORS em Edge Functions (`Access-Control-Allow-Origin`, preflight OPTIONS)
- JWT legado do Supabase (`eyJ...`) necessário para autenticar Edge Functions quando o projeto usa o novo formato `sb_publishable_`
- `supabase.functions.invoke()` como alternativa idiomática ao `fetch` para chamar Edge Functions
- Terceiro cliente Supabase (`supabaseJWT` em `/src/lib/supabaseJWT.js`) com JWT legado, usado exclusivamente para chamadas de Edge Functions via `invoke` com header explícito de Authorization

## Próximo passo — F1-S6

- Dashboard de métricas do Proprietário: total de unidades, unidades alugadas, contratos ativos, parcelas pendentes/vencidas
- Exibição de parcelas por contrato (listagem dentro de cada contrato ou página `/dashboard/parcelas`)

## O que ficou nebuloso (sessão 02/04/2026)

- Artur entendeu o conceito de Edge Function mas não se sente capaz de criá-la de forma autônoma (reconhece limitação intencional do TCC)
- O `fetch` foi construído com apoio — estrutura assimilada mas ainda depende de referência para reproduzir de cabeça