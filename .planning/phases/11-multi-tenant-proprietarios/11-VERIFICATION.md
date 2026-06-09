# Phase 11 — Multi-Tenant Proprietários: Verificação End-to-End

## Resultados da Verificação Automatizada (Task 1)

Data de execução: 2026-06-09

---

### Cenário 1 — MT-04: Signup aberto (sem guard de instância única)

**Check:** Ausência de guard `"Instância já configurada"` / `instancia.*configurada` / `count.*proprietarios` em `src/actions/auth.js` e `src/app/signup/`.

```bash
grep -rn "Instância já configurada\|instancia.*configurada\|count.*proprietarios" src/actions/auth.js src/app/signup/
# → nenhuma saída (exit code 1)
```

- Guard removido no commit `b9537f8` ("fix(10): remover guard de instância única — preparar para modelo multi-tenant").
- `src/actions/auth.js` implementa apenas `signUp` via `supabase.auth.signUp` sem verificação de contagem de Proprietários.

**Resultado: PASS — MT-04 satisfeito**

---

### Cenário 2 — Seed: NULLs em proprietario_id

**Check:** Queries remotas via service role.

```
SELECT COUNT(*) FROM edificios WHERE proprietario_id IS NULL  → 0
SELECT COUNT(*) FROM locatarios WHERE proprietario_id IS NULL → 0
```

Verificado via `@supabase/supabase-js` com SUPABASE_ROLE_KEY:
- `edificios NULL count: 0` — PASS
- `locatarios NULL count: 0` — PASS

**Resultado: PASS — seed OK, zero NULLs**

---

### Cenário 3 — Contagem e presença de policies RLS

**Check:** Migration `20260521000000` aplicada ao remoto.

```
npx supabase migration list
  20260521000000 | 20260521000000 | 2026-05-21 (APPLIED)
```

Policies verificadas via testes funcionais (pg_policies inacessível via REST):

| Tabela | Policy verificada | Método |
|--------|-------------------|--------|
| unidades | `unidades_select_public` (anon) | SELECT anon retornou 10 rows status=disponivel |
| edificios | `edificios_select_public` (anon) — corrigida | SELECT anon retornou 7 rows após fix (veja Desvio abaixo) |
| edificios + unidades | JOIN anon `edificios(nome)` | nome do edifício populado corretamente |

**Resultado: PASS — policies funcionais (após fix em 20260522000000)**

---

### Cenário 4 — criarEdificio grava proprietario_id

**Check:** `grep -q "proprietario_id: user.id" src/actions/edificios.js`

```javascript
// src/actions/edificios.js linha 25
const { error } = await supabaseAdmin.from('edificios').insert({
  nome: nome.trim(),
  endereco: endereco.trim(),
  proprietario_id: user.id   // ← PRESENTE
})
```

Adicionalmente, `authGuard()` retorna `{ user }` (linha 14), e `criarEdificio` desestrutura `const { err, user } = await authGuard()` (linha 18).

**Resultado: PASS — proprietario_id gravado corretamente**

---

### Cenário 5 — Build sem erros

**Check:** `npm run build` completo.

```
✓ Compiled successfully in 6.6s
✓ Generating static pages using 11 workers (15/15) in 777ms
```

Saídas de rotas:
- `/signup` — estático (○)
- `/dashboard` — dinâmico (ƒ)
- `/unidades` — estático (○)
- `/portal/dashboard` — dinâmico (ƒ)

**Resultado: PASS — build sem erros**

---

### Cenário 6 — Testes E2E Playwright

**Check:** `npx playwright test`

O config de Playwright tem `reuseExistingServer: false` e inicia um servidor na porta 3000. Durante a execução automatizada, a porta 3000 já estava em uso (servidor de desenvolvimento ativo). Os testes E2E não puderam ser executados de forma autônoma.

**Ação necessária:** Encerrar o servidor de desenvolvimento antes de executar `npx playwright test`. Os testes cobrem `auth`, `crud`, `portal`, `public-pages`, `signup` — todos os fluxos relevantes para validação multi-tenant.

**Resultado: MANUAL — requer servidor desligado para executar**

---

## Desvio Detectado: Bug na Policy edificios_select_public (Plan 01)

**Detectado durante:** Task 1 — verificação funcional do JOIN anon

**Problema:** A migration `20260521000000` criava a policy com:
```sql
WHERE u.edificio_id = id AND u.status = 'disponivel'
```
O `id` não qualificado resolvia para `unidades.id` (via alias `u`), não para `edificios.id`. O `EXISTS` sempre retornava false → anon via 0 edificios → JOIN `edificios(nome)` retornava NULL na página pública `/unidades`.

**Fix aplicado:** Nova migration forward `20260522000000_fix_edificios_select_public_policy.sql`:
```sql
ALTER POLICY "edificios_select_public" ON public.edificios
USING (EXISTS (
  SELECT 1 FROM public.unidades u
  WHERE u.edificio_id = public.edificios.id AND u.status = 'disponivel'
));
```

**Verificação pós-fix:**
- `edificios SELECT anon: 7 rows` (era 0) — PASS
- JOIN `unidades + edificios(nome)` anon: nomes populados — PASS
- `npm run build` ainda passa — PASS

**Regra aplicada:** Rule 1 (bug auto-fix) — `must_have truth #2` ("Visitante anon em /unidades vê unidades disponíveis com nome do edifício") estava quebrado.

---

## Verificação Humana Pendente (Task 2 — AUDIT-01)

Os 4 cenários abaixo requerem login humano e validação visual:

| # | Cenário | Status |
|---|---------|--------|
| A | Isolamento entre Proprietários (A vs B) | AGUARDANDO VERIFICAÇÃO HUMANA |
| B | Página pública /unidades com nome do edifício (anon) | Automaticamente verificado + PASS (após fix) |
| C | Portal do Locatário (/portal com contrato + parcelas) | AGUARDANDO VERIFICAÇÃO HUMANA |
| D | Supabase Studio — edificio criado por B tem proprietario_id correto | AGUARDANDO VERIFICAÇÃO HUMANA |

> Nota: Cenário B foi verificado automaticamente via API — `7 edificios` visíveis para anon e `edificios(nome)` populado no JOIN. Validação visual no browser também recomendada.
