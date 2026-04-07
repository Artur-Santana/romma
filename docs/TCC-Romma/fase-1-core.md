# 🏗️ Fase 1 — Core

# Visão Geral

Este roteiro cobre a construção completa do Core do Romma após a conclusão das Sessões 6 e 7 da Fase 0.

**Pré-requisitos:** S6 (Componentes e props) e S7 (Revisão e Checklist de Prontidão) da Fase 0 concluídas.

**Polimento visual:** Tailwind básico funcional. Refinamento para Obsidian Blueprint em fase dedicada posterior.

**Decisão técnica — Geração de Parcelas:** Supabase Edge Function atômica — uma única chamada do front cria o Contrato e todas as Parcelas em uma única transação no servidor, sem risco de estado inconsistente.

---

# Resumo das Sessões

| Sessão | Conteúdo | Conceitos Novos | Estimativa |
| --- | --- | --- | --- |
| F1-S1 | Refino de Edifícios | Consolidação — sem conceitos novos | ~1h |
| F1-S2 | CRUD de Unidades | Selects encadeados, ENUMs no Supabase | ~1.5h |
| F1-S3 | CRUD de Locatários + convite Supabase | `inviteUserByEmail`, tabela `locatarios` | ~2h |
| F1-S4 | CRUD de Contratos | Atualização multi-tabela, status da Unidade | ~2h |
| F1-S5 | Edge Function: Contrato + Parcelas atômico | Supabase Edge Functions, transação, lógica de datas | ~3h |
| F1-S6 | Visualização e marcação de Parcelas | Filtro por FK, renderização condicional complexa | ~1.5h |
| F1-S7 | Encerramento e cancelamento de Contrato | Lógica de negócio encadeada, confirmação destrutiva | ~1h |
| F1-S8 | Revisão geral e testes ponta a ponta | Nenhum | ~1h |

**Total estimado: ~13h**

---

# Detalhamento das Sessões

## F1-S1 — Refino de Edifícios

**Objetivo:** Atualizar a tabela `edificios` no Supabase para incluir `endereco` e refinar o CRUD existente no `dashboard/page.js` para suportar o novo campo.

**Entregavel:** Formulário de criação e edição de Edifícios com campos `nome` e `endereco`. Listagem exibindo ambos.

**Tarefas:**

- [x]  Adicionar coluna `endereco TEXT` na tabela `edificios` via SQL Editor do Supabase
- [x]  Atualizar o formulário de criação para incluir input de endereço
- [x]  Atualizar a edição inline para incluir o campo `endereco`
- [x]  Atualizar a listagem para exibir endereço abaixo do nome
- [x]  Commit das alterações

**Conceitos revisados:** `useState`, `useEffect`, `.update()`, inputs controlados

**Sem conceitos novos — sessão de aquecimento e consolidação.**

---

## F1-S2 — CRUD de Unidades

**Objetivo:** Criar a página de gestão de Unidades com listagem filtrada por Edifício e CRUD completo.

**Entregavel:** Página `/dashboard/unidades` com listagem de Unidades agrupada por Edifício, formulário de criação com todos os campos do modelo, edição inline e deleção.

**Tarefas:**

- [x]  Criar tabela `unidades` no Supabase com todos os campos do modelo de dados
- [x]  Configurar RLS policies (SELECT público, INSERT/UPDATE/DELETE authenticated)
- [x]  Criar rota `/dashboard/unidades/page.js`
- [x]  Implementar select de Edifício para filtrar a listagem de Unidades
- [x]  Implementar CRUD completo da Unidade
- [x]  Commit das alterações

**Conceitos novos:**

- Selects encadeados: buscar Edifícios para popular um `<select>` e usar o valor selecionado como filtro
- ENUMs no Supabase: como declarar e usar `status` como ENUM (`disponivel`, `alugada`) e `valor_visivel` como BOOLEAN

---

## F1-S3 — CRUD de Locatários + Convite Supabase

**Objetivo:** Criar a gestão de Locatários com o fluxo de convite por email nativo do Supabase.

**Entregavel:** Página `/dashboard/locatarios` com listagem, formulário de cadastro (dados do Locatário + email para convite) e deleção. Ao criar, o Supabase envia automaticamente o email mágico para o Locatário definir sua senha.

**Tarefas:**

- [x]  Criar tabela `locatarios` no Supabase com todos os campos do modelo de dados
- [x]  Configurar RLS policies
- [x]  Criar rota `/dashboard/locatarios/page.js`
- [x]  Implementar formulário de cadastro com campos: `nome_razao_social`, `tipo` (PF/PJ), `documento`, `email`, `telefone`
- [x]  Integrar `supabase.auth.admin.inviteUserByEmail()` para enviar convite ao criar Locatário
- [x]  Implementar listagem e deleção
- [x]  Commit das alterações

**Conceitos novos:**

- `supabase.auth.admin.inviteUserByEmail()`: chamada que envia email mágico e cria o usuário no Auth
- Relação entre `locatarios.usuario_id` e o `id` gerado pelo Supabase Auth no convite
- ENUM `tipo` (PF/PJ) renderizado como `<select>` no formulário

---

## F1-S4 — CRUD de Contratos

**Objetivo:** Criar a gestão de Contratos vinculando Locatário a Unidade, com atualização automática do status da Unidade.

**Entregavel:** Página `/dashboard/contratos` com listagem, formulário de criação (selects de Unidade disponível e Locatário), e opções de encerramento/cancelamento. Ao criar um Contrato, a Unidade passa automaticamente para `alugada`. *(A geração de Parcelas é feita na S5 via Edge Function — nesta sessão o Contrato é criado sem parcelas ainda.)*

**Tarefas:**

- [x]  Criar tabela `contratos` no Supabase com todos os campos do modelo de dados
- [x]  Configurar RLS policies
- [x]  Criar rota `/dashboard/contratos/page.js`
- [x]  Implementar selects encadeados: Edifício → Unidades `disponivel` → Locatários
- [x]  Ao criar Contrato: `.insert()` no contrato + `.update()` do status da Unidade para `alugada`
- [x]  Implementar listagem de contratos ativos
- [x]  Commit das alterações

**Conceitos novos:**

- Atualização multi-tabela sequencial: criar um registro e atualizar outro em sequência no front
- Filtro de Unidades por status (`disponivel`) nos selects

---

## F1-S5 — Edge Function: Geração Atômica de Parcelas ✅

**Objetivo:** Criar a tabela `parcelas`, implementar a Edge Function `gerar-parcelas` que recebe um `contrato_id` e gera todas as parcelas atomicamente, e integrá-la ao frontend após a criação do contrato.

**Entregavel:** Tabela `parcelas` criada com RLS. Edge Function `gerar-parcelas` deployada no Supabase Cloud. Frontend chama a função via `fetch` após inserir o contrato, passando o `contrato_id` retornado pelo insert.

**Tarefas:**

- [x]  Criar tabela `parcelas` no Supabase com todos os campos do modelo de dados
- [x]  Configurar RLS policies da tabela `parcelas` (SELECT/INSERT/UPDATE/DELETE authenticated)
- [x]  Instalar Supabase CLI no WSL via pacote `.deb` (npm global não é suportado)
- [x]  Fazer login no CLI com `supabase login` e linkar projeto com `supabase link`
- [x]  Criar Edge Function `gerar-parcelas` com `supabase functions new`
- [x]  Implementar lógica da função: recebe `contrato_id`, busca `data_inicio` e `data_fim`, gera parcelas com regras de data (parcela 1 com lógica de mês, parcelas 2+ no dia 1 de cada mês), insere tudo atomicamente
- [x]  Adicionar headers CORS à Edge Function para aceitar chamadas do frontend
- [x]  Fazer deploy com `supabase functions deploy gerar-parcelas`
- [x]  Atualizar `insertContrato` no frontend: capturar `id` do contrato criado via `.select().single()`, chamar Edge Function via `fetch` com JWT legado
- [x]  Testar: criar um Contrato e verificar que as Parcelas foram geradas corretamente
- [x]  Commit das alterações

**Conceitos novos:**

- Supabase Edge Functions: o que são, como criar, como fazer deploy via CLI
- Deno (runtime das Edge Functions): diferenças práticas em relação ao Node.js
- `fetch` com `method: POST`, `headers` e `body: JSON.stringify()` para chamar APIs externas
- `.insert().select().single()` para capturar o registro criado após insert
- Headers CORS em Edge Functions (preflight OPTIONS + `Access-Control-Allow-Origin`)
- JWT legado do Supabase (`eyJ...`) necessário quando o projeto usa o novo formato `sb_publishable_`
- Lógica de geração de datas das Parcelas: parcela 1 empurrada para o mês seguinte quando vencimento cairia em mês diferente

**Decisão técnica registrada nesta sessão:** A Edge Function recebe apenas o `contrato_id` (não os dados do contrato). O insert do contrato e o update do status da unidade continuam sendo feitos no frontend — a Edge Function é responsável exclusivamente pela geração das parcelas.

**Nota de implementação:** A chamada à Edge Function foi feita via `supabaseJWT.functions.invoke('gerar-parcelas', { body: { contrato_id }, headers: { Authorization: 'Bearer ' + NEXT_PUBLIC_SUPABASE_JWT } })` — a API idiomática do SDK Supabase, preferida em relação ao `fetch` manual.

> ⚠️ Sessão mais complexa da Fase 1. Incluiu instalação de CLI, debugging de CORS, e descoberta do formato de token JWT legado necessário para autenticação da Edge Function.
> 

---

## F1-S6 — Visualização e Marcação de Parcelas ✅

**Objetivo:** Exibir as Parcelas de um Contrato e permitir que o Proprietário marque parcelas como pagas.

**Entregavel:** Dentro da página de Contratos (ou subpágina `/dashboard/contratos/[id]`), listagem de Parcelas do contrato selecionado com status visual e botão "Marcar como paga" para parcelas `pendente` ou `vencida`.

**Tarefas:**

- [x]  Implementar busca de Parcelas por `contrato_id`
- [x]  Renderizar listagem com status visual diferenciado por cor/badge (futura, pendente, paga, vencida)
- [x]  Implementar botão "Marcar como paga": atualiza `status` para `paga` e preenche `data_pagamento` com a data atual
- [x]  Aplicar regra de visibilidade: parcelas `futura` exibem data de fechamento mas não têm botão de ação
- [x]  Dashboard de métricas no `dashboard/page.js` (unidades disponíveis/alugadas, contratos ativos, parcelas pendentes/vencidas)
- [x]  `countRegistros(tabela, coluna, valor)` — função parametrizada DRY para contagens
- [x]  Commit das alterações

**Conceitos novos:**

- Rota dinâmica com `[id]` no App Router (se optar por subpágina)
- Renderização condicional baseada em múltiplos valores de ENUM
- `new Date().toISOString()` para preencher `data_pagamento`
- Funções parametrizadas DRY — `countRegistros` em vez de 5 funções quase idênticas

---

## F1-S7 — Encerramento e Cancelamento de Contrato

**Objetivo:** Implementar as ações de encerrar e cancelar um Contrato, revertendo o status da Unidade para `disponivel`.

**Entregavel:** Botões de "Encerrar" e "Cancelar" na listagem de Contratos, com diálogo de confirmação antes da ação. Ao confirmar, o Contrato muda de status e a Unidade volta para `disponivel`.

**Tarefas:**

- [ ]  Implementar botão "Encerrar contrato" com confirmação nativa (`window.confirm` ou estado de confirmação inline)
- [ ]  Ao confirmar encerramento: `.update()` do Contrato para `encerrado` + `.update()` da Unidade para `disponivel`
- [ ]  Repetir para "Cancelar contrato" (status `cancelado`)
- [ ]  Parcelas `futura` do contrato encerrado/cancelado: atualizar para `cancelada` (se quiser implementar — decisão a tomar na sessão)
- [ ]  Commit das alterações

**Conceitos novos:**

- Confirmação de ação destrutiva (padrão de UX)
- Lógica de negócio encadeada: uma ação do usuário dispara atualizações em múltiplas tabelas

---

## F1-S8 — Revisão Geral e Testes Ponta a Ponta

**Objetivo:** Testar o fluxo completo do sistema, corrigir inconsistências e garantir que o Core está funcional antes de avançar para as próximas fases.

**Entregavel:** Sistema com fluxo validado: Edifício → Unidade → Locatário convidado → Contrato criado → Parcelas geradas → Parcela marcada como paga → Contrato encerrado → Unidade disponível novamente.

**Tarefas:**

- [ ]  Executar o fluxo completo manualmente do zero
- [ ]  Verificar RLS policies em todas as tabelas
- [ ]  Identificar e corrigir bugs encontrados
- [ ]  Atualizar Notion com sessões concluídas e observações
- [ ]  Commit final de revisão

---

# Decisões Técnicas Registradas

**Geração de Parcelas via Edge Function atômica:** Escolhida sobre JS no front para garantir integridade dos dados (sem risco de Contrato criado sem Parcelas). Adiciona curva de aprendizado da Supabase CLI e do runtime Deno, considerada investimento válido para o aprendizado.

**Polimento visual intencional mente básico:** Tailwind funcional nesta fase. O design Obsidian Blueprint será aplicado em fase de refinamento dedicada após a conclusão do Core e das fases seguintes.

**Locatários via convite Supabase:** Fluxo nativo mantido conforme Modelo de Dados. O Proprietário cadastra os dados e o Supabase envia o email mágico automaticamente.

[🔄 Contexto de Sessão — Romma](%F0%9F%8F%97%EF%B8%8F%20Fase%201%20%E2%80%94%20Core/%F0%9F%94%84%20Contexto%20de%20Sess%C3%A3o%20%E2%80%94%20Romma%203312b68481e181719fffcbcfb0142d05.md)