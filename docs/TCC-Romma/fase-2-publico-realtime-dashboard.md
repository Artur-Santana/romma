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
| F2-S0 | Landing Page estática (`/app/page.js`) | Nenhum — autônomo | ~5-6h |
| F2-S1 | Listagem pública de Unidades (`/unidades`) | Server Component público, filtro por status | ~1h |
| F2-S2 | Realtime na listagem pública | Supabase Realtime, websockets, channels | ~2h |
| F2-S3 | Dashboard do Proprietário | Queries agregadas, cards de resumo | ~2h |
| F2-S4 | Revisão e testes | Nenhum | ~1h |

**Total sessões guiadas: ~6h. LP autônoma: ~5-6h (paralela).**

---

# Detalhamento das Sessões

## F2-S0 — Landing Page Estática (autônomo)

**Objetivo:** Construir a Landing Page pública do Romma como rota principal (`/app/page.js`) sem chamadas ao Supabase.

**Entregavel:** Página `/` completamente estática com hero section, descrição do produto e CTA apontando para `/unidades`. Sem autenticação, sem dados dinâmicos.

**Construída de forma autônoma** — o estudante tem experiência sólida em HTML/CSS e não precisa de sessão guiada para esta entrega. Usar Tailwind para estilização.

> ⚠️ Atenção: `/app/page.js` atualmente redireciona para `/login` ou é o dashboard. Verificar o que está na rota raiz antes de começar e ajustar o roteamento conforme necessário.
> 

---

## F2-S1 — Listagem Pública de Unidades

**Objetivo:** Criar a página pública `/unidades` que exibe todas as Unidades com `status = disponivel`, sem autenticação.

**Entregavel:** Página `/unidades` com listagem de unidades disponíveis, exibindo nome, edifício, área, valor (ou "Consulte o Proprietário" se `valor_visivel = false`) e status. Sem botões de ação — apenas visualização.

**Tarefas:**

- [ ]  Criar rota `/app/unidades/page.js` como Server Component (sem `"use client"`)
- [ ]  Buscar unidades com `select('*, edificios(nome)').eq('status', 'disponivel')`
- [ ]  Renderizar listagem com renderização condicional do valor (`valor_visivel`)
- [ ]  Confirmar que a RLS policy de SELECT público da tabela `unidades` está ativa
- [ ]  Commit das alterações

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

## F2-S4 — Revisão e Testes

**Objetivo:** Validar o fluxo público e administrativo da Fase 2 ponta a ponta.

**Entregavel:** LP acessível em `/`, listagem pública em `/unidades` com Realtime funcionando, Dashboard com métricas corretas.

**Tarefas:**

- [ ]  Testar fluxo completo: abrir `/unidades` em uma aba, criar Contrato no dashboard em outra, observar unidade desaparecer em tempo real
- [ ]  Verificar que `/unidades` é acessível sem login
- [ ]  Verificar que o Dashboard só é acessível com login
- [ ]  Corrigir bugs encontrados
- [ ]  Atualizar Notion com sessões concluídas
- [ ]  Commit final de revisão

---

# Decisões Técnicas Registradas

**Landing Page estática em `/app/page.js`:** Rota raiz do Next.js, sem chamadas ao Supabase. Construída de forma autônoma pelo estudante (experiência prévia em HTML/CSS + Tailwind).

**Realtime via Supabase Channels:** Escolhido sobre polling por ser a abordagem nativa do Supabase e um diferencial técnico válido para a monografia. A listagem pública vira Client Component para suportar o estado reativo.

**Refinamento visual postergado para Fase 3:** O polimento completo Obsidian Blueprint não entra nesta fase para manter o foco na entrega funcional dentro do prazo.