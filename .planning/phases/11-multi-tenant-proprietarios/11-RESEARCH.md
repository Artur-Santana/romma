# Phase 11: Multi-tenant Proprietários — Research

**Pesquisado em:** 2026-06-08
**Domínio:** Schema migration + RLS multi-tenant + Server Actions
**Confiança geral:** HIGH (todas as evidências são do próprio codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: `edificios` recebe `proprietario_id UUID REFERENCES auth.users(id) NOT NULL`
- D-02: `locatarios` recebe `proprietario_id UUID REFERENCES auth.users(id) NOT NULL`
- D-03: Migration de dados existentes via `proprietarios` seed (ADD nullable → UPDATE → SET NOT NULL)
- D-04: RLS `edificios` — `auth.uid() = proprietario_id`
- D-05: RLS `unidades` — JOIN com `edificios` via `proprietario_id`
- D-06: RLS `locatarios` — `auth.uid() = proprietario_id`
- D-07: RLS `contratos` — JOIN via `unidades → edificios`
- D-08: RLS `parcelas` — JOIN via `contratos → unidades → edificios`
- D-09: `criarEdificio` inclui `proprietario_id: userId`
- D-10: `convidarLocatario` inclui `proprietario_id: userId`
- D-11: função RPC `is_proprietario()` não muda
- D-12: queries de leitura não precisam de mudança explícita (RLS filtra)
- D-13: sem mudança de UI

### Claude's Discretion
- Ordem das migrations (data-primeiro vs constraint-primeiro)
- Estratégia de teste da migration em dev
- Se usar `supabase db push` ou migration file numerada

### Deferred Ideas (OUT OF SCOPE)
- Convite de Locatário associado a Proprietário específico (UI)
- UI de "trocar Proprietário" / transferência de edifício
- Dashboard unificado para todos os Proprietários
</user_constraints>

---

## 1. Estado Atual

### 1.1 Schema — edificios, locatarios, unidades

**Fonte:** `supabase/migrations/20250101000000_initial_schema.sql`

**`edificios`** — colunas atuais:
```
id, nome, endereco, created_at
```
Sem `proprietario_id`. A coluna precisa ser criada do zero.

**`locatarios`** — colunas atuais:
```
id, usuario_id, nome_razao_social, tipo, documento, email, telefone, created_at
```
Sem `proprietario_id`. A coluna precisa ser criada do zero.

Observação: `locatarios` já tem `usuario_id` (FK para `auth.users`) que identifica o próprio Locatário como usuário. `proprietario_id` será uma segunda FK diferente — identifica quem convidou/é dono desse registro.

**`unidades`** — colunas atuais:
```
id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status, created_at
```
Sem `proprietario_id`. Conforme D-05, o isolamento se dará via JOIN com `edificios`, não via coluna direta. Essa é a abordagem correta — unidades já têm `edificio_id` como FK.

**`contratos`** — sem `proprietario_id`. Isolamento via `unidade_id → unidades → edificios`.

**`parcelas`** — sem `proprietario_id`. Isolamento via `contrato_id → contratos → unidades → edificios`.

### 1.2 RLS — Políticas atuais por tabela

**Fonte:** `20250101000000_initial_schema.sql` + `20260518000000_proprietarios_rls.sql`

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `edificios` | `edificios_select_all` — `USING (true)` — **qualquer um, sem auth** | `edificios_insert_proprietario` — `is_proprietario()` | `edificios_update_proprietario` — `is_proprietario()` | `edificios_delete_proprietario` — `is_proprietario()` |
| `unidades` | `unidades_select_all` — `USING (true)` — **qualquer um, sem auth** | `unidades_insert_proprietario` — `is_proprietario()` | `unidades_update_proprietario` — `is_proprietario()` | `unidades_delete_proprietario` — `is_proprietario()` |
| `locatarios` | `locatarios_select_auth` — `TO authenticated USING (true)` — **todo autenticado vê tudo** | `locatarios_insert_proprietario` — `is_proprietario()` | `locatarios_update_proprietario` — `is_proprietario()` | `locatarios_delete_proprietario` — `is_proprietario()` |
| `contratos` | `contratos_select_auth` — `TO authenticated USING (true)` — **todo autenticado vê tudo** | `contratos_insert_proprietario` — `is_proprietario()` | `contratos_update_proprietario` — `is_proprietario()` | `contratos_delete_proprietario` — `is_proprietario()` |
| `parcelas` | `parcelas_select_auth` — `TO authenticated USING (true)` — **todo autenticado vê tudo** | `parcelas_insert_proprietario` — `is_proprietario()` | `parcelas_update_proprietario` — `is_proprietario()` | `parcelas_delete_proprietario` — `is_proprietario()` |

**Conclusão crítica:** As políticas SELECT das 5 tabelas são amplas demais — `USING (true)` ou `TO authenticated USING (true)`. Elas não isolam por proprietário. A migration de Phase 11 precisa substituir TODAS, incluindo as SELECT.

**Nomes exatos das policies a fazer DROP:**

Políticas do schema inicial (SELECT):
- `edificios_select_all` ON `edificios`
- `unidades_select_all` ON `unidades`
- `locatarios_select_auth` ON `locatarios`
- `contratos_select_auth` ON `contratos`
- `parcelas_select_auth` ON `parcelas`

Políticas da migration `20260518000000` (INSERT/UPDATE/DELETE — **o DO $$ dinâmico da migration anterior já dropou as originais e criou estas**):
- `edificios_insert_proprietario`, `edificios_update_proprietario`, `edificios_delete_proprietario`
- `unidades_insert_proprietario`, `unidades_update_proprietario`, `unidades_delete_proprietario`
- `locatarios_insert_proprietario`, `locatarios_update_proprietario`, `locatarios_delete_proprietario`
- `contratos_insert_proprietario`, `contratos_update_proprietario`, `contratos_delete_proprietario`
- `parcelas_insert_proprietario`, `parcelas_update_proprietario`, `parcelas_delete_proprietario`

Total: **20 policies** para dropar e recriar.

### 1.3 Server Actions — Payloads atuais de insert

**`criarEdificio`** (`src/actions/edificios.js`, linha 25):
```js
supabaseAdmin.from('edificios').insert({ nome: nome.trim(), endereco: endereco.trim() })
```
Precisa adicionar: `proprietario_id: user.id`

`authGuard()` já busca o `user` mas NÃO retorna `user` — só retorna `{ err }` ou `{}`. Para obter o `userId`, a função precisa ser ajustada para retornar `{ user }` também, ou o `userId` deve ser obtido separadamente dentro de `criarEdificio`.

**`convidarLocatario`** (`src/actions/locatarios.js`, linha 31-38):
```js
supabaseAdmin.from('locatarios').insert({
    usuario_id: data.user.id,
    nome_razao_social,
    email: data.user.email,
    telefone,
    documento,
    tipo
})
```
Precisa adicionar: `proprietario_id: user.id` (onde `user` é o Proprietário logado, já disponível na linha 24: `const { data: { user } } = await supabase.auth.getUser()`)

**`criarContrato`** (`src/actions/contratos.js`, linha 31-33):
```js
supabaseAdmin.from('contratos').insert({
    data_inicio, data_fim, status, observacoes, unidade_id, locatario_id
})
```
Não precisa de `proprietario_id` — contratos são isolados via JOIN `unidade_id → unidades → edificios`. O `authGuard()` já valida is_proprietario. Contudo, com a nova RLS de INSERT para contratos (via JOIN), o `supabaseAdmin` **bypassa RLS** por ser service role. A proteção de ownership em contratos na escrita deve ser feita via validação na action (verificar que `unidade_id` pertence ao Proprietário logado) — ou alterando de `supabaseAdmin` para o cliente autenticado do Proprietário.

**RISCO IMPORTANTE:** Todas as actions de mutação usam `supabaseAdmin` (service role), que bypassa RLS. Isso significa que as novas RLS de INSERT/UPDATE/DELETE não terão efeito nas actions atuais. O isolamento de escrita depende então de validação manual no código das actions — o que hoje não existe para `edificios` e `locatarios`. Com `proprietario_id` no INSERT, o dado ficará correto, mas não haverá RLS de barreira para um eventual bug. Para as reads (SELECT), o `supabaseAdmin` também bypassa — portanto `getEdificios()` via `queries-client.js` (que usa o cliente anon com a sessão do usuário) **SIM será afetado pela nova RLS SELECT**. As queries-server usam `createServer()` (cliente anon + cookies de sessão) — também respeitam RLS.

### 1.4 Queries — Pressupostos single-tenant

**`queries-client.js`:**
- `getEdificios()`, `getLocatarios()`, `getContratos()`, `getUnidades()`, `getMetricas()`: todas usam o cliente Supabase com sessão do usuário (respeita RLS). Com RLS correto, essas funções automaticamente filtrarão por `proprietario_id = auth.uid()`. Nenhuma mudança de código necessária.
- `getUnidadesDisponiveis()`: usada na página pública. A policy SELECT atual de `unidades` é `USING (true)` (pública). A nova policy de `unidades` via JOIN com `edificios` deve permitir que anon/público leia unidades disponíveis? **Este é um gap potencial:** se a nova RLS de SELECT de `unidades` exigir `auth.uid()`, a página pública de unidades disponíveis quebrará.

**`queries-server.js`:**
- Mesmas funções espelhadas — comportamento idêntico, mesmo risco.
- `getUnidadesDisponiveis()` em queries-server.js também existe e é usada em páginas públicas.

---

## 2. Mudanças Necessárias

### 2.1 Arquivo de migration

**Nome:** `20260521000000_multi_tenant_proprietario_id.sql`

(Timestamp seguinte após `20260520100000_locatarios_status_convite.sql` — incrementar o dia para 21)

**Estratégia de 3 passos (safe migration com dados existentes):**

```sql
-- PASSO 1: ADD COLUMN nullable (sem quebrar rows existentes)
ALTER TABLE public.edificios
  ADD COLUMN IF NOT EXISTS proprietario_id uuid REFERENCES auth.users(id);

ALTER TABLE public.locatarios
  ADD COLUMN IF NOT EXISTS proprietario_id uuid REFERENCES auth.users(id);

-- PASSO 2: UPDATE rows existentes com o userId do Proprietário seed
-- Busca o usuario_id do primeiro (e atualmente único) Proprietário
UPDATE public.edificios
SET proprietario_id = (SELECT usuario_id FROM public.proprietarios LIMIT 1)
WHERE proprietario_id IS NULL;

UPDATE public.locatarios
SET proprietario_id = (SELECT usuario_id FROM public.proprietarios LIMIT 1)
WHERE proprietario_id IS NULL;

-- PASSO 3: SET NOT NULL (só seguro após UPDATE garantir nenhum NULL)
ALTER TABLE public.edificios
  ALTER COLUMN proprietario_id SET NOT NULL;

ALTER TABLE public.locatarios
  ALTER COLUMN proprietario_id SET NOT NULL;
```

**Observação sobre rollback:** Para reverter, um segundo migration com `ALTER TABLE edificios DROP COLUMN proprietario_id` é suficiente. Não há dados que dependem desta coluna externamente.

### 2.2 RLS — Policies a dropar e recriar

> **⚠ GAP DE PESQUISA (corrigido no planning, 2026-06-08):** O SQL abaixo escreve as policies
> de `unidades`, `contratos` e `parcelas` com `EXISTS` inline cross-table. Como `unidades` referencia
> `contratos` e `contratos` referencia `unidades`, isso forma um ciclo que Postgres detecta como
> `infinite recursion detected in policy` em tempo de query (RLS é aplicada dentro de subqueries de
> policies). A migration NÃO deve usar EXISTS inline para esses checks — usar funções `SECURITY DEFINER`
> (mesmo padrão de `is_proprietario()`) que bypassam RLS nas tabelas internas e quebram o ciclo.
> Ver 11-01-PLAN.md Task 2 sub-passo A para a lista de funções. O SQL abaixo permanece como referência
> da LÓGICA de cada check, não da forma de implementação.


#### DROP de todas as 20 policies existentes

```sql
-- SELECT policies (schema inicial)
DROP POLICY IF EXISTS "edificios_select_all"    ON public.edificios;
DROP POLICY IF EXISTS "unidades_select_all"     ON public.unidades;
DROP POLICY IF EXISTS "locatarios_select_auth"  ON public.locatarios;
DROP POLICY IF EXISTS "contratos_select_auth"   ON public.contratos;
DROP POLICY IF EXISTS "parcelas_select_auth"    ON public.parcelas;

-- INSERT/UPDATE/DELETE policies (migration 20260518)
DROP POLICY IF EXISTS "edificios_insert_proprietario"  ON public.edificios;
DROP POLICY IF EXISTS "edificios_update_proprietario"  ON public.edificios;
DROP POLICY IF EXISTS "edificios_delete_proprietario"  ON public.edificios;

DROP POLICY IF EXISTS "unidades_insert_proprietario"   ON public.unidades;
DROP POLICY IF EXISTS "unidades_update_proprietario"   ON public.unidades;
DROP POLICY IF EXISTS "unidades_delete_proprietario"   ON public.unidades;

DROP POLICY IF EXISTS "locatarios_insert_proprietario" ON public.locatarios;
DROP POLICY IF EXISTS "locatarios_update_proprietario" ON public.locatarios;
DROP POLICY IF EXISTS "locatarios_delete_proprietario" ON public.locatarios;

DROP POLICY IF EXISTS "contratos_insert_proprietario"  ON public.contratos;
DROP POLICY IF EXISTS "contratos_update_proprietario"  ON public.contratos;
DROP POLICY IF EXISTS "contratos_delete_proprietario"  ON public.contratos;

DROP POLICY IF EXISTS "parcelas_insert_proprietario"   ON public.parcelas;
DROP POLICY IF EXISTS "parcelas_update_proprietario"   ON public.parcelas;
DROP POLICY IF EXISTS "parcelas_delete_proprietario"   ON public.parcelas;
```

#### CREATE das novas policies por tabela

**edificios** — acesso direto via `proprietario_id`:
```sql
CREATE POLICY "edificios_select_proprietario" ON public.edificios
  FOR SELECT TO authenticated USING (auth.uid() = proprietario_id);

CREATE POLICY "edificios_insert_proprietario" ON public.edificios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = proprietario_id);

CREATE POLICY "edificios_update_proprietario" ON public.edificios
  FOR UPDATE TO authenticated USING (auth.uid() = proprietario_id);

CREATE POLICY "edificios_delete_proprietario" ON public.edificios
  FOR DELETE TO authenticated USING (auth.uid() = proprietario_id);
```

**unidades** — via JOIN com edificios:
```sql
CREATE POLICY "unidades_select_proprietario" ON public.unidades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.edificios e
      WHERE e.id = edificio_id AND e.proprietario_id = auth.uid()
    )
    OR auth.uid() IS NULL  -- permite acesso anon para página pública
  );

CREATE POLICY "unidades_insert_proprietario" ON public.unidades
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.edificios e
      WHERE e.id = edificio_id AND e.proprietario_id = auth.uid()
    )
  );

CREATE POLICY "unidades_update_proprietario" ON public.unidades
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.edificios e
      WHERE e.id = edificio_id AND e.proprietario_id = auth.uid()
    )
  );

CREATE POLICY "unidades_delete_proprietario" ON public.unidades
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.edificios e
      WHERE e.id = edificio_id AND e.proprietario_id = auth.uid()
    )
  );
```

**ATENÇÃO — gap de unidades públicas:** A página pública `/unidades` usa `getUnidadesDisponiveis()` com o cliente anon (sem sessão). Se SELECT de unidades exigir `auth.uid()`, a página pública quebra. A solução é manter uma policy SELECT pública para `status = 'disponivel'` separada, ou usar `USING (true)` para SELECT mas isso volta ao problema original. **Decisão necessária:** A policy SELECT de `unidades` deve ser dividida em:
- Acesso público (anon): apenas `status = 'disponivel'`
- Acesso autenticado: todas as próprias unidades

Sugestão de SQL:
```sql
-- Público: apenas unidades disponíveis (para página /unidades)
CREATE POLICY "unidades_select_public" ON public.unidades
  FOR SELECT TO anon USING (status = 'disponivel');

-- Proprietário: todas as suas unidades
CREATE POLICY "unidades_select_proprietario" ON public.unidades
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.edificios e
      WHERE e.id = edificio_id AND e.proprietario_id = auth.uid()
    )
  );
```

**locatarios** — acesso direto via `proprietario_id`:
```sql
CREATE POLICY "locatarios_select_proprietario" ON public.locatarios
  FOR SELECT TO authenticated USING (auth.uid() = proprietario_id);

CREATE POLICY "locatarios_insert_proprietario" ON public.locatarios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = proprietario_id);

CREATE POLICY "locatarios_update_proprietario" ON public.locatarios
  FOR UPDATE TO authenticated USING (auth.uid() = proprietario_id);

CREATE POLICY "locatarios_delete_proprietario" ON public.locatarios
  FOR DELETE TO authenticated USING (auth.uid() = proprietario_id);
```

**ATENÇÃO — portal do Locatário:** `getLocatarioByUserId()` em `queries-client.js` (linha 86) é usada pelo portal do Locatário para buscar os próprios dados. Com a nova policy `auth.uid() = proprietario_id`, o Locatário logado não consegue ler seu próprio registro — pois `auth.uid()` é o Locatário, não o Proprietário. Solução: adicionar uma segunda policy SELECT para o próprio Locatário:
```sql
CREATE POLICY "locatarios_select_proprio" ON public.locatarios
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);
```

**contratos** — via JOIN unidades → edificios:
```sql
CREATE POLICY "contratos_select_proprietario" ON public.contratos
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.unidades u
      JOIN public.edificios e ON e.id = u.edificio_id
      WHERE u.id = unidade_id AND e.proprietario_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.locatarios l
      WHERE l.id = locatario_id AND l.usuario_id = auth.uid()
    )
  );

CREATE POLICY "contratos_insert_proprietario" ON public.contratos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.unidades u
      JOIN public.edificios e ON e.id = u.edificio_id
      WHERE u.id = unidade_id AND e.proprietario_id = auth.uid()
    )
  );

CREATE POLICY "contratos_update_proprietario" ON public.contratos
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.unidades u
      JOIN public.edificios e ON e.id = u.edificio_id
      WHERE u.id = unidade_id AND e.proprietario_id = auth.uid()
    )
  );

CREATE POLICY "contratos_delete_proprietario" ON public.contratos
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.unidades u
      JOIN public.edificios e ON e.id = u.edificio_id
      WHERE u.id = unidade_id AND e.proprietario_id = auth.uid()
    )
  );
```

**Nota:** A policy SELECT de `contratos` inclui o caso do portal do Locatário — o Locatário logado precisa ver seus próprios contratos (`getContratosByLocatario`, `getContratoAtivoByLocatario`).

**parcelas** — via JOIN contratos → unidades → edificios:
```sql
CREATE POLICY "parcelas_select_proprietario" ON public.parcelas
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.contratos c
      JOIN public.unidades u ON u.id = c.unidade_id
      JOIN public.edificios e ON e.id = u.edificio_id
      WHERE c.id = contrato_id AND e.proprietario_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.contratos c
      JOIN public.locatarios l ON l.id = c.locatario_id
      WHERE c.id = contrato_id AND l.usuario_id = auth.uid()
    )
  );

CREATE POLICY "parcelas_insert_proprietario" ON public.parcelas
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contratos c
      JOIN public.unidades u ON u.id = c.unidade_id
      JOIN public.edificios e ON e.id = u.edificio_id
      WHERE c.id = contrato_id AND e.proprietario_id = auth.uid()
    )
  );

CREATE POLICY "parcelas_update_proprietario" ON public.parcelas
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.contratos c
      JOIN public.unidades u ON u.id = c.unidade_id
      JOIN public.edificios e ON e.id = u.edificio_id
      WHERE c.id = contrato_id AND e.proprietario_id = auth.uid()
    )
  );

CREATE POLICY "parcelas_delete_proprietario" ON public.parcelas
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.contratos c
      JOIN public.unidades u ON u.id = c.unidade_id
      JOIN public.edificios e ON e.id = u.edificio_id
      WHERE c.id = contrato_id AND e.proprietario_id = auth.uid()
    )
  );
```

**Nota:** A policy SELECT de `parcelas` inclui o caso do portal do Locatário (`getParcelasPortal`, `getParcelasByContrato`).

### 2.3 Mudanças nas Server Actions

#### `src/actions/edificios.js` — criarEdificio

**Problema atual:** `authGuard()` retorna `{}` ou `{ err }` — não expõe `user`.

**Mudança 1:** Modificar `authGuard()` para retornar `user`:
```js
async function authGuard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { err: { status: 401, erroMessage: 'Não autenticado.' } }
  if (!await isProprietario(supabase)) return { err: { status: 403, erroMessage: 'Sem permissão.' } }
  return { user }  // <-- adicionar user no retorno
}
```

**Mudança 2:** Usar `user.id` no insert de `criarEdificio`:
```js
export async function criarEdificio(form) {
  const { err, user } = await authGuard()
  if (err) return err
  const { nome, endereco } = form
  if (!nome?.trim()) return { status: 400, erroMessage: 'Nome é obrigatório.' }
  if (!endereco?.trim()) return { status: 400, erroMessage: 'Endereço é obrigatório.' }
  const { error } = await supabaseAdmin.from('edificios').insert({
    nome: nome.trim(),
    endereco: endereco.trim(),
    proprietario_id: user.id  // <-- adicionar
  })
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

**Observação:** `editarEdificio` e `deletarEdificio` usam `supabaseAdmin` que bypassa RLS — não precisam de mudança no código para garantir isolamento, pois não há filtro de ownership na query. **Risco residual:** um bug no código poderia editar/deletar edifício de outro Proprietário. Para segurança máxima, seria ideal adicionar `.eq('proprietario_id', user.id)` nessas queries, mas isso não está no escopo das decisões D-01..D-13.

#### `src/actions/locatarios.js` — convidarLocatario

O `user` já está disponível na linha 24 (`const { data: { user } } = await supabase.auth.getUser()`).

**Mudança:** Adicionar `proprietario_id: user.id` no insert:
```js
const { error: errorInsert } = await supabaseAdmin.from('locatarios')
  .insert({
    usuario_id: data.user.id,
    nome_razao_social,
    email: data.user.email,
    telefone,
    documento,
    tipo,
    proprietario_id: user.id  // <-- adicionar
  })
```

#### `src/actions/contratos.js` — Nenhuma mudança necessária

`criarContrato` insere `{ data_inicio, data_fim, status, observacoes, unidade_id, locatario_id }` — sem `proprietario_id` (correto conforme D-07). A cadeia de JOIN `unidade_id → unidades → edificios` garante o isolamento via RLS para operações com cliente autenticado.

---

## 3. Riscos e Ordem de Execução

### 3.1 Risco principal: supabaseAdmin bypassa RLS

Todas as Server Actions usam `supabaseAdmin` (service role) para writes. Isso significa que as novas RLS de INSERT/UPDATE/DELETE **não têm efeito nas mutations**. O isolamento nas writes depende inteiramente de incluir `proprietario_id: user.id` no payload (para edificios e locatarios).

Para reads no dashboard, as queries usam `createServer()` ou `createClient()` (anon com sessão do usuário) — **essas SIM respeitam RLS**. Ou seja, após a migration, o SELECT ficará isolado automaticamente.

### 3.2 Risco: página pública quebra com nova RLS de unidades

A policy SELECT atual de `unidades` é `USING (true)` (pública). Se substituída por policy `TO authenticated`, a rota `/unidades` (página pública acessada por visitantes sem login) retornará 0 resultados.

**Mitigação:** A migration deve criar duas policies SELECT para `unidades` — uma para `anon` com `USING (status = 'disponivel')` e outra para `authenticated` com o JOIN de `proprietario_id`.

### 3.3 Risco: portal do Locatário quebra

`getLocatarioByUserId()`, `getContratoAtivoByLocatario()`, `getContratosByLocatario()`, `getParcelasPortal()` — todas usadas pelo portal do Locatário. Com novas RLS restritivas ao Proprietário, o Locatário logado não veria seus próprios dados.

**Mitigação:** Policies SELECT de `locatarios`, `contratos` e `parcelas` devem incluir OR para o próprio Locatário (via `usuario_id = auth.uid()` ou JOIN com locatarios).

### 3.4 Risco: lifecyle cron job (pg_cron) bypassa RLS

A migration `20260520000000_lifecycle_automation.sql` instala jobs de `pg_cron` que fazem `UPDATE parcelas` e `UPDATE contratos/unidades` diretamente. Esses jobs rodam como `postgres` superuser — **não são afetados pelas novas RLS**. Nenhuma ação necessária, mas é importante saber que o cron continua funcionando independentemente.

### 3.5 Risco: `edificios_select_all` é pública (anon)

A policy atual `edificios_select_all` usa `USING (true)` sem restrição de role — qualquer pessoa (incluindo anon) consegue listar todos os edifícios. Após a migration, `edificios_select_proprietario` deve ser `TO authenticated` para que visitantes não vejam edifícios de outros Proprietários.

Contudo: o dashboard de edifícios não é acessível a anon (auth guard no layout). Não há página pública que liste edifícios. Logo, mudar SELECT para `authenticated` não quebra nada existente.

### 3.6 Ordem de execução recomendada

```
1. Aplicar migration (ADD COLUMN → UPDATE seed → SET NOT NULL → DROP policies → CREATE policies)
2. Testar schema no Supabase (verificar que proprietario_id existe nas rows existentes)
3. Atualizar src/actions/edificios.js (authGuard + criarEdificio)
4. Atualizar src/actions/locatarios.js (convidarLocatario)
5. Testar isolamento com 2 usuários Proprietários distintos
6. Verificar página pública /unidades ainda funciona (anon)
7. Verificar portal do Locatário ainda funciona
```

A migration deve ser **atômica** — tudo num único arquivo SQL rodando em transaction. Se o Supabase não garantir transação implícita em migrations, envolver em `BEGIN; ... COMMIT;`.

---

## 4. Arquitetura de Validação

### 4.1 Critérios de aceitação (verificação manual)

| Cenário | Expectativa | Como testar |
|---------|-------------|-------------|
| Proprietário A cria edifício | Edifício criado com `proprietario_id = A` | SELECT no Supabase Studio |
| Proprietário A faz login | Vê apenas seus edifícios/unidades/contratos | Dashboard normal |
| Proprietário B faz login | NÃO vê dados de A | Cadastrar segundo Proprietário via `/signup` |
| Visitante anon acessa `/unidades` | Vê unidades disponíveis (de todos os Proprietários) | Browser sem login |
| Locatário logado acessa portal | Vê seu contrato e parcelas | Login com conta Locatário |
| Locatário NÃO vê dashboard Proprietário | Redirecionado para `/portal` | is_proprietario() retorna false |

### 4.2 Testes Playwright (fase manual — sem automação nova)

Os testes E2E existentes (Playwright) devem continuar passando. Verificar:
- `npx playwright test` não quebra fluxos existentes após migration
- Especialmente: fluxo de criação de contrato (depende de edificio + locatario existentes)

### 4.3 Verificação de isolamento no banco

Query de diagnóstico para confirmar migration correta:
```sql
-- Verificar que nenhum edificio ficou sem proprietario_id
SELECT COUNT(*) FROM edificios WHERE proprietario_id IS NULL;  -- deve ser 0

-- Verificar que nenhum locatario ficou sem proprietario_id
SELECT COUNT(*) FROM locatarios WHERE proprietario_id IS NULL;  -- deve ser 0

-- Verificar que o proprietario de seed recebeu os dados
SELECT p.usuario_id, COUNT(e.id) as edificios, COUNT(l.id) as locatarios
FROM proprietarios p
LEFT JOIN edificios e ON e.proprietario_id = p.usuario_id
LEFT JOIN locatarios l ON l.proprietario_id = p.usuario_id
GROUP BY p.usuario_id;
```

---

## 5. Lacunas que o Planner deve Resolver

1. **Policy SELECT de `unidades` para anon vs autenticado:** A decisão D-05 diz "via JOIN com edificios" mas não menciona a página pública. O planner deve incluir a policy `anon` separada (ou confirmar com o usuário que `/unidades` ficará restrita a autenticados — improvável).

2. **Policy SELECT de `locatarios` para o próprio Locatário:** D-06 diz `auth.uid() = proprietario_id` mas o portal do Locatário precisa que o Locatário leia seu próprio registro. O planner deve incluir policy `locatarios_select_proprio` adicional.

3. **Policy SELECT de `contratos` e `parcelas` para o portal:** Mesma questão — as queries do portal do Locatário precisam de acesso via `locatario_id → usuario_id = auth.uid()`.

4. **`editarEdificio` / `deletarEdificio`:** Não adicionam filtro de `proprietario_id` na query. Com `supabaseAdmin`, um bug poderia editar dados de outro Proprietário. O planner decide se adiciona `.eq('proprietario_id', user.id)` como hardening adicional.

---

## 6. Fontes

Todos os dados são do codebase local — confiança HIGH.

| Arquivo | O que foi verificado |
|---------|---------------------|
| `supabase/migrations/20250101000000_initial_schema.sql` | Schema atual, policies SELECT originais |
| `supabase/migrations/20260518000000_proprietarios_rls.sql` | Policies INSERT/UPDATE/DELETE atuais, nomes exatos |
| `src/actions/edificios.js` | Payload atual de insert, authGuard pattern |
| `src/actions/locatarios.js` | Payload atual de insert, user já disponível |
| `src/actions/contratos.js` | Confirmação que contratos não precisam de proprietario_id |
| `src/lib/queries-client.js` | Queries que usarão RLS automaticamente; gap de getUnidadesDisponiveis |
| `src/lib/queries-server.js` | Idem, espelho server-side |
| `.planning/phases/11-multi-tenant-proprietarios/11-CONTEXT.md` | Decisions D-01..D-13 |
| `.planning/multi-tenant-scope-change.md` | Contexto e esforço estimado |
