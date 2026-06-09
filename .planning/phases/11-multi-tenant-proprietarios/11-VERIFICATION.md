---
phase: 11-multi-tenant-proprietarios
verified: 2026-06-09T00:00:00Z
status: gaps_found
score: "5/7 verificados (1 FAILED — IDOR write-path, BLOCKER; 1 UNCERTAIN — isolamento A↔B, pendente verificação humana)"
overrides_applied: 0
gaps:
  - truth: "Proprietário A não edita nem deleta edifícios/locatários de Proprietário B"
    status: failed
    reason: >
      editarEdificio e deletarEdificio (edificios.js:30-52) e editarLocatario,
      deletarLocatario, revogarConvite (locatarios.js:59-112) passam por authGuard/isProprietario
      mas executam via supabaseAdmin (service role — bypassa RLS) com filtro .eq('id', id) apenas,
      sem nenhuma restrição de proprietario_id. Qualquer Proprietário autenticado que conheça
      (ou adivinhe) um UUID válido pode editar ou deletar edifícios e locatários de outro Proprietário.
      deletarLocatario e revogarConvite também destroem a conta auth.users do locatário alvo.
      Este é um IDOR crítico na operação de escrita — a meta da fase exige que cada Proprietário
      'opera apenas seus próprios dados', não apenas que os lê.
    artifacts:
      - path: "src/actions/edificios.js"
        issue: "editarEdificio (linha 31-42) e deletarEdificio (linha 44-52): authGuard() destructura apenas { err }, descartando user. Nenhum .eq('proprietario_id', user.id) no update/delete."
      - path: "src/actions/locatarios.js"
        issue: "editarLocatario (linha 66), deletarLocatario (linha 83), revogarConvite (linha 108): queries com .eq('id', id) via supabaseAdmin sem filtro de proprietario_id."
    missing:
      - "editarEdificio: destruturar user de authGuard(); adicionar .eq('proprietario_id', user.id) ao .update()"
      - "deletarEdificio: destruturar user de authGuard(); adicionar .eq('proprietario_id', user.id) ao .delete()"
      - "editarLocatario: recuperar user autenticado; adicionar .eq('proprietario_id', user.id) ao .update()"
      - "deletarLocatario: adicionar .eq('proprietario_id', user.id) ao .select() e ao .delete() — verificação de posse antes de destruir conta auth"
      - "revogarConvite: adicionar .eq('proprietario_id', user.id) ao .select() e ao .delete()"

human_verification:
  - test: "Isolamento visual A↔B no dashboard"
    expected: "Proprietário B logado vê dashboard vazio (zero dados de Proprietário A visíveis); edifício criado por B não aparece para A"
    why_human: "Políticas SELECT são estruturalmente corretas em código, mas verificação empírica A↔B foi bloqueada por ausência de SMTP. Requer dois logins distintos e confirmação manual de email via Supabase Dashboard"
  - test: "Configurar SMTP no Supabase para envio de email de confirmação de conta"
    expected: "Signup de novo Proprietário dispara email de confirmação; usuário consegue confirmar conta e fazer login sem intervenção manual no Supabase Dashboard"
    why_human: "Problema de infraestrutura — requer configuração externa no Supabase Dashboard (Authentication → Email → SMTP Settings). Sem SMTP configurado, novos Proprietários só conseguem confirmar conta via 'Confirm email' manual no painel admin. Bloqueia o fluxo de onboarding multi-tenant end-to-end."
    category: infra
    action_required: "Supabase Dashboard → Authentication → Email → SMTP Settings → configurar provider (ex: Resend, SendGrid, ou SMTP próprio). Alternativa rápida: Supabase → Authentication → Users → selecionar usuário → Confirm email."
  - test: "valor_mensal mascaramento no lado servidor (WR-01)"
    expected: "Chamada direta a supabase.rpc('get_unidades_disponiveis') retorna null em valor_mensal quando valor_visivel=false"
    why_human: "A função SQL retorna u.valor_mensal incondicionalmente; masking ocorre apenas no cliente JS (queries-client.js:82). Verificação requer curl/devtools contra o RPC remoto diretamente"
---

# Phase 11: Multi-Tenant Proprietários — Verificação de Objetivo

**Objetivo da fase:** Implementar isolamento multi-tenant por Proprietário — cada Proprietário vê e opera apenas seus próprios edifícios, unidades, contratos, parcelas e locatários.

**Verificado:** 2026-06-09
**Status:** gaps_found
**Re-verificação:** Não — verificação inicial

---

## Alerta de Rastreabilidade: IDs de Requisito Sem Correspondência no ROADMAP/REQUIREMENTS

Os PLANs desta fase declaram requisitos MT-01, MT-02, MT-03, MT-04. **Nenhum desses IDs existe em `.planning/REQUIREMENTS.md` nem em `.planning/ROADMAP.md`.**

No ROADMAP, Phase 11 está registrada como "Escala Desktop + Tema" com requisitos UX-01, THEME-01, THEME-02 — uma fase completamente diferente da que foi executada aqui. Esta fase de isolamento multi-tenant não tem entrada oficial no ROADMAP/REQUIREMENTS.

Os IDs MT-01 a MT-04 são internos a esta fase apenas — **ORPHANED** no sentido de não estarem na tabela de rastreabilidade de `REQUIREMENTS.md`. Esta situação requer decisão humana: a fase multi-tenant foi executada fora do roadmap formal? Deve ser registrada retroativamente?

**Impacto na verificação:** A fase é verificada contra o objetivo declarado pelo executor (`fase 11-multi-tenant-proprietarios`) e os must-haves dos PLANs, não contra os Success Criteria do ROADMAP Phase 11 (que pertencem a uma fase diferente — Escala Desktop + Tema).

---

## Objetivo: Conquista da Meta

### Truths Observáveis

| # | Truth | Status | Evidência |
|---|-------|--------|-----------|
| 1 | edificios e locatarios têm coluna proprietario_id NOT NULL | VERIFICADO | `20260521000000_multi_tenant_proprietario_id.sql` linhas 14-45: `ADD COLUMN IF NOT EXISTS proprietario_id uuid REFERENCES auth.users(id)` + `ALTER COLUMN proprietario_id SET NOT NULL` em ambas as tabelas. 2 de cada confirmado por contagem |
| 2 | Rows existentes de edificios/locatarios têm proprietario_id populado | VERIFICADO | Migration: `UPDATE ... SET proprietario_id = (SELECT usuario_id FROM proprietarios ORDER BY created_at ASC LIMIT 1) WHERE proprietario_id IS NULL`; 11-VERIFICATION.md original confirma 0 NULLs em ambas as tabelas via query remota com service role |
| 3 | Proprietário autenticado lê via RLS apenas suas próprias rows nas 5 tabelas | INCERTO (pendente humano) | 23 policies criadas e aplicadas remotamente (migration list: APPLIED). edificios/locatarios: `auth.uid() = proprietario_id` inline. unidades/contratos/parcelas: via 6 funções SECURITY DEFINER. Estruturalmente correto. Verificação empírica A↔B não concluída por ausência de SMTP |
| 4 | Visitante anon em /unidades continua lendo unidades disponíveis com nome do edifício | VERIFICADO | RPC `get_unidades_disponiveis()` (SECURITY DEFINER, GRANT TO anon, authenticated) em `20260523000000`; `queries-client.js:81` usa `.rpc('get_unidades_disponiveis')`; `UnidadesPublicas.js:4` importa e usa ambas as RPCs. Confirmado 10 rows anon no 11-VERIFICATION.md original |
| 5 | Portal do Locatário exibe contrato ativo e histórico de parcelas | VERIFICADO | Policy `locatarios_select_proprio` (`auth.uid() = usuario_id`); `is_contrato_do_locatario` e `is_parcela_do_locatario` nas policies SELECT de contratos/parcelas. Verificado visualmente pelo usuário (11-VERIFICATION.md Cenário C: PASS) |
| 6 | criarEdificio e convidarLocatario gravam proprietario_id correto | VERIFICADO | `edificios.js:25`: `proprietario_id: user.id` confirmado em código-fonte. `locatarios.js:34`: `proprietario_id: user.id` confirmado em código-fonte. `authGuard()` retorna `{ user }` (linha 14) |
| 7 | Proprietário A não edita nem deleta edifícios/locatários de Proprietário B | FALHOU — BLOCKER | `editarEdificio` (linha 31): `const { err } = await authGuard()` — user descartado. `.update(...).eq('id', id)` via supabaseAdmin, sem `.eq('proprietario_id', user.id)`. Mesmo padrão em `deletarEdificio`, `editarLocatario`, `deletarLocatario`, `revogarConvite`. IDOR confirmado em código |

**Score:** 5 verificados / 7 must-haves (1 FAILED — BLOCKER; 1 INCERTO — pendente humano)

---

### Itens Diferidos

Nenhum. As lacunas identificadas não são cobertas por Phases 12–14 (Mobile, Animações, Testes).

---

## Artefatos Obrigatórios

| Artefato | Esperado | Status | Detalhes |
|----------|---------|--------|---------|
| `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql` | Migration multi-tenant com proprietario_id + RLS | VERIFICADO | Existe; 2 ADD COLUMN, 2 SET NOT NULL, 6 SECURITY DEFINER, 23 CREATE POLICY. Aplicada remotamente |
| `supabase/migrations/20260522000000_fix_edificios_select_public_policy.sql` | Fix policy edificios_select_public (coluna ambígua) | VERIFICADO | Existe; `ALTER POLICY "edificios_select_public"` com `public.edificios.id` explicitamente qualificado. Aplicada remotamente |
| `supabase/migrations/20260523000000_fix_unidades_select_public_rpc.sql` | RPCs públicas get_unidades_disponiveis() e get_edificios_publicos() | VERIFICADO | Existe; ambas SECURITY DEFINER, GRANT TO anon e authenticated. Aplicada remotamente |
| `src/actions/edificios.js` | criarEdificio com proprietario_id; authGuard retornando user | PARCIALMENTE VERIFICADO | criarEdificio correto (linha 25). editarEdificio e deletarEdificio sem escopo de proprietario_id — IDOR blocker |
| `src/actions/locatarios.js` | convidarLocatario com proprietario_id | PARCIALMENTE VERIFICADO | convidarLocatario correto (linha 34). editarLocatario, deletarLocatario, revogarConvite sem escopo de proprietario_id — IDOR blocker |
| `src/lib/queries-client.js` | getUnidadesDisponiveis() usando RPC | VERIFICADO | Linha 81: `supabase.rpc('get_unidades_disponiveis')` com masking de valor_mensal no cliente (linha 82) |
| `src/components/features/UnidadesPublicas.js` | Usa getEdificiosPublicos() em vez de getEdificios() | VERIFICADO | Linha 4: importa `getUnidadesDisponiveis, getEdificiosPublicos`; linha 30: usa ambas via `Promise.all` |

---

## Verificação de Links Principais

| De | Para | Via | Status | Detalhes |
|----|------|-----|--------|---------|
| `edificios.proprietario_id` | `auth.users.id` | FK + RLS `auth.uid() = proprietario_id` | VERIFICADO | Migration linha 15; policy `edificios_select_proprietario` linha 183 |
| `criarEdificio` | `edificios.proprietario_id` | insert payload `proprietario_id: user.id` | VERIFICADO | `edificios.js:25` — confirmado em código |
| `convidarLocatario` | `locatarios.proprietario_id` | insert payload `proprietario_id: user.id` | VERIFICADO | `locatarios.js:34` — confirmado em código |
| `editarEdificio` | `edificios.proprietario_id` | `.eq('proprietario_id', user.id)` no update | NAO_LIGADO | Apenas `.eq('id', id)` — sem filtro de proprietario_id. IDOR blocker |
| `deletarEdificio` | `edificios.proprietario_id` | `.eq('proprietario_id', user.id)` no delete | NAO_LIGADO | Apenas `.eq('id', id)` — sem filtro de proprietario_id. IDOR blocker |
| `editarLocatario / deletarLocatario / revogarConvite` | `locatarios.proprietario_id` | `.eq('proprietario_id', user.id)` | NAO_LIGADO | Apenas `.eq('id', id)` — sem filtro de proprietario_id. IDOR blocker |
| `unidades SELECT anon + authenticated` | unidades disponíveis | RPC `get_unidades_disponiveis()` SECURITY DEFINER | VERIFICADO | Funciona para qualquer role; contorna limitação de TO anon nas policies |
| `policies cross-table` | funções SECURITY DEFINER | evita recursão RLS em unidades↔contratos↔parcelas | VERIFICADO | 6 funções com `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public` confirmadas em código |

---

## Rastreio de Fluxo de Dados (Nível 4)

| Artefato | Variável de dados | Fonte | Produz dados reais | Status |
|----------|------------------|-------|---------------------|--------|
| `UnidadesPublicas.js` | `unidades`, `edificios` | `get_unidades_disponiveis()`, `get_edificios_publicos()` via RPC SECURITY DEFINER | Sim — JOIN de unidades+edificios WHERE status='disponivel' | FLOWING |
| `get_unidades_disponiveis()` RPC | `valor_mensal` | `u.valor_mensal` SQL incondicional | Sim — mas sem masking no SQL (ver WR-01) | PARCIAL — masking apenas no cliente JS |

---

## Cobertura de Requisitos

| Requisito | Plano Fonte | Descrição | Status | Evidência |
|-----------|------------|-----------|--------|-----------|
| MT-01 | 11-01-PLAN | Colunas proprietario_id NOT NULL; seed populado | PARCIALMENTE SATISFEITO | Schema e seed verificados; write-path sem escopo de proprietario_id (IDOR) |
| MT-02 | 11-01-PLAN | RLS atualizada nas 5 tabelas; anon e portal preservados; sem recursão | SATISFEITO | 23 policies em código; sem recursão via SECURITY DEFINER; anon via RPC funcional |
| MT-03 | 11-02-PLAN | criarEdificio e convidarLocatario incluem proprietario_id nas inserções | SATISFEITO | Confirmado em código — `edificios.js:25`, `locatarios.js:34` |
| MT-04 | 11-03-PLAN | Signup aberto cria Proprietários sem guard de instância única | SATISFEITO | `auth.js` usa `supabase.auth.signUp()` sem contagem de proprietários; ausência de guard confirmada por grep |

**ORPHANED:** MT-01 a MT-04 não existem em `REQUIREMENTS.md` nem no ROADMAP oficial. A tabela de rastreabilidade do ROADMAP não contém referência a esta fase. Decisão humana necessária.

---

## Anti-Padrões Encontrados

| Arquivo | Linha | Padrão | Severidade | Impacto |
|---------|-------|--------|------------|---------|
| `src/actions/edificios.js` | 31 | `const { err } = await authGuard()` — user descartado; update sem proprietario_id | BLOCKER | Qualquer Proprietário autenticado edita qualquer edifício por UUID |
| `src/actions/edificios.js` | 45 | `const { err } = await authGuard()` — user descartado; delete sem proprietario_id | BLOCKER | Qualquer Proprietário autenticado deleta qualquer edifício (e unidades vinculadas) por UUID |
| `src/actions/locatarios.js` | 66 | `.update(...).eq('id', id)` via supabaseAdmin sem proprietario_id | BLOCKER | Qualquer Proprietário autenticado edita qualquer locatário por UUID |
| `src/actions/locatarios.js` | 83 | `.delete().eq('id', id)` via supabaseAdmin sem proprietario_id | BLOCKER | Qualquer Proprietário autenticado deleta locatário + conta auth de outro tenant |
| `src/actions/locatarios.js` | 108 | `.delete().eq('id', id)` via supabaseAdmin sem proprietario_id | BLOCKER | Qualquer Proprietário autenticado revoga convite de locatário de outro tenant, destruindo conta auth |
| `supabase/migrations/20260523000000_fix_unidades_select_public_rpc.sql` | 41 | `u.valor_mensal` retornado incondicionalmente na função SQL | WARNING | valor_mensal mascarado apenas no cliente; chamada direta ao RPC expõe preços ocultos |
| `supabase/migrations/20260521000000_multi_tenant_proprietario_id.sql` | 74-80 | `is_unidade_do_locatario` sem filtro `contratos.status='ativo'` | WARNING | Ex-locatários retêm acesso à unidade após contrato encerrado/cancelado |

Nenhum marcador TBD/FIXME/XXX encontrado nos arquivos modificados desta fase.

---

## Verificações Comportamentais

| Comportamento | Comando | Resultado | Status |
|--------------|---------|-----------|--------|
| Migration 20260521000000 aplicada no remoto | `npx supabase migration list --linked` | `20260521000000 APPLIED` | PASS |
| Migration 20260522000000 aplicada no remoto | `npx supabase migration list --linked` | `20260522000000 APPLIED` | PASS |
| Migration 20260523000000 aplicada no remoto | `npx supabase migration list --linked` | `20260523000000 APPLIED` | PASS |
| 23 CREATE POLICY na migration 01 | `grep -c "CREATE POLICY" migration_01.sql` | 23 | PASS |
| 6 SECURITY DEFINER functions na migration 01 | `grep -c "SECURITY DEFINER" migration_01.sql` | 6 | PASS |
| 2 ADD COLUMN proprietario_id na migration 01 | `grep -c "ADD COLUMN IF NOT EXISTS proprietario_id" migration_01.sql` | 2 | PASS |
| criarEdificio contém proprietario_id | `grep "proprietario_id: user.id" src/actions/edificios.js` | encontrado linha 25 | PASS |
| authGuard() retorna user | `grep "return { user }" src/actions/edificios.js` | encontrado linha 14 | PASS |
| convidarLocatario contém proprietario_id | `grep "proprietario_id: user.id" src/actions/locatarios.js` | encontrado linha 34 | PASS |
| editarEdificio sem escopo de proprietario_id | verificação de ausência de `.eq('proprietario_id'` em editarEdificio | ausente — apenas `.eq('id', id)` | FAIL — IDOR BLOCKER |
| deletarEdificio sem escopo de proprietario_id | verificação de ausência de `.eq('proprietario_id'` em deletarEdificio | ausente — apenas `.eq('id', id)` | FAIL — IDOR BLOCKER |
| editarLocatario/deletarLocatario/revogarConvite sem escopo | verificação de ausência de `.eq('proprietario_id'` nessas funções | ausente em todas as três | FAIL — IDOR BLOCKER |
| getUnidadesDisponiveis usa RPC | `grep "rpc('get_unidades_disponiveis')" queries-client.js` | encontrado linha 81 | PASS |
| UnidadesPublicas usa getEdificiosPublicos | `grep "getEdificiosPublicos" UnidadesPublicas.js` | encontrado linha 4 | PASS |
| MT-04: ausência de guard de instância única | `grep "Instância já configurada" src/actions/auth.js src/app/signup` | nenhuma saída | PASS |

---

## Execução de Probes

Nenhum script de probe convencional encontrado (`scripts/*/tests/probe-*.sh` inexistente). Verificação funcional realizada por análise estática de código e verificação remota de migrations via `supabase migration list --linked`.

---

## Verificação Humana Necessária

### 1. Isolamento Visual A↔B no dashboard

**Teste:** Confirmar conta Proprietário B via Supabase Dashboard → Authentication → Users → Confirm email. Fazer login com Proprietário B. Verificar que o dashboard está vazio (nenhum edifício, locatário, contrato, parcela de Proprietário A aparece). Criar um edifício como Proprietário B. Voltar ao Proprietário A e confirmar que o edifício de B não aparece.
**Esperado:** Dashboard de B vazio inicialmente; edifício criado por B visível apenas para B; dashboard de A inalterado
**Por que humano:** As policies SELECT são estruturalmente corretas em código, mas a verificação empírica foi bloqueada por ausência de SMTP. Requer dois logins distintos, confirmação manual de email via Supabase Dashboard, e inspeção visual — não verificável por grep

### 2. Configurar SMTP no Supabase (gap de infra)

**Teste:** Criar novo Proprietário via `/signup`, aguardar email de confirmação, confirmar e fazer login.
**Esperado:** Email chega automaticamente sem intervenção manual no painel admin.
**Por que humano:** Requer configuração externa — Supabase Dashboard → Authentication → Email → SMTP Settings. Sem isso, o fluxo multi-tenant (Cenário 1 da verificação) não pode ser testado de ponta a ponta.
**Ação:** Configurar um SMTP provider (ex: Resend, SendGrid) ou usar a integração nativa do Supabase. Como alternativa imediata: confirmar email manualmente em Authentication → Users → Confirm email.

### 3. valor_mensal mascaramento no lado servidor (WR-01)

**Teste:** Usando devtools do browser ou curl, chamar `supabase.rpc('get_unidades_disponiveis')` diretamente (sem passar pelo cliente JS da aplicação) com uma sessão autenticada para uma unidade onde `valor_visivel = false`
**Esperado:** Campo `valor_mensal` deve retornar `null` (mascarado no SQL), não o valor real
**Por que humano:** A RPC SQL retorna `u.valor_mensal` incondicionalmente (migration 3, linha 41). O masking `u.valor_visivel ? u : { ...u, valor_mensal: null }` só existe no cliente JS (queries-client.js:82). Qualquer chamada direta ao RPC via REST expõe os preços ocultos. Requer teste direto contra o banco remoto

---

## Resumo de Lacunas

### Lacuna BLOCKER — IDOR no write-path (CR-01, CR-02, CR-03)

O objetivo da fase declara que cada Proprietário "vê **e opera**" apenas seus próprios dados.

**O que está correto:**
- Leitura (SELECT): corretamente isolada em todas as 5 tabelas via 23 RLS policies e 6 funções SECURITY DEFINER
- Criação: `criarEdificio` e `convidarLocatario` gravam `proprietario_id: user.id` explicitamente

**O que está quebrado:**
- `editarEdificio` e `deletarEdificio` (`edificios.js`): executam via `supabaseAdmin` (service role, bypassa RLS) com `.eq('id', id)` apenas — sem verificação de posse
- `editarLocatario`, `deletarLocatario`, `revogarConvite` (`locatarios.js`): mesmo padrão — autenticam o caller como Proprietário, mas não verificam se o locatário alvo pertence a esse Proprietário. `deletarLocatario` e `revogarConvite` destroem a conta `auth.users` do locatário alvo — cross-tenant account deletion

**Contexto:** O `11-01-PLAN.md` marcou essas funções como "fora de escopo" citando `11-RESEARCH §5, item 4`. Isso é uma decisão de planejamento, não uma aceitação de risco documentada. O objetivo da fase não exclui operações de escrita; portanto, sob verificação goal-backward, a meta não está atingida.

**Esta lacuna não é diferida para Phases 12–14** (Mobile, Animações, Testes).

**Sugestão de override:** Se a equipe aceita explicitamente o risco de IDOR nas operações de edição/exclusão para o escopo do TCC, adicionar à frontmatter deste arquivo:

```yaml
overrides:
  - must_have: "Proprietário A não edita nem deleta edifícios/locatários de Proprietário B"
    reason: "IDOR em write-path aceito como risco controlado — contexto TCC com Proprietário único por instalação na prática; endpoints não expostos publicamente"
    accepted_by: "<nome>"
    accepted_at: "<timestamp ISO>"
```

Com esse override, status mudaria para `human_needed` (isolamento A↔B visual ainda pendente).

---

_Verificado: 2026-06-09_
_Verificador: Claude (gsd-verifier)_
