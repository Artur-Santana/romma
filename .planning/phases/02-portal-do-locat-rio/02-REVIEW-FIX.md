---
phase: 02-portal-do-locatario
fixed_at: 2026-05-23T00:00:00Z
review_path: .planning/phases/02-portal-do-locat-rio/02-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 8
skipped: 1
status: partial
---

# Fase 02: Relatório de Code Review Fix — Portal do Locatário

**Fixed at:** 2026-05-23
**Source review:** .planning/phases/02-portal-do-locat-rio/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (CR-01, CR-02, CR-03, WR-01, WR-02, WR-03, WR-04, WR-05, WR-06)
- Fixed: 8 (WR-05 verificado — código correto, sem alteração necessária)
- Skipped: 1

---

## Fixed Issues

### CR-01: `updateParcelaStatus` mutação exposta em `queries-client.js`

**Files modified:** `src/lib/queries-client.js`
**Commit:** 88bc940
**Applied fix:** Removida a função `updateParcelaStatus` de queries-client.js. Não havia nenhum chamador da função no código-fonte (`rg -n "updateParcelaStatus" src/` retornou apenas a definição). Como `src/actions/parcelas.js` já existia com `marcarParcelaComoPaga` (que usa `supabaseAdmin` e authGuard de proprietário), nenhuma nova Server Action foi necessária — a remoção foi suficiente.

---

### CR-02: `getLocatarioByUserId` e outras queries ignoram `.error`

**Files modified:** `src/lib/queries-client.js`
**Commit:** 88bc940
**Applied fix:** Adicionado `if (error) throw new Error(error.message)` em `getLocatarioByUserId`, `getUnidade`, `getEdificio` e `getContratoAtivoByLocatario`. Todos os chamadores dessas funções no lado do Portal estão dentro de try/catch (PortalDashboard.js linha 20–35), portanto o comportamento de throw é seguro. O dashboard (unidades/page.js) usa uma função local `getEdificio` diferente, não a da queries-client.js.

---

### CR-03: `proxy.js` faz duas chamadas RPC independentes e matcher incompleto

**Files modified:** `src/proxy.js`
**Commit:** 3e80813
**Applied fix:** Consolidadas as duas chamadas `supabase.rpc('is_proprietario')` em uma única chamada compartilhada. O matcher foi corrigido para incluir as rotas raiz: `['/dashboard', '/dashboard/:path*', '/portal', '/portal/:path*']`.

---

### WR-01: `PortalDashboard` não chamava `setLoading(false)` quando `user` é null

**Files modified:** `src/components/features/portal/PortalDashboard.js`
**Commit:** 0ceff2c
**Applied fix:** Adicionado `setLoading(false)` explicitamente antes do `return` quando user é null. Nota: o código já tinha um bloco `finally { setLoading(false) }` que cobria este caso — a mudança é defensiva/explícita mas tecnicamente o estado de loading já era resolvido corretamente pelo finally.

---

### WR-02: `getParcelasByContrato` sem fallback `?? []`

**Files modified:** `src/lib/queries-client.js`
**Commit:** 88bc940
**Applied fix:** Alterado `return data` para `return data ?? []` em `getParcelasByContrato`, alinhando com o padrão já adotado em `getParcelasByContratos` e `getParcelasPortal`.

---

### WR-03: `seed.mjs` executável sem guard de ambiente

**Files modified:** `e2e/seed.mjs`
**Commit:** 4252d2b
**Applied fix:** Substituída a chamada incondicional `seed()` por um bloco `if (import.meta.url === ...)` que verifica se a URL do Supabase contém `test`, `local` ou `127.0.0.1` antes de executar. O seed ainda é exportado como função para uso programático pelo Playwright (global-setup).

---

### WR-04: `handleForgotPassword` ignora erro de `resetPasswordForEmail`

**Files modified:** `src/app/login/page.js`
**Commit:** f13593a
**Applied fix:** Desestruturado `{ error }` do retorno de `resetPasswordForEmail`. Se houver erro, `setStatus("error")` é chamado e a função retorna antecipadamente. Somente em caso de sucesso o status vai para `reset_sent`.

---

## Skipped Issues

### WR-05: `getLocatarios` seleciona `status_convite` — coluna não documentada no schema

**File:** `src/lib/queries-client.js:16`
**Status:** ✅ Verificado — código está correto. Coluna `status_convite` (`text NOT NULL`) confirmada via `information_schema.columns` no banco Supabase (`vfymttcajeyhrmsyhrtj`). A query está correta; o CLAUDE.md é que está desatualizado. Nenhuma alteração de código necessária.

**Action taken:** Nenhuma alteração em código. CLAUDE.md pode ser atualizado para documentar a coluna (fora do escopo deste fix).

**Original issue:** `getLocatarios` seleciona `status_convite`, coluna ausente no schema documentado em CLAUDE.md.

---

### WR-06: `global-teardown.js` identifica unidade por nome (frágil)

**File:** `e2e/global-teardown.js:43-49`
**Reason:** A correção proposta requer que o seed exporte/persista o `edificio_id` em um artefato compartilhado (ex: arquivo temporário ou variável global via globalSetup). Não há tal mecanismo no projeto atualmente. Implementar isso requer mudanças arquiteturais no setup/teardown do Playwright que vão além do escopo de um fix atômico. Marcado como "requer atenção manual".

**Original issue:** Teardown identifica unidade pelo nome `'Sala 101'` em vez de pelo ID do edifício criado pelo seed, podendo deletar dados de outros testes em execuções paralelas.

---

_Fixed: 2026-05-23_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
