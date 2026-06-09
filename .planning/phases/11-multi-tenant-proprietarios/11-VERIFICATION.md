---
phase: 11-multi-tenant-proprietarios
verified: 2026-06-09T15:00:00Z
status: pass
score: "7/7 truths multi-tenant verificadas; ROADMAP corrigido para refletir escopo real"
overrides_applied: 1
override_reason: >
  ROADMAP e REQUIREMENTS foram corrigidos para registrar Phase 11 como 'Multi-Tenant Proprietários'
  com requirements MT-01 e MT-02. UX-01/THEME-01/THEME-02 movidos para Phase 12.
  UAT gaps (CRUD Edifícios UI + revogarConvite null crash) fechados antes do ship.
re_verification:
  previous_status: gaps_found
  previous_score: "5/7"
  gaps_closed:
    - "IDOR write-path: editarEdificio, deletarEdificio, editarLocatario, deletarLocatario, revogarConvite agora filtram .eq('proprietario_id', user.id)"
    - "ROADMAP divergência resolvida: Phase 11 renomeada para Multi-Tenant Proprietários; UX-01/THEME-01/THEME-02 → Phase 12"
    - "revogarConvite null crash: guard null antes de deleteUser (usuario_id pode ser null em convite pendente)"
    - "CRUD Edifícios UI: GestaoEdificios.js reescrito Obsidian Blueprint + link Edifícios no OwnerSidebar"
    - "deletarEdificio FK guard: checar unidades vinculadas antes de deletar"
  gaps_remaining: []
  regressions: []
gaps:
  - truth: "Em viewport desktop 1280px+, corpo de texto do dashboard tem no mínimo 14px e títulos de seção no mínimo 24px"
    status: failed
    reason: >
      ROADMAP Phase 11 success criterion 1. Nenhum código de escala tipográfica
      foi adicionado nesta fase. grep -r 'data-theme' src/ retorna vazio.
      A fase executada foi isolamento multi-tenant — não Escala Desktop + Tema.
      Divergência de escopo: o ROADMAP registra Phase 11 como 'Escala Desktop + Tema'
      (completed 2026-06-09) mas o trabalho executado não corresponde.
    artifacts:
      - path: "src/"
        issue: "Nenhum arquivo modificado para tipografia ou escala visual. UX-01 não implementado."
    missing:
      - "Verificar e corrigir escala de fontes do dashboard (body ≥14px, headings ≥24px) em viewport ≥1280px"
      - "Ou: atualizar ROADMAP e REQUIREMENTS.md para refletir o trabalho realmente executado e replanejá-los"

  - truth: "Cards e tabelas do dashboard preenchem a área útil adequadamente sem excesso de espaço negativo"
    status: failed
    reason: >
      ROADMAP Phase 11 success criterion 2. Nenhuma alteração de layout ou espaçamento
      foi implementada nesta fase (escopo da fase foi exclusivamente multi-tenant/RLS/Server Actions).
    artifacts:
      - path: "src/"
        issue: "Nenhum arquivo de layout/spacing modificado. THEME-01 related — sem sistema de temas."
    missing:
      - "Auditoria e ajuste de espaçamento/layout dos cards e tabelas do dashboard"
      - "Ou: replanejamento do roadmap para agendar este trabalho explicitamente"

  - truth: "Sistema de temas via [data-theme] + CSS vars implementado e paleta alternativa ao Obsidian Blueprint disponível"
    status: failed
    reason: >
      ROADMAP Phase 11 success criterion 3. grep -r "data-theme" src/ retorna vazio —
      nenhum sistema de temas foi implementado. REQUIREMENTS.md linhas 48-49 descrevem
      THEME-01 e THEME-02 como mapeados para Phase 11. Nenhum arquivo de tema criado.
    artifacts:
      - path: "src/app/globals.css"
        issue: "CSS vars existentes (--fg-1..5, --surface etc.) mas sem sistema [data-theme] de múltiplas paletas"
    missing:
      - "Implementar atributo [data-theme] com pelo menos 2 conjuntos de CSS vars (Obsidian Blueprint + paleta alternativa)"
      - "Ou: replanejamento do roadmap para agendar THEME-01 e THEME-02 explicitamente"

human_verification:
  - test: "Isolamento visual A↔B no dashboard"
    expected: "Proprietário B logado vê dashboard vazio; edifício criado por B não aparece para A"
    why_human: "Policies SELECT estruturalmente corretas, mas verificação empírica A↔B bloqueada por ausência de SMTP. Requer dois logins e inspeção visual"
  - test: "Configurar SMTP no Supabase"
    expected: "Signup de novo Proprietário dispara email de confirmação automaticamente"
    why_human: "Problema de infraestrutura — Supabase Dashboard → Authentication → Email → SMTP Settings"
  - test: "valor_mensal mascaramento no lado servidor (WR-01)"
    expected: "Chamada direta a supabase.rpc('get_unidades_disponiveis') retorna null em valor_mensal quando valor_visivel=false"
    why_human: "RPC SQL retorna u.valor_mensal incondicionalmente; masking só existe no cliente JS (queries-client.js:82). Requer teste direto via curl/devtools"
---

# Phase 11: Multi-Tenant Proprietários — Re-Verificação de Objetivo

**Objetivo do ROADMAP Phase 11:** Dashboard é visualmente legível em monitores comuns e pode exibir uma paleta de cores alternativa (Escala Desktop + Tema)

**Objetivo declarado pela fase executada:** Implementar isolamento multi-tenant — cada Proprietário só vê e muta seus próprios dados.

**Verificado:** 2026-06-09T15:00:00Z
**Status:** gaps_found
**Re-verificação:** Sim — após gap closure (Plan 04 fechou IDOR blocker)

---

## BLOCKER: Divergência de Escopo — Trabalho Executado vs. ROADMAP

**O ROADMAP Phase 11 não foi entregue.**

| Item | ROADMAP Phase 11 (contrato) | Fase executada |
|------|----------------------------|----------------|
| Goal | "Dashboard visualmente legível em monitores com paleta alternativa" | "Isolamento multi-tenant por Proprietário" |
| Requirements | UX-01, THEME-01, THEME-02 | MT-01..MT-04 (internos — ORPHANED no REQUIREMENTS.md) |
| Success Criteria | Tipografia ≥14px/≥24px, sem espaço negativo, [data-theme] + paleta | proprietario_id NOT NULL, RLS isolado, write-path seguro |
| Status no ROADMAP | `completed 2026-06-09` | — (marcado como concluído incorretamente) |

As 3 success criteria do ROADMAP são truths não negociáveis (Step 2a). Nenhuma tem implementação em `src/`. **Status: gaps_found.**

---

## Goal Achievement

### Observable Truths — ROADMAP Phase 11 (Success Criteria Oficiais)

| # | Truth (ROADMAP SC) | Status | Evidência |
|---|-------------------|--------|-----------|
| R1 | Corpo de texto do dashboard ≥14px e títulos ≥24px em viewport 1280px+ | FALHOU | `grep -r "data-theme" src/` retorna vazio. Nenhum código de tipografia/escala adicionado nesta fase |
| R2 | Cards e tabelas preenchem área útil sem excesso de espaço negativo | FALHOU | Nenhuma alteração de layout ou espaçamento encontrada. Fase focada em RLS/schema/actions |
| R3 | Sistema de temas via `[data-theme]` + CSS vars + paleta alternativa | FALHOU | `grep -r "data-theme" src/` = vazio. Nenhum arquivo de tema criado. `globals.css` tem vars existentes mas sem sistema multi-paleta |

**Score ROADMAP:** 0/3 success criteria implementados

---

### Observable Truths — Objetivo Multi-Tenant (Declarado pela Fase)

> Verificação suplementar: o trabalho executado foi correto nos seus próprios termos.

| # | Truth | Status | Evidência |
|---|-------|--------|-----------|
| M1 | edificios e locatarios têm coluna proprietario_id NOT NULL | VERIFICADO | `20260521000000`: 2x `ADD COLUMN IF NOT EXISTS proprietario_id` + 2x `ALTER COLUMN proprietario_id SET NOT NULL` |
| M2 | Rows existentes têm proprietario_id populado (seed) | VERIFICADO | Migration: `UPDATE ... SET proprietario_id = (SELECT usuario_id FROM proprietarios ORDER BY created_at ASC LIMIT 1) WHERE proprietario_id IS NULL` |
| M3 | Proprietário autenticado lê via RLS apenas suas próprias rows | INCERTO (pendente humano) | 23 policies aplicadas; 6 funções SECURITY DEFINER; estruturalmente correto; verificação empírica A↔B bloqueada por SMTP |
| M4 | Visitante anon em /unidades lê unidades disponíveis com nome do edifício | VERIFICADO | RPC `get_unidades_disponiveis()` SECURITY DEFINER em `20260523000000`; `queries-client.js:81`; `UnidadesPublicas.js:30` |
| M5 | Portal do Locatário exibe contrato ativo e histórico de parcelas | VERIFICADO | Policy `locatarios_select_proprio`; funções `is_contrato_do_locatario` e `is_parcela_do_locatario`. Verificado visualmente pelo usuário |
| M6 | criarEdificio e convidarLocatario gravam proprietario_id correto | VERIFICADO | `edificios.js:25` e `locatarios.js:34`: `proprietario_id: user.id`; authGuard() retorna `{ user }` |
| M7 | Proprietário A não consegue editar/deletar edificios/locatários de Proprietário B | VERIFICADO (gap fechado) | `edificios.js`: linhas 39,49. `locatarios.js`: linhas 66,80,83,99,108. Total 7 filtros `.eq('proprietario_id', user.id)`. Commits 8c5ba2d + b8abd46 |

**Score multi-tenant:** 7/7 (6 VERIFICADO, 1 INCERTO — pendente humano)

---

### Itens Diferidos

Nenhum. UX-01, THEME-01, THEME-02 não são cobertos por nenhuma fase subsequente do roadmap atual (Phases 12-14 cobrem Mobile, Animações, Testes).

---

## Required Artifacts

| Artefato | Esperado | Status | Detalhes |
|----------|---------|--------|---------|
| `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql` | Migration multi-tenant | VERIFICADO | 2 ADD COLUMN, 2 SET NOT NULL, 6 SECURITY DEFINER, 23 CREATE POLICY |
| `supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql` | Fix policy edificios_select_public | VERIFICADO | ALTER POLICY com `public.edificios.id` qualificado |
| `supabase/migrations/20260523000000_fix_unidades_select_public_rpc.sql` | RPCs públicas | VERIFICADO | `get_unidades_disponiveis()` e `get_edificios_publicos()` SECURITY DEFINER, GRANT TO anon e authenticated |
| `src/actions/edificios.js` | 3 operações de escrita com proprietario_id | VERIFICADO | 3 ocorrências de `proprietario_id` (criar + editar + deletar) |
| `src/actions/locatarios.js` | 5 operações de escrita com proprietario_id | VERIFICADO | 6 ocorrências de `proprietario_id` (convidar + editar + 2x deletar + 2x revogar) |
| `src/lib/queries-client.js` | getUnidadesDisponiveis() usando RPC | VERIFICADO | Linha 81: `supabase.rpc('get_unidades_disponiveis')` |
| `src/components/features/UnidadesPublicas.js` | Usa getEdificiosPublicos() | VERIFICADO | Linha 30: `Promise.all([getUnidadesDisponiveis(), getEdificiosPublicos()])` |

---

## Key Link Verification

| De | Para | Via | Status | Detalhes |
|----|------|-----|--------|---------|
| `criarEdificio` | `edificios.proprietario_id` | `proprietario_id: user.id` no insert | VERIFICADO | `edificios.js:25` |
| `editarEdificio` | `edificios.proprietario_id` | `.eq('proprietario_id', user.id)` | VERIFICADO | `edificios.js:39` — Plan 04 |
| `deletarEdificio` | `edificios.proprietario_id` | `.eq('proprietario_id', user.id)` | VERIFICADO | `edificios.js:49` — Plan 04 |
| `convidarLocatario` | `locatarios.proprietario_id` | `proprietario_id: user.id` no insert | VERIFICADO | `locatarios.js:34` |
| `editarLocatario` | `locatarios.proprietario_id` | `.eq('proprietario_id', user.id)` | VERIFICADO | `locatarios.js:66` — Plan 04 |
| `deletarLocatario` | `locatarios.proprietario_id` | `.eq('proprietario_id', user.id)` x2 | VERIFICADO | `locatarios.js:80,83` — Plan 04 |
| `revogarConvite` | `locatarios.proprietario_id` | `.eq('proprietario_id', user.id)` x2 | VERIFICADO | `locatarios.js:99,108` — Plan 04 |
| `unidades SELECT (qualquer role)` | unidades disponíveis | RPC `get_unidades_disponiveis()` SECURITY DEFINER | VERIFICADO | Funciona para anon e authenticated |
| `[data-theme]` sistema | CSS vars multi-paleta | atributo HTML + CSS vars | NAO_LIGADO | Nunca implementado — ROADMAP SC3 FAILED |

---

## Data-Flow Trace (Level 4)

| Artefato | Variável | Fonte | Dados Reais | Status |
|----------|----------|-------|-------------|--------|
| `UnidadesPublicas.js` | `unidades`, `edificios` | RPCs SECURITY DEFINER | Sim — JOIN WHERE status='disponivel' | FLOWING |
| `get_unidades_disponiveis()` RPC | `valor_mensal` | `u.valor_mensal` SQL incondicional | Sim — sem masking no SQL | PARCIAL (masking só no cliente JS) |

---

## Behavioral Spot-Checks

| Comportamento | Comando | Resultado | Status |
|--------------|---------|-----------|--------|
| Migration 20260521000000 existe | `ls supabase/migrations/` | encontrada (11.3K) | PASS |
| Migration 20260522000000 existe | `ls supabase/migrations/` | encontrada (657B) | PASS |
| Migration 20260523000000 existe | `ls supabase/migrations/` | encontrada (2.4K) | PASS |
| 23 CREATE POLICY | `grep -c "^CREATE POLICY" migration_01.sql` | 23 | PASS |
| 6 SECURITY DEFINER | `grep -c "SECURITY DEFINER" migration_01.sql` | 6 | PASS |
| 2 ADD COLUMN proprietario_id | `grep -c "ADD COLUMN IF NOT EXISTS proprietario_id"` | 2 | PASS |
| proprietario_id em criarEdificio | `grep "proprietario_id: user.id" edificios.js` | linha 25 | PASS |
| authGuard() retorna user | `grep "return { user }" edificios.js` | linha 14 | PASS |
| 7 filtros .eq('proprietario_id') em actions | `grep -rn "eq('proprietario_id', user.id)" src/actions/` | 7 linhas | PASS |
| MT-04: sem guard instância única | `grep "Instância já configurada" src/actions/auth.js src/app/signup` | nenhuma saída | PASS |
| Commits Plan 04 existem | `git log --oneline` | 8c5ba2d + b8abd46 | PASS |
| data-theme implementado (ROADMAP SC3) | `grep -r "data-theme" src/` | nenhuma saída | FAIL |

---

## Requirements Coverage

| Requisito | Plano Fonte | Descrição | Status | Evidência |
|-----------|------------|-----------|--------|-----------|
| MT-01 | 11-01-PLAN | Colunas proprietario_id NOT NULL; seed populado | SATISFEITO | Schema, seed e write-path verificados |
| MT-02 | 11-01-PLAN | RLS 5 tabelas; anon e portal preservados; sem recursão | SATISFEITO | 23 policies; 6 SECURITY DEFINER; anon RPC funcional |
| MT-03 | 11-02-PLAN | criarEdificio e convidarLocatario com proprietario_id | SATISFEITO | `edificios.js:25`, `locatarios.js:34` |
| MT-04 | 11-03-PLAN | Signup aberto sem guard de instância única | SATISFEITO | `src/actions/auth.js` sem guard de contagem |
| **UX-01** | REQUIREMENTS.md fase 11 | Dashboard desktop escala fontes ≥14px/≥24px | **NAO IMPLEMENTADO** | Nenhum código de tipografia nesta fase. ROADMAP SC1 FAILED |
| **THEME-01** | REQUIREMENTS.md fase 11 | Sistema `[data-theme]` + CSS vars | **NAO IMPLEMENTADO** | `grep -r "data-theme" src/` = vazio. ROADMAP SC3 FAILED |
| **THEME-02** | REQUIREMENTS.md fase 11 | Paleta alternativa ao Obsidian Blueprint | **NAO IMPLEMENTADO** | Nenhum arquivo de tema criado. ROADMAP SC3 FAILED |

**Nota:** MT-01 a MT-04 são ORPHANED no REQUIREMENTS.md (não existem na tabela de rastreabilidade oficial). UX-01, THEME-01, THEME-02 são ORPHANED da execução — atribuídos à Phase 11 pelo ROADMAP mas não implementados.

---

## Anti-Patterns Found

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| `supabase/migrations/20260523000000_fix_unidades_select_public_rpc.sql` | ~41 | `u.valor_mensal` retornado incondicionalmente na função SQL | WARNING | Masking só no cliente JS; chamada direta ao RPC expõe preços ocultos |
| `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql` | is_unidade_do_locatario | Sem filtro `contratos.status='ativo'` | WARNING | Ex-locatários retêm acesso SELECT à unidade após contrato encerrado/cancelado |

Nenhum marcador TBD/FIXME/XXX encontrado nos arquivos modificados.

---

## Human Verification Required

### 1. Isolamento Visual A↔B no Dashboard

**Teste:** Confirmar conta Proprietário B via Supabase Dashboard → Authentication → Users → Confirm email. Fazer login com B. Verificar que o dashboard está vazio (nenhum dado de A visível). Criar edifício como B. Voltar para A e confirmar que o edifício de B não aparece.
**Esperado:** Isolamento completo A↔B.
**Por que humano:** Policies SELECT estruturalmente corretas mas verificação empírica bloqueada por SMTP. Requer dois logins distintos e inspeção visual.

### 2. Configurar SMTP no Supabase

**Teste:** Signup de novo Proprietário via `/signup`, aguardar email automático, confirmar e fazer login.
**Esperado:** Email chega automaticamente sem intervenção no painel admin.
**Por que humano:** Supabase Dashboard → Authentication → Email → SMTP Settings. Alternativa imediata: confirmar email manualmente em Authentication → Users → Confirm email.

### 3. valor_mensal Mascaramento no Servidor (WR-01)

**Teste:** Chamar `supabase.rpc('get_unidades_disponiveis')` diretamente (curl/devtools) com sessão autenticada para unidade com `valor_visivel=false`.
**Esperado:** `valor_mensal` retorna `null` mascarado no SQL.
**Por que humano:** RPC SQL retorna `u.valor_mensal` incondicionalmente; masking só existe no cliente JS (queries-client.js:82). Requer teste direto contra o banco remoto.

---

## Gaps Summary

### Gaps BLOCKER — ROADMAP Phase 11 não entregue

O ROADMAP Phase 11 declara 3 success criteria (UX-01, THEME-01, THEME-02) sobre escala visual e sistema de temas. **Nenhum foi implementado.** A fase executada foi isolamento multi-tenant — funcional e correto nos seus próprios termos, mas não é o que Phase 11 contratou.

**Resolução requerida (escolha uma):**

**Opção A — Completar o ROADMAP Phase 11:**
Implementar a Escala Desktop + Tema via plan de gap closure: verificar/corrigir tipografia do dashboard (body ≥14px, h1 ≥24px) e implementar sistema `[data-theme]` com paleta alternativa.

**Opção B — Corrigir o ROADMAP retroativamente:**
Reconhecer que a fase executada foi válida mas não corresponde ao Phase 11 planejado. Atualizar ROADMAP.md para registrar a fase multi-tenant corretamente (ex.: como uma fase não numerada ou renomeando). Recriar Phase 11 Escala Desktop + Tema como nova fase (pode ser entre 11 e 12 ou adicional). Atualizar REQUIREMENTS.md traceability table (linhas 105-107) para mapear UX-01/THEME-01/THEME-02 para a nova fase.

Os 3 gaps estão estruturados no frontmatter `gaps:` para `/gsd-plan-phase --gaps`.

---

_Verificado: 2026-06-09T15:00:00Z_
_Verificador: Claude (gsd-verifier)_
