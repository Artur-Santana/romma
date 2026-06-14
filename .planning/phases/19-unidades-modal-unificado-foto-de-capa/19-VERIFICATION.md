---
phase: 19-unidades-modal-unificado-foto-de-capa
verified: 2026-06-14T23:30:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Fluxo de criação com upload real de foto"
    expected: "Modal abre, usuário arrasta/seleciona imagem JPEG/PNG <2MB, preview aparece, clicar 'Criar Unidade' cria a unidade, faz upload para {unidade_id}/{uuid}.ext no bucket 'unidades-fotos', e foto aparece no card da grade após salvar"
    why_human: "Requer servidor Supabase + bucket 'unidades-fotos' em execução; upload binário via supabase-browser não pode ser verificado com grep"
  - test: "Fluxo de edição com troca de foto"
    expected: "Clicar 'Editar' num card com foto abre o modal com preview via signed URL; selecionar nova foto, salvar — caminho antigo deve ser substituído e novo path salvo via editarUnidade; preview no card atualizado"
    why_human: "Requer signed URL válida do Storage e leitura do bucket real"
  - test: "Remoção de unidade com foto — limpeza do Storage"
    expected: "Clicar 'Remover' abre ConfirmDialog; confirmar executa cleanup client-side no Storage (best-effort) e depois deletarUnidade; Server Action também executa cleanup; foto não deve reaparecer em listagens"
    why_human: "Verificar que a remoção do arquivo no Storage ocorreu de fato exige acesso ao bucket"
  - test: "Validação de MIME e tamanho no upload"
    expected: "Tentar enviar arquivo não-imagem (ex: .pdf) exibe 'Apenas imagens são aceitas.'; arquivo >2MB exibe 'Arquivo deve ter menos de 2MB.'; arquivo válido exibe preview normalmente"
    why_human: "Requer interação com o browser para acionar o input file"
  - test: "Busca ao vivo e filtros"
    expected: "Digitar no campo 'Buscar unidade...' filtra cards instantaneamente; botões Todos/Disponível/Alugada alteram a grade em tempo real; select de edifício combina com filtro de status; contador 'N resultado(s)' aparece somente quando filtro ativo"
    why_human: "Comportamento reativo ao vivo requer execução no browser"
  - test: "Barra de métricas — dados reais"
    expected: "Área total, MRR realizado, Potencial em aberto (dourado) e Valores ocultos refletem os dados reais do banco; 'Potencial em aberto' exibe valor em var(--highlight) amarelo/dourado"
    why_human: "Exige dados reais no banco para confirmar que a derivação client-side está correta (não hardcoded)"
---

# Phase 19: Unidades — Modal Unificado & Foto de Capa — Verification Report

**Phase Goal:** O Proprietário gerencia Unidades numa grade de cards com métricas-resumo, busca e filtros, criando/editando por um único modal unificado (UnifiedUnidadeModal) que inclui upload de foto de capa persistida no Storage privado. Remoção exige confirmação e limpa foto órfã.
**Verified:** 2026-06-14T23:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Barra de métricas-resumo (área total m², MRR realizado, potencial em aberto em dourado, contagem de valores ocultos) | ✓ VERIFIED | `Unidades.js` linhas 115–122: `totalM2`, `mrrRealizado`, `potencialEmAberto`, `valoresOcultos` derivados do array completo. Células na grade 4×1 (linhas 199–221): `gold: true` em "Potencial em aberto" usa `color: m.gold ? "var(--highlight)" : ...` (linhas 235/243). `--highlight` definido em `globals.css` como `oklch(0.7245 0.0998 82.35)` (tom dourado). |
| 2 | Busca por nome + filtros por status (todos/disponível/alugada) e por edifício, ao vivo | ✓ VERIFIED | `Unidades.js` linhas 127–132: `filtered` derivado de `query`, `fStatus`, `fEd` por JS puro sem debounce. Input `placeholder="Buscar unidade..."` (linha 268). Toggles Todos/Disponível/Alugada (linhas 280–299). `FSelect` de edifício (linhas 304–309). Contador `{filtered.length} resultado(s)` só quando `filterActive` (linhas 312–316). |
| 3 | Criar e editar unidade pelo mesmo modal unificado (edifício, nome, área, valor mensal, status, descrição, checkbox "exibir valor publicamente") | ✓ VERIFIED | `UnifiedUnidadeModal.js` exporta default com prop `mode` (`"create"` / `"edit"`). Campos presentes: `FSelect` de edifício (linhas 405–413), `FInput nome` placeholder "Ex: Sala 1208" (linha 418), `area_m2` (linha 428), `valor_mensal` (linha 436), `FSelect status` (linhas 443–448), `descricao` (linha 453), `FormCheck valor_visivel` (linhas 463–465). `handleSubmit` diferencia `mode === "create"` vs edit. Botão submit varia: "Criar Unidade" / "Salvar Alterações" (linha 501). |
| 4 | Foto de capa: arrastar/clicar → preview, "usar foto de exemplo", trocar/remover; upload no bucket privado via supabase-browser; URL em unidades.foto_url; Server Action grava só a string; cadeia de propriedade por edificio.proprietario_id; validação MIME image/* e <2MB; path {unidade_id}/{uuid}.{ext} | ✓ VERIFIED | Veja análise detalhada abaixo. |
| 5 | Remover exige ConfirmDialog; foto órfã removida do Storage antes do delete no banco (best-effort, não bloqueia) | ✓ VERIFIED | `Unidades.js` linha 9: `import ConfirmDialog`. Linha 370: `<ConfirmDialog open={confirmDelete !== null} ... danger={true}>`. Linha 377: `onConfirm={() => { handleDeletarUnidade(confirmDelete); setConfirmDelete(null) }}`. `handleDeletarUnidade` (linhas 137–159): cleanup client-side com `.catch(() => {})` antes de `deletarUnidade`. Server Action `deletarUnidade` (linhas 84–88): segundo cleanup `.catch(() => {})`, non-blocking. |

**Score:** 5/5 truths verified

---

### Truth 4 — Análise Detalhada (Foto de Capa)

**Arrastar/clicar → preview:** `CoverPhotoField` (linhas 111–244): `onDrop` → `handleFileSelect`; `onClick → inputRef.current?.click()`. Preview via `URL.createObjectURL(file)`.

**"Usar foto de exemplo":** `handleUsarExemplo` (linhas 134–141): revoga blob anterior, seta `fileToUpload(null)`, `setPreview("/images/unidade-exemplo.jpg")`. Asset em `/home/artursantana/Code/romma/public/images/unidade-exemplo.jpg` (33.7 KB JPEG confirmado).

**Trocar/Remover:** Botões presentes no bloco `{preview ? ...}` (linhas 181–206). Trocar dispara `inputRef.current?.click()`. Remover chama `handleRemover` com revogação do object URL.

**Upload via supabase-browser:** `handleSubmit` (create mode, linha 317): `const supabase = createClient()` (import de `@/lib/supabase-browser`); `supabase.storage.from("unidades-fotos").upload(path, fileToUpload, { contentType: fileToUpload.type })`. Server Action nunca recebe o binário — recebe apenas a path string.

**URL em unidades.foto_url — Server Action grava só string:** `editarUnidade` chamado com `{ foto_url: fotoPath }` (linha 329) onde `fotoPath = data.path` (retorno do upload). `editarUnidade` (linhas 63): `if (foto_url !== undefined) patch.foto_url = foto_url` — grava só a string.

**Cadeia de propriedade via edificio.proprietario_id:** `criarUnidade` (linha 30): `.eq('proprietario_id', user.id)`. `editarUnidade` (linha 53): `.eq('proprietario_id', user.id)`. `deletarUnidade` (linha 81): `.eq('proprietario_id', user.id)`.

**Validação MIME e tamanho:** Linhas 117–123: `file.type.startsWith("image/")` e `file.size > 2 * 1024 * 1024`.

**Path {unidade_id}/{uuid}.{ext}:** Create mode linha 319: `` `${unidadeId}/${crypto.randomUUID()}.${ext}` ``. Edit mode linha 337: `` `${initial.id}/${crypto.randomUUID()}.${ext}` ``. Segmento[0] = `unidade_id` conforme requisito RLS `storage_unidade_owned_by_auth`.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/actions/unidades.js` | Server Actions com foto_url, return id, Storage cleanup | ✓ VERIFIED | 94 linhas, funcional. `criarUnidade` retorna `{ status: 200, id: data.id }`. `editarUnidade` patch condicional `foto_url`. `deletarUnidade` cleanup best-effort. |
| `src/lib/queries-client.js` | `getUnidades` inclui `foto_url` no SELECT | ✓ VERIFIED | Linha 6: `select('id, edificio_id, nome, descricao, area_m2, valor_mensal, valor_visivel, status, foto_url')` |
| `src/components/ui/UnifiedUnidadeModal.js` | Modal unificado criar/editar com CoverPhotoField e upload | ✓ VERIFIED | 508 linhas, self-contained. Todos os campos requeridos presentes. 3-step upload flow implementado. |
| `src/components/ui/UnidadeCard.js` | Card Variante B com signed URL cover photo | ✓ VERIFIED | 173 linhas. `useFotoSignedUrl` hook com short-circuit para paths `/`. `StatusBadge`, micro-actions Editar/Remover. |
| `src/components/features/Unidades.js` | Grade de cards com métricas, filtros, modal e ConfirmDialog | ✓ VERIFIED | 382 linhas. Barra 4-células, filtros ao vivo, `UnifiedUnidadeModal` wired, `ConfirmDialog` com `danger=true`. |
| `public/images/unidade-exemplo.jpg` | Asset estático JPEG para "usar foto de exemplo" | ✓ VERIFIED | 33.7 KB presente em `/public/images/unidade-exemplo.jpg` |
| `e2e/crud-unidades.spec.js` | Specs E2E cobrindo UNID-01/02/05 + modal flow | ✓ VERIFIED | 7 testes listáveis (Wave-0 RED scaffold). Selectors: `.romma-modal-backdrop`, `Buscar unidade...`, `Remover unidade?`, `Área total`. |
| `e2e/toast-unidades.spec.js` | Spec E2E delete via ConfirmDialog + toast | ✓ VERIFIED | Contém `Remover Unidade` e `Unidade removida` com step de ConfirmDialog. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Unidades.js` | `UnifiedUnidadeModal` | import + `modal && <UnifiedUnidadeModal>` | ✓ WIRED | Linha 8: import. Linha 359: renderizado condicionalmente. `onSaved`: `carregarDados(); setModal(null)` |
| `Unidades.js` | `ConfirmDialog` | import + `<ConfirmDialog open={confirmDelete !== null}>` | ✓ WIRED | Linha 9: import. Linha 370: componente renderizado. `onConfirm` chama `handleDeletarUnidade`. |
| `Unidades.js` | `deletarUnidade` (Server Action) | import + call em `handleDeletarUnidade` | ✓ WIRED | Linha 10: import. Linha 148: `const result = await deletarUnidade(unidade.id)`. |
| `UnifiedUnidadeModal.js` | `criarUnidade` + `editarUnidade` | import + calls em `handleSubmit` | ✓ WIRED | Linha 6: imports. Linhas 310/329/344: chamadas em fluxos create/edit. |
| `UnifiedUnidadeModal.js` | Storage `unidades-fotos` | `supabase.storage.from("unidades-fotos").upload(...)` | ✓ WIRED | Linhas 318–324 (create), 336–342 (edit). Upload com `contentType: fileToUpload.type`. |
| `UnidadeCard.js` | Storage `unidades-fotos` | `useFotoSignedUrl` → `createSignedUrl` | ✓ WIRED | Linhas 18–23: `supabase.storage.from("unidades-fotos").createSignedUrl(fotoUrl, 3600)`. |
| `getUnidades` query | `foto_url` column | SELECT string | ✓ WIRED | `queries-client.js` linha 6. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `Unidades.js` | `unidades` | `getUnidades()` → Supabase `unidades` table | Sim — query real com SELECT | ✓ FLOWING |
| `Unidades.js` | `listaEdificios` | `getEdificios()` → Supabase `edificios` table | Sim — query real | ✓ FLOWING |
| `Unidades.js` | `totalM2`, `mrrRealizado`, `potencialEmAberto`, `valoresOcultos` | Derivados de `unidades` via `reduce`/`filter` | Sim — derivação de dados reais | ✓ FLOWING |
| `UnidadeCard.js` | `fotoResolvida` | `useFotoSignedUrl` → `createSignedUrl` ou path estático | Sim — signed URL real ou path `/images/...` | ✓ FLOWING |
| `UnifiedUnidadeModal.js` | `preview` (edit mode) | `createSignedUrl(initial.foto_url, 3600)` em `useEffect` | Sim — signed URL do Storage real | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| UnifiedUnidadeModal exporta default | `grep -n "export default function UnifiedUnidadeModal" src/components/ui/UnifiedUnidadeModal.js` | Linha 247: encontrado | ✓ PASS |
| criarUnidade retorna id | `grep "return { status: 200, id: data.id }" src/actions/unidades.js` | Linha 39: encontrado | ✓ PASS |
| Path Storage formato correto | `grep "randomUUID" src/components/ui/UnifiedUnidadeModal.js` | Linhas 319/337: `${unidadeId}/${crypto.randomUUID()}.${ext}` | ✓ PASS |
| Validação MIME implementada | `grep "file.type.startsWith" src/components/ui/UnifiedUnidadeModal.js` | Linha 117: `startsWith("image/")` | ✓ PASS |
| Cleanup best-effort non-blocking | `grep ".catch(() => {})" src/actions/unidades.js` | Linha 88: `.catch(() => {})` | ✓ PASS |
| --highlight definido em globals.css | `grep -n "color-highlight" src/app/globals.css` | Linha 13: `oklch(0.7245 0.0998 82.35)` (dourado/âmbar) | ✓ PASS |

---

### Probe Execution

Step 7c: SKIPPED — fase não declara probe scripts; `scripts/*/tests/probe-*.sh` não encontrados. Verificação estrutural via grep é suficiente para os artefatos desta fase.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| UNID-01 | 19-03, 19-04 | Barra de métricas-resumo (4 células) | ✓ SATISFIED | `Unidades.js` linhas 114–250: barra 4×1 com `totalM2`, `mrrRealizado`, `potencialEmAberto` (gold), `valoresOcultos` |
| UNID-02 | 19-04 | Busca por nome + filtros status/edifício ao vivo | ✓ SATISFIED | `Unidades.js` linhas 86–89/127–132/252–316: estados `query`, `fStatus`, `fEd`; filtragem JS pura; contador condicional |
| UNID-03 | 19-03 | Modal unificado criar/editar (todos os campos) | ✓ SATISFIED | `UnifiedUnidadeModal.js`: campos edificio_id, nome, area_m2, valor_mensal, status, descricao, valor_visivel |
| UNID-04 | 19-03 | Foto de capa: drag-drop, exemplo, upload Storage, signed URL, validações | ✓ SATISFIED | `CoverPhotoField` inline; upload 3-step; `createSignedUrl` em edit mode; MIME + size validation |
| UNID-05 | 19-04 | Remover com ConfirmDialog + limpeza Storage best-effort | ✓ SATISFIED | `ConfirmDialog` com `danger=true`; `handleDeletarUnidade` com `.catch(() => {})`; Server Action com cleanup idêntico |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/ui/UnifiedUnidadeModal.js` | 293–299 | `useEffect cleanup` com `[preview]` dep — revoga URL em cada mudança de preview, não apenas unmount | ℹ️ Info | Correto por design (revogar URL anterior em troca de foto); pode causar warning de ESLint `exhaustive-deps` — confirmado intencional pela decisão em 19-03-SUMMARY.md |
| `src/components/features/Unidades.js` + `src/actions/unidades.js` | 140–145 / 84–88 | Duplo cleanup do Storage no delete (client + server-action) | ℹ️ Info | O cliente tenta remover antes de chamar Server Action; Server Action também tenta. Ambos usam `.catch(() => {})`. Cleanup idempotente (remover path inexistente não é erro fatal no Supabase Storage). Sem impacto funcional negativo. |

Nenhum marcador `TBD`, `FIXME`, `XXX` encontrado nos arquivos modificados nesta fase.

---

### Human Verification Required

#### 1. Fluxo Criar Unidade com Upload de Foto

**Test:** Acessar o dashboard, clicar em "Nova Unidade", preencher todos os campos, selecionar ou arrastar uma imagem válida (<2MB, JPEG ou PNG), verificar preview, clicar "Criar Unidade".
**Expected:** Unidade criada com sucesso; foto aparece no card da grade; path no Storage é `{unidade_id}/{uuid}.{ext}` (verificável no Supabase Storage console).
**Why human:** Requer servidor dev rodando + bucket `unidades-fotos` com RLS `storage_unidade_owned_by_auth`; fluxo de upload binário não é verificável por análise estática.

#### 2. Fluxo Editar Unidade com Foto Existente

**Test:** Clicar "Editar" num card que já possui foto; verificar que o modal abre com preview (signed URL); selecionar nova foto; salvar; verificar que o card exibe nova foto.
**Expected:** Preview carregado via signed URL válida (1h); nova foto substituída no Storage e `foto_url` atualizado no banco.
**Why human:** Depende de dado real no Storage e resolução de signed URL pelo Supabase.

#### 3. Remoção com Foto — Limpeza do Storage

**Test:** Clicar "Remover" num card com foto; confirmar no ConfirmDialog; verificar no Supabase Storage console que o arquivo foi removido; verificar que a unidade sumiu da grade.
**Expected:** Arquivo removido do bucket `unidades-fotos`; registro deletado do banco; card desaparece com animação de 220ms.
**Why human:** Verificar remoção real no bucket requer acesso ao Supabase console ou Storage API.

#### 4. Validações de Arquivo no Upload

**Test:** Tentar enviar um `.pdf`; tentar enviar uma imagem >2MB; tentar enviar uma imagem válida <2MB.
**Expected:** `.pdf` exibe "Apenas imagens são aceitas."; imagem grande exibe "Arquivo deve ter menos de 2MB."; imagem válida exibe preview normalmente.
**Why human:** Requer interação com file picker do browser.

#### 5. Busca e Filtros — Comportamento ao Vivo

**Test:** Digitar parte do nome de uma unidade no campo "Buscar unidade..."; alternar entre botões Todos/Disponível/Alugada; selecionar um edifício específico no select.
**Expected:** Grade de cards atualiza imediatamente sem reload; contador `N resultado(s)` aparece somente quando filtro ativo; combinação de busca + status + edifício filtra corretamente.
**Why human:** Comportamento reativo exige browser com dados reais.

#### 6. Barra de Métricas — Valores com Dados Reais

**Test:** Com dados cadastrados no banco, verificar que "Área total" soma `area_m2` de todas as unidades; "MRR realizado" soma `valor_mensal` das alugadas; "Potencial em aberto" soma `valor_mensal` das disponíveis e exibe em dourado; "Valores ocultos" conta unidades com `valor_visivel = false`.
**Expected:** Todos os 4 valores correspondem à realidade do banco; "Potencial em aberto" visivelmente dourado/âmbar.
**Why human:** Confirmar que os derivados client-side estão corretos com dados reais; cor dourada só verificável visualmente.

---

### Gaps Summary

Nenhum gap técnico identificado. Todos os 5 critérios de sucesso verificados no código-fonte. Os 6 itens acima são verificações comportamentais/visuais que requerem um browser com servidor ativo e dados reais no Supabase — não representam código ausente ou incompleto.

**Observação sobre duplo cleanup de Storage:** O `handleDeletarUnidade` em `Unidades.js` tenta remover o arquivo do Storage via `supabase-browser` ANTES de chamar `deletarUnidade` (Server Action), que também tenta remover via `supabaseAdmin`. Isso é redundante mas não danoso — ambos usam `.catch(() => {})`. O cleanup do Server Action serve como fallback. Comportamento aceitável.

---

_Verified: 2026-06-14T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
