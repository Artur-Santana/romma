# 🌐 Fase 2 — Público + Realtime + Dashboard

# Visão Geral

Esta fase cobre as interfaces públicas do Romma e o painel administrativo do Proprietário. É construída sobre a Fase 1 (Core) já completo.

**Pré-requisitos:** Fase 1 concluída com o ciclo completo Edifício → Unidade → Locatário → Contrato → Parcelas funcionando.

**Polimento visual:** Tailwind básico funcional. Refinamento Obsidian Blueprint na Fase 3.

**Decisão técnica — Landing Page:** Rota estática dentro do Next.js (`/app/page.js`), sem chamadas ao Supabase. HTML/CSS com Tailwind, construída de forma autônoma pelo estudante (experiência prévia em HTML/CSS).

**Decisão técnica — Realtime:** Supabase Realtime via `supabase.channel().on('postgres_changes', ...)`. A listagem pública escuta alterações na tabela `unidades` e remove em tempo real as unidades que passam para status `alugada`.

---

# Resumo das Sessões

| Sessão | Conteúdo | Conceitos Novos | Estimativa |
| --- | --- | --- | --- |
| F2-S0 ✅ | Landing Page estática (`/app/page.js`) | Nenhum — autônomo | ~5-6h |
| F2-S1 ✅ | Listagem pública de Unidades (`/unidades`) | Server Component público, filtro por status | ~1h |
| F2-S2 | Realtime na listagem pública | Supabase Realtime, websockets, channels | ~2h |
| F2-S3 | Dashboard do Proprietário | Queries agregadas, cards de resumo | ~2h |
| F2-S3.5 | Correções críticas de segurança e bugs | `import 'server-only'`, Server Actions, destructuring | ~3h |
| F2-S4 | Revisão, testes e limpeza de código morto | Nenhum — consolidação | ~1.5h |

**Total sessões guiadas: ~9.5h. LP autônoma: ~5-6h (paralela).**

---

# Detalhamento das Sessões

## F2-S0 — Landing Page Estática (autônomo) ✅

**Objetivo:** Construir a Landing Page pública do Romma como rota principal (`/app/page.js`) sem chamadas ao Supabase.

**Status: Concluído.**

**Entregue em `/app/page.js`:**
- Hero section com imagem de fundo (`Detalhe_Arquitetonico.png`), headline em dois tons e dois CTAs ("INICIE GRATUITAMENTE" / "VER PROJETOS")
- Seção de visão geral do sistema com 4 cards (SISTEMA.01 Listagem de Unidades, SISTEMA.02 Contratos Automatizados, SISTEMA.03 Portal do Locatário, SISTEMA.04 Painel do Proprietário) e botão de acesso a analytics
- Seção de dashboard preview com gráfico de demanda regional, cards de taxa de vacância e cap rate, e gráfico de previsão de fluxo de caixa 2026 (Abril–Julho)
- Footer completo com links de navegação (Plataforma, Suporte, Acesso), copyright e links de Privacidade/Termos
- Responsividade completa: breakpoints `sm`, `md`, `lg`, `xl` em todas as seções
- Zero chamadas ao Supabase — 100% estático, sem autenticação

**Construída de forma autônoma** — o estudante tem experiência sólida em HTML/CSS e não precisa de sessão guiada para esta entrega.

---

## F2-S1 — Listagem Pública de Unidades ✅

**Objetivo:** Criar a página pública `/unidades` que exibe todas as Unidades com `status = disponivel`, sem autenticação.

**Entregavel:** Página `/unidades` com listagem de unidades disponíveis, exibindo nome, edifício, área, valor (ou "Consulte o Proprietário" se `valor_visivel = false`) e status. Sem botões de ação — apenas visualização.

**Status: Concluído.**

**Entregue em `/app/unidades/page.js`:**
- Server Component assíncrono, sem `"use client"`
- Busca via `getUnidadesDisponiveis()` em `src/lib/queries-server.js` — query com colunas explícitas + join `edificios(nome)`, filtro `status = disponivel`
- Componente `UnidadeCardPublico` para renderização individual de cada unidade
- Grid responsivo: 1 coluna (mobile) → 2 (`md`) → 3 (`lg`)
- Estado vazio tratado: mensagem "Nenhuma unidade disponível no momento"
- `Header` e `Footer` reutilizados

**Tarefas:**

- [x]  Criar rota `/app/unidades/page.js` como Server Component (sem `"use client"`)
- [x]  Buscar unidades com `select('id, nome, area_m2, valor_mensal, valor_visivel, edificios(nome)').eq('status', 'disponivel')`
- [x]  Renderizar listagem com renderização condicional do valor (`valor_visivel`) via `UnidadeCardPublico`
- [x]  Confirmar que a RLS policy de SELECT público da tabela `unidades` está ativa
- [x]  Commit das alterações

**Conceitos novos:**

- Join implícito no Supabase: `select('*, edificios(nome)')` para trazer o nome do edifício junto
- Server Component sem autenticação: busca direta sem verificar sessão

---

## F2-S2 — Realtime na Listagem Pública

**Objetivo:** Fazer a listagem de unidades atualizar automaticamente quando uma unidade mudar de status, sem o usuário precisar recarregar a página.

**Entregavel:** A página `/unidades` escuta alterações em tempo real na tabela `unidades` via Supabase Realtime. Quando uma unidade passa para `alugada`, ela desaparece da listagem instantaneamente.

**Tarefas:**

- [ ]  Converter `/app/unidades/page.js` de Server Component para Client Component (`"use client"`)
- [ ]  Migrar o fetch inicial para `useEffect` com `useState` para a lista
- [ ]  Configurar subscription Realtime: `supabase.channel('unidades').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'unidades' }, callback)`
- [ ]  No callback: filtrar a lista local removendo unidades que mudaram para `alugada`
- [ ]  Fazer cleanup da subscription no return do `useEffect`
- [ ]  Habilitar Realtime na tabela `unidades` no dashboard do Supabase (requisição necessária)
- [ ]  Testar: criar um Contrato no dashboard e observar a unidade sumir da listagem pública
- [ ]  Commit das alterações

**Conceitos novos:**

- Supabase Realtime: o que é, como funciona (websockets gerenciados)
- `supabase.channel().on('postgres_changes', ...).subscribe()`
- Cleanup de subscriptions com `supabase.removeChannel()`
- Por que Server Component vira Client Component quando precisa de estado reativo

> ⚠️ Esta sessão introduz um paradigma novo (dados em tempo real) que exige atenção especial ao cleanup para evitar memory leaks.
> 

---

## F2-S3 — Dashboard do Proprietário

**Objetivo:** Criar uma tela de visão geral no dashboard com métricas resumidas do sistema para o Proprietário.

**Entregavel:** Página `/dashboard` (ou seção da página existente) com cards exibindo: total de edifícios, total de unidades (alugadas vs disponíveis), total de contratos ativos, parcelas vencidas pendentes e parcelas pagas no mês.

**Tarefas:**

- [x]  Definir quais métricas exibir (ajustável na sessão conforme o tempo)
- [x]  Implementar queries agregadas: `select('id', { count: 'exact' })` para contagens
- [x]  Implementar filtros por status nas queries (ex: parcelas com `status = vencida`)
- [x]  Renderizar cards de resumo com os valores
- [x]  Commit das alterações

**Conceitos novos:**

- Queries de contagem no Supabase: `select('*', { count: 'exact', head: true })`
- Composição de múltiplas queries assíncronas em paralelo com `Promise.all()`

---

## F2-S3.5 — Correções Críticas de Segurança e Bugs

**Objetivo:** Corrigir vulnerabilidades de segurança e bugs silenciosos identificados na revisão de código (`code-review.md`). Estes itens bloqueiam o deploy em produção.

**Entregavel:** Todas as importações server-only protegidas, JWT removido do bundle do browser, Edge Function com verificação de autenticação, bugs de destructuring corrigidos, diretivas `"use client"` presentes em todos os Client Components.

**Tarefas:**

**Segurança — JWT exposto no client (CRÍTICO):**
- [ ]  Criar Server Action `src/actions/contratos.js` que importa `supabaseJWT` e faz a chamada `fetch()` para a Edge Function `gerar-parcelas`
- [ ]  Remover import de `supabaseJWT` de `src/components/features/Contratos.js` e substituir pela chamada à Server Action
- [ ]  Renomear variável de ambiente `NEXT_PUBLIC_SUPABASE_JWT` para `SUPABASE_JWT` (remover prefixo `NEXT_PUBLIC_`)
- [ ]  Atualizar `.env.local` e `CLAUDE.md` com o novo nome da variável

**Segurança — Guards server-only (ALTO):**
- [ ]  Instalar pacote `server-only`: `npm install server-only`
- [ ]  Adicionar `import 'server-only'` no topo de `src/lib/supabaseAdmin.js`
- [ ]  Adicionar `import 'server-only'` no topo de `src/lib/supabaseJWT.js`
- [ ]  Corrigir `process.env.SUPABASE_URL` em `supabaseAdmin.js` para `process.env.NEXT_PUBLIC_SUPABASE_URL` (ou documentar variável separada)

**Segurança — Edge Function sem autenticação (ALTO):**
- [ ]  Adicionar verificação do JWT no header `Authorization` em `supabase/functions/gerar-parcelas/index.ts`
- [ ]  Retornar 401 se o token for inválido ou ausente

**Diretivas `"use client"` ausentes (CRÍTICO — build quebra sem isso):**
- [ ]  Adicionar `"use client";` como primeira linha de `src/components/features/GestaoEdificios.js`
- [ ]  Adicionar `"use client";` como primeira linha de `src/components/features/Unidades.js`
- [ ]  Adicionar `"use client";` como primeira linha de `src/components/features/Locatarios.js`
- [ ]  Adicionar `"use client";` como primeira linha de `src/components/features/Contratos.js`

**Bugs de destructuring — erros silenciados (ALTO):**
- [ ]  Corrigir `const { errorUpdateUnidade }` para `const { error: errorUpdateUnidade }` em `src/components/features/Contratos.js` (linha ~54)
- [ ]  Corrigir `const { errorInsert }` para `const { error: errorInsert }` em `src/actions/locatarios.js` (linha ~8)

**Validação:**
- [ ]  Testar: criar Contrato e verificar que parcelas são geradas corretamente via Server Action
- [ ]  Testar: forçar falha no insert de unidade e verificar que o erro é capturado (não silenciado)
- [ ]  Testar: convidar Locatário com dados inválidos e verificar que falhas de insert retornam erro 500
- [ ]  Commit das alterações

**Conceitos novos:**

- `import 'server-only'`: guard de build-time que causa erro se o módulo for importado em um Client Component — converte bug silencioso de runtime em erro explícito de build
- Server Actions para operações privilegiadas: mover lógica que usa chaves sensíveis do client para `src/actions/`, mantendo segredos fora do bundle JavaScript
- Destructuring com alias em JS: `const { error: errorInsert }` extrai a propriedade `error` e renomeia para `errorInsert`. Sem o `: errorInsert`, o JS busca uma propriedade literalmente chamada `errorInsert` (que não existe no retorno do Supabase)

> ⚠️ Esta sessão é **bloqueante para o deploy em produção** (F3-S1). Sem estas correções, o JWT fica exposto no browser, módulos server-only podem vazar para o client, e erros do Supabase são silenciosamente ignorados.

---

## F2-S4 — Revisão e Testes

**Objetivo:** Validar o fluxo público e administrativo da Fase 2 ponta a ponta.

**Entregavel:** LP acessível em `/`, listagem pública em `/unidades` com Realtime funcionando, Dashboard com métricas corretas.

**Tarefas:**

- [ ]  Testar fluxo completo: abrir `/unidades` em uma aba, criar Contrato no dashboard em outra, observar unidade desaparecer em tempo real
- [ ]  Verificar que `/unidades` é acessível sem login
- [ ]  Verificar que o Dashboard só é acessível com login
- [ ]  Corrigir bugs encontrados

**Limpeza de código morto (identificado na revisão de código):**
- [ ]  Remover `src/app/login/guia.js` e `src/app/dashboard/guia.js` (duplicatas de `page.js`, nunca importadas)
- [ ]  Remover `src/components/ShinyText.jsx` (export morto, nunca importado em nenhum arquivo)
- [ ]  Remover `src/lib/supabase-browser.js` e `src/lib/supabase-server.js` (nunca importados)
- [ ]  Remover `src/components/ui/button.jsx` (scaffold shadcn/ui nunca utilizado)
- [ ]  Remover dependência `@remixicon/react` do `package.json` (nunca importada em `src/`)
- [ ]  Remover dependência `motion` do `package.json` (usada apenas pelo ShinyText removido)
- [ ]  Mover `shadcn` de `dependencies` para `devDependencies` no `package.json` (é ferramenta CLI, não runtime)
- [ ]  Atualizar `CLAUDE.md` removendo referências aos arquivos deletados da seção Project Structure

- [ ]  Atualizar Notion com sessões concluídas
- [ ]  Commit final de revisão

---

# Decisões Técnicas Registradas

**Landing Page estática em `/app/page.js`:** Rota raiz do Next.js, sem chamadas ao Supabase. Construída de forma autônoma pelo estudante (experiência prévia em HTML/CSS + Tailwind).

**Realtime via Supabase Channels:** Escolhido sobre polling por ser a abordagem nativa do Supabase e um diferencial técnico válido para a monografia. A listagem pública vira Client Component para suportar o estado reativo.

**Refinamento visual postergado para Fase 3:** O polimento completo Obsidian Blueprint não entra nesta fase para manter o foco na entrega funcional dentro do prazo.

**Sessão F2-S3.5 inserida após revisão de código:** 55 findings identificados em auditoria automatizada (`code-review.md`). Itens críticos (JWT exposto, `"use client"` ausente) e de alta severidade (destructuring bugs, Edge Function sem auth) bloqueiam o deploy e foram agrupados em uma sessão dedicada antes de F2-S4. Itens médios e baixos distribuídos nas sessões F2-S4, F3-S1, F3-S3, F3-S4 e Melhorias Futuras.