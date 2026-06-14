# Phase 19: Unidades — Modal Unificado & Foto de Capa - Research

**Researched:** 2026-06-14
**Domain:** Supabase Storage browser upload + signed URLs, React file drag/drop preview, unified modal pattern, client-side metrics/filter
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Criar componente novo `UnifiedUnidadeModal` (não estender form inline). Mesmo componente serve criar e editar via prop de modo + dados iniciais + callbacks. Phase 20 depende desse reuso.
- **D-02:** Substituir form inline (`showForm`) e edição inline por-card em `Unidades.js` pelo modal unificado.
- **D-03:** Modal usa utility `romma-modal-backdrop` (Phase 17) para backdrop e centralização.
- **D-04:** Métricas (área total m², MRR realizado, potencial em aberto, valores ocultos) derivadas client-side da lista já carregada. MRR = soma `valor_mensal` das `alugada`; potencial = soma `valor_mensal` das `disponivel` (dourado); ocultos = contagem `valor_visivel === false`.
- **D-05:** Busca por nome e filtros (status: todos/disponível/alugada; edifício) são filtragem client-side ao vivo, sem round-trip.
- **D-06:** Preview local via object URL ao selecionar arquivo; upload real só no submit. Evita órfãos de formulários abandonados.
- **D-07:** Upload feito client-side via `supabase-browser` direto ao bucket privado `unidades-fotos`; Server Action grava apenas a string do path em `unidades.foto_url`. Validação MIME `image/*` e `<2MB` no cliente antes do upload.
- **D-08:** Path do objeto estruturado como `{edificio_id}/{uuid}.{ext}` para resolver cadeia de propriedade da RLS (primeiro segmento = unidade_id para a função `storage_unidade_owned_by_auth`).
- **D-09:** "Usar foto de exemplo" referencia asset estático em `/public` salvo diretamente em `foto_url` — não passa pelo Storage.
- **D-10:** `foto_url` armazena path do objeto no Storage (não URL pública). Exibição via `createSignedUrl` on-read. Asset de exemplo exibido direto pelo path público.
- **D-11:** Remover exige `ConfirmDialog`. Foto órfã deletada do Storage antes do delete no banco, mas delete do DB não bloqueia por falha de cleanup (best-effort).

### Claude's Discretion
- Layout exato da grade de cards e da barra de métricas.
- Estrutura precisa do componente de dropzone/upload (custom vs. input file estilizado).
- Nome/formato exato do asset de foto de exemplo em `/public`.
- Geração do UUID do path (client-side `crypto.randomUUID()` é aceitável).

### Deferred Ideas (OUT OF SCOPE)
- Edifícios em cards 2 colunas com stats e barra de ocupação + drill-in reusando este modal — Phase 20.
- Exibição de foto de capa nas páginas públicas de Unidades — Phase 24.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UNID-01 | Barra de métricas-resumo: área total m², MRR realizado, potencial em aberto em dourado, contagem de valores ocultos | D-04: derivação client-side da lista; token `var(--highlight)` para dourado; padrão exato no protótipo console2.jsx linhas 132–177 |
| UNID-02 | Busca por nome + filtros por status e edifício ao vivo | D-05: filtragem client-side com `useState` para query, fStatus, fEd; protótipo console2.jsx linhas 137–193 |
| UNID-03 | Criar e editar unidade pelo mesmo modal unificado (edifício, nome, área, valor mensal, status, descrição, checkbox) | D-01/D-02/D-03: `UnifiedUnidadeModal` com prop `mode`/`initial`; usa `romma-modal-backdrop`; protótipo `UnitFormModal` console2.jsx linhas 83–117 |
| UNID-04 | Foto de capa: arrastar/clicar → preview, "usar foto de exemplo", trocar/remover; upload no Storage privado; URL em `foto_url` | D-06/D-07/D-08/D-09/D-10: upload via `supabase.storage.from('unidades-fotos').upload()`; signed URL via `createSignedUrl`; protótipo `CoverPhotoField` console2.jsx linhas 46–80 |
| UNID-05 | Remover exige ConfirmDialog; foto órfã removida do Storage antes do delete no banco (best-effort) | D-11: `storage.remove([path])` antes de `deletarUnidade`; ConfirmDialog já existe em `src/components/ui/ConfirmDialog.js` |
</phase_requirements>

---

## Summary

A Phase 19 consome a infraestrutura de Storage entregue na Phase 17 (coluna `unidades.foto_url`, bucket privado `unidades-fotos`, função RLS `storage_unidade_owned_by_auth`, `remotePatterns` em `next.config.mjs`) para implementar o fluxo completo de gestão de Unidades com modal unificado e foto de capa.

O padrão central é upload browser-direto ao Storage via `supabase-browser` (client anon), seguido de uma Server Action que persiste apenas a string do path — o binário nunca transita pelo servidor Next.js. A exibição usa `createSignedUrl` (expiresIn configurável) porque o bucket é privado. A função RLS `storage_unidade_owned_by_auth` usa o primeiro segmento do path como `unidade_id`, portanto o path deve ser `{unidade_id}/{uuid}.{ext}` — a decisão D-08 especifica `{edificio_id}/{uuid}.{ext}`, o que contradiz a RLS existente. Veja Pitfall 1 abaixo.

O componente `UnifiedUnidadeModal` deve ser autocontido (não depende de estado de `Unidades.js`) e aceitar props `mode` ("create" | "edit"), `initial` (dados da unidade ou `null`), `edificios` (lista), `onClose`, e `onSaved` (callback pós-sucesso). O design de referência completo já está em `.planning/design/js/console2.jsx` — `UnitFormModal` e `CoverPhotoField` são os protótipos exatos a adaptar para o padrão de código do projeto.

O componente de dropzone é custom (input `type="file"` oculto + zona de drop estilizada), sem biblioteca externa, seguindo o protótipo `CoverPhotoField` do handoff. Preview via `URL.createObjectURL(file)` — a URL de objeto é revogada ao fechar o modal para evitar memory leak.

**Recomendação primária:** Implementar em 4 waves: (W0) tests/setup; (W1) `UnifiedUnidadeModal` com campos + foto (sem upload real — usa object URL em estado local); (W2) integração Storage (upload real, signed URL para exibição, cleanup no delete); (W3) métricas + busca/filtros em `Unidades.js` + refatoração para usar o modal.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Upload de foto de capa | Browser/Client | — | Upload vai direto do browser ao Supabase Storage via anon key + RLS. O servidor Next.js nunca recebe o binário. |
| Persistência de `foto_url` (path string) | API/Server Action | — | Server Action em `src/actions/unidades.js` grava apenas a string do path após upload confirmado. |
| Geração de signed URL para exibição | Browser/Client | — | `createSignedUrl` chamado no browser via `supabase-browser` ao renderizar card/modal com foto. |
| Cleanup de Storage no delete | API/Server Action | — | `supabaseAdmin` lê `foto_url` antes do delete; tenta `storage.remove([path])` como best-effort. |
| Métricas-resumo (área, MRR, potencial, ocultos) | Browser/Client | — | Derivação client-side via `Array.reduce/filter` da lista em memória — sem query server-side. |
| Busca + filtros ao vivo | Browser/Client | — | Estado React local (`query`, `fStatus`, `fEd`) + `Array.filter` sem round-trip. |
| Validação de MIME e tamanho de arquivo | Browser/Client | — | Verificado antes do upload no handler do input; Server Action pode checar extensão do path. |
| Modal unificado (criar/editar) | Browser/Client | — | Componente Client Component com estado de form e foto próprios. |

---

## Standard Stack

### Core (todos já instalados no projeto)

| Library | Version instalada | Purpose | Por que é o padrão |
|---------|-------------------|---------|-------------------|
| `@supabase/supabase-js` | 2.99.2 (npm: 2.108.1) | Storage upload + signed URLs | Único client com acesso ao bucket privado `unidades-fotos` |
| `@supabase/ssr` | 0.9.0 (npm: 0.12.0) | Browser client factory via `supabase-browser.js` | Padrão do projeto para client anon no browser |
| React 19 `useState` / `useRef` | — | Estado do form + ref do input file oculto | Padrão do projeto (JavaScript, sem TS) |
| shadcn/ui (`Input`, `Select`, `Button`, `Skeleton`) | — | Campos do modal | Componentes já em uso em `Unidades.js` atual |
| `ConfirmDialog` | — | Modal de confirmação de remoção (UNID-05) | Componente próprio já existente e testado |

> [VERIFIED: código-fonte instalado em node_modules/@supabase/storage-js]

### Nenhum pacote novo a instalar

Toda a funcionalidade requerida (upload, signed URL, delete de Storage) está na API de `@supabase/supabase-js` já instalada. Não há dependências externas novas para esta fase.

**Versão local vs. npm:** A versão instalada é 2.99.2; npm tem 2.108.1. A API de Storage não mudou entre essas versões — `upload()`, `createSignedUrl()`, `remove()` têm mesmas assinaturas. [VERIFIED: inspeção de `node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts`]

---

## Package Legitimacy Audit

Nenhum pacote novo a ser instalado nesta fase. Todos os componentes usam dependências já presentes no `package.json` do projeto.

**Packages removed due to slopcheck [SLOP] verdict:** nenhum
**Packages flagged as suspicious [SUS]:** nenhum

---

## Architecture Patterns

### System Architecture Diagram

```
Usuário (browser)
    │
    │  1. Seleciona arquivo (drag/drop ou click)
    ▼
CoverPhotoField (Client Component)
    │  URL.createObjectURL(file) → preview local imediato
    │  [arquivo guardado em estado local: { file, previewUrl }]
    │
    │  2. Usuário submete modal
    ▼
handleSubmit em UnifiedUnidadeModal
    │
    ├─► [se arquivo novo] supabase-browser.storage.from('unidades-fotos')
    │       .upload(`{unidade_id}/{uuid}.{ext}`, file, { contentType })
    │       → { data: { path }, error }
    │   [path = 'unidade_id/uuid.ext' — primeiro segmento = unidade_id para RLS]
    │
    ├─► criarUnidade(form) / editarUnidade(id, form)   [Server Action]
    │       form inclui: foto_url = path | '/public/exemplo.png' | null
    │       supabaseAdmin.from('unidades').insert/update({ ..., foto_url })
    │       → { status: 200 }
    │
    └─► onSaved() → recarrega lista → cards re-renderizam

Renderização de card com foto:
    UnidadeCard recebe unidade.foto_url (path string)
    │
    ├─► [path começa com '/'] → <img src={foto_url} /> (asset estático /public)
    │
    └─► [path = storage path] → useEffect: supabase-browser.storage
            .from('unidades-fotos').createSignedUrl(path, 3600)
            → { data: { signedUrl } } → <Image src={signedUrl} />

Remoção:
    handleDeletarUnidade(unidade) em Unidades.js
    │
    ├─► abre ConfirmDialog
    │
    ├─► [se unidade.foto_url e não começa com '/']
    │   supabase-browser.storage.from('unidades-fotos').remove([foto_url])
    │   [best-effort: ignora erro de Storage]
    │
    └─► deletarUnidade(id) [Server Action]
            supabaseAdmin.from('unidades').delete().eq('id', id)
            → { status: 200 }
```

### Recommended Project Structure

```
src/
├── components/
│   ├── features/
│   │   └── Unidades.js              # Refatorado: grade + métricas + filtros + modal state
│   └── ui/
│       ├── UnifiedUnidadeModal.js   # NOVO: modal criar/editar com CoverPhotoField
│       ├── CoverPhotoField.js       # NOVO (ou inline no modal): drag/drop + preview
│       ├── UnidadeCard.js           # Atualizar: aceitar foto_url, signed URL, novo onEditar
│       └── ConfirmDialog.js         # Existente — reusado sem alteração
├── actions/
│   └── unidades.js                  # Estender: foto_url em criar/editar; cleanup em deletar
└── lib/
    └── queries-client.js            # Estender getUnidades(): adicionar foto_url no SELECT
```

### Pattern 1: Upload browser-direto ao Supabase Storage privado

**O que é:** O client anon (supabase-browser) faz upload direto ao Storage. A RLS valida a cadeia de propriedade via `storage_unidade_owned_by_auth`. O servidor Next.js só recebe o path string.

**Quando usar:** Qualquer upload de arquivo para bucket privado com RLS de ownership no Romma.

```javascript
// Source: node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts:193
// Em UnifiedUnidadeModal.js (Client Component)
import { createClient } from '@/lib/supabase-browser'

async function uploadFoto(file, unidadeId) {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${unidadeId}/${crypto.randomUUID()}.${ext}`

  const { data, error } = await supabase.storage
    .from('unidades-fotos')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error
  return data.path  // string — ex: "uuid-unidade/abc123.jpg"
}
```

> [VERIFIED: StorageFileApi.ts linha 193 — assinatura `upload(path, fileBody, fileOptions?)`]

### Pattern 2: Geração de signed URL para exibição (bucket privado)

**O que é:** Bucket `unidades-fotos` é privado (`public: false`). `getPublicUrl` retorna URL não-funcional. A exibição requer signed URL gerada client-side.

**Quando usar:** Toda vez que um card ou o modal precisar mostrar a foto de capa de uma unidade.

```javascript
// Source: node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts:586
// No UnidadeCard.js ou no próprio modal ao exibir imagem existente
import { createClient } from '@/lib/supabase-browser'
import { useState, useEffect } from 'react'

function useFotoSignedUrl(fotoUrl) {
  const [signedUrl, setSignedUrl] = useState(null)

  useEffect(() => {
    if (!fotoUrl || fotoUrl.startsWith('/')) {
      // Asset /public — usar direto
      setSignedUrl(fotoUrl)
      return
    }
    const supabase = createClient()
    supabase.storage
      .from('unidades-fotos')
      .createSignedUrl(fotoUrl, 3600)  // expira em 1h
      .then(({ data, error }) => {
        if (!error) setSignedUrl(data.signedUrl)
      })
  }, [fotoUrl])

  return signedUrl
}
```

> [VERIFIED: StorageFileApi.ts linha 586 — assinatura `createSignedUrl(path, expiresIn, options?)`]

### Pattern 3: Cleanup de Storage no delete (best-effort)

**O que é:** Antes de deletar o registro do banco, tenta remover o objeto do Storage. Falha de cleanup não bloqueia o delete do banco.

**Quando usar:** `deletarUnidade` no Server Action + handler client-side antes de chamar a Server Action.

```javascript
// Em Unidades.js — handler client-side (D-11: best-effort no cliente)
import { createClient } from '@/lib/supabase-browser'

async function handleDeletarUnidade(unidade) {
  // Cleanup best-effort de Storage (antes do confirm dialog fechar)
  if (unidade.foto_url && !unidade.foto_url.startsWith('/')) {
    const supabase = createClient()
    await supabase.storage
      .from('unidades-fotos')
      .remove([unidade.foto_url])
      .catch(() => {})  // ignora erro — best-effort
  }
  const result = await deletarUnidade(unidade.id)
  // ...
}
```

> [VERIFIED: StorageFileApi.ts linha 990 — assinatura `remove(paths: string[])`]

### Pattern 4: Preview local via object URL

**O que é:** `URL.createObjectURL(file)` cria URL local temporária para preview imediato sem upload. Deve ser revogada ao desmontar para evitar memory leak.

```javascript
// Em CoverPhotoField / UnifiedUnidadeModal
const [preview, setPreview] = useState(null)   // object URL ou path de exemplo
const [file, setFile]       = useState(null)   // File object para upload no submit

function handleFileSelect(selectedFile) {
  if (!selectedFile) return
  // Validação client-side (D-07)
  if (!selectedFile.type.startsWith('image/')) {
    setErro('Apenas imagens são aceitas.')
    return
  }
  if (selectedFile.size > 2 * 1024 * 1024) {
    setErro('Arquivo deve ter menos de 2MB.')
    return
  }
  // Revogar URL anterior para evitar memory leak
  if (preview && !preview.startsWith('/')) URL.revokeObjectURL(preview)
  setFile(selectedFile)
  setPreview(URL.createObjectURL(selectedFile))
}

// No cleanup do componente ou ao fechar modal:
// if (preview && !preview.startsWith('/')) URL.revokeObjectURL(preview)
```

> [ASSUMED] Padrão de revogação de object URL — baseado em conhecimento da Web API standard (MDN). Não verificado via Context7 nesta sessão.

### Pattern 5: Métricas derivadas client-side

**O que é:** As 4 métricas (área total, MRR realizado, potencial em aberto, valores ocultos) são calculadas da lista `unidades` já em memória — zero queries adicionais.

```javascript
// Em Unidades.js — derivação pura, sem useEffect
const totalM2       = unidades.reduce((s, u) => s + (u.area_m2 || 0), 0)
const mrrRealizado  = unidades.filter(u => u.status === 'alugada')
                              .reduce((s, u) => s + (u.valor_mensal || 0), 0)
const potencialEmAberto = unidades.filter(u => u.status === 'disponivel')
                                  .reduce((s, u) => s + (u.valor_mensal || 0), 0)
const valoresOcultos = unidades.filter(u => !u.valor_visivel).length
```

> [VERIFIED: protótipo console2.jsx linhas 132–136, lido diretamente do repositório]

### Pattern 6: Filtragem client-side ao vivo

```javascript
// Em Unidades.js
const [query, setQuery]   = useState('')
const [fStatus, setFStatus] = useState('all')
const [fEd, setFEd]        = useState('all')

const filtered = unidades.filter(u => {
  if (fEd !== 'all' && u.edificio_id !== fEd) return false
  if (fStatus !== 'all' && u.status !== fStatus) return false
  if (query && !u.nome.toLowerCase().includes(query.toLowerCase())) return false
  return true
})
// filtered alimenta a grade de cards
// Métricas sempre calculadas sobre `unidades` (total), não sobre `filtered`
```

> [VERIFIED: protótipo console2.jsx linhas 137–143, lido diretamente do repositório]

### Anti-Patterns to Avoid

- **Gravar a signedURL em banco:** `foto_url` deve ser o path do Storage (ex: `uuid/uuid.jpg`), nunca a URL assinada completa (expira em 1h e polui o banco).
- **Usar `getPublicUrl` em bucket privado:** Retorna URL que resulta em 400 porque o bucket não é público. Sempre usar `createSignedUrl`.
- **Chamar `createSignedUrl` no Server Component:** A função precisa de sessão autenticada do usuário. Fazer no Client Component com `supabase-browser`.
- **Fechar modal antes de revogar object URL:** Gera memory leak. Sempre revogar no handler de fechar modal.
- **Usar `upsert: true` por padrão no upload:** Pode sobrescrever foto de outra unidade se o path colidir. Usar `crypto.randomUUID()` no path e `upsert: false`.
- **Importar `supabaseAdmin` em componente client:** `supabaseAdmin` usa `SUPABASE_ROLE_KEY` (server-only). Importar em Client Component expõe a chave no bundle.

---

## Don't Hand-Roll

| Problema | Não construir | Usar | Por que |
|----------|--------------|------|---------|
| Geração de signed URL para imagem privada | Proxy próprio de URL | `supabase.storage.from().createSignedUrl()` | A API do Storage já faz autenticação, expiração e CORS |
| Validação de tipo de arquivo | Regex no nome do arquivo | `file.type.startsWith('image/')` + `file.size` | O browser popula `File.type` confiável; regex em nome é bypassável |
| Drag & drop de arquivo | Biblioteca de DnD | `onDragOver` / `onDrop` nativos + `e.dataTransfer.files[0]` | Para um único campo de upload, os eventos nativos são suficientes |
| Delete de arquivo no Storage | Endpoint proxy | `supabase.storage.from().remove([path])` | RLS + SDK já cobrem autorização; proxy seria redundante |
| Preview de imagem antes do upload | Upload temporário + presigned | `URL.createObjectURL(file)` | Zero rede, instantâneo, sem lixo no Storage |

---

## Common Pitfalls

### Pitfall 1: Path do objeto vs. segmento esperado pela RLS (CRÍTICO)

**O que dá errado:** A decisão D-08 diz que o path deve ser `{edificio_id}/{uuid}.{ext}`. Mas a função RLS `storage_unidade_owned_by_auth` (migração `20260601000000_v15_foundation.sql` linha 38) extrai o **primeiro segmento como `unidade_id`**, não `edificio_id`:

```sql
v_unidade_id := (storage.foldername(obj_name))[1]::UUID;
-- Depois faz: FROM unidades u WHERE u.id = v_unidade_id
```

Se o path for `{edificio_id}/{uuid}.{ext}`, o primeiro segmento é o `edificio_id`, mas a função tenta encontrá-lo em `unidades.id` — que vai falhar e retornar `FALSE`, bloqueando todos os uploads.

**Resolução:** Usar `{unidade_id}/{uuid}.{ext}` como path — o primeiro segmento deve ser o `unidade_id`. Na criação, a Server Action precisa retornar o `id` da unidade criada para que o client possa montar o path correto antes de enviar o upload.

**Fluxo correto para criar com foto:**
1. Server Action `criarUnidade` → retorna `{ status: 200, id: unidade.id }`
2. Client faz upload para `{unidade_id}/{uuid}.{ext}` (onde `unidade_id` é o `id` retornado)
3. Client chama Server Action `gravarFotoUrl(id, path)` ou re-chama `editarUnidade(id, { foto_url: path })`

**Alternativa simpler:** Fazer o upload antes de criar a unidade não é possível (não existe `unidade_id` ainda). A abordagem mais limpa é criar a unidade sem foto, depois fazer upload e editar para gravar `foto_url` — tudo no mesmo submit handler.

> [VERIFIED: migração `20260601000000_v15_foundation.sql` lida diretamente, linha 38]

### Pitfall 2: `getUnidades()` não inclui `foto_url` no SELECT atual

**O que dá errado:** `src/lib/queries-client.js` linha 6 faz `SELECT 'id, edificio_id, nome, ..., status'` — `foto_url` não está incluído. Cards renderizarão sem foto, e a lógica de cleanup no delete não saberá o path.

**Como evitar:** Atualizar `getUnidades()` para incluir `foto_url` no SELECT. Também atualizar `getUnidade()` (linha 103) pela mesma razão.

> [VERIFIED: leitura de `src/lib/queries-client.js` linha 6]

### Pitfall 3: `editarUnidade` ignora `foto_url` no patch atual

**O que dá errado:** `src/actions/unidades.js` linha 59 monta `patch` sem `foto_url`. Mesmo que o client envie `foto_url` no form, a Server Action não o persiste.

**Como evitar:** Adicionar `foto_url` ao destructuring do form e ao objeto `patch` em `editarUnidade`. Igualmente em `criarUnidade` (linha 33: `insert()` não inclui `foto_url`).

> [VERIFIED: leitura de `src/actions/unidades.js` linhas 33 e 59]

### Pitfall 4: Signed URL expira — não cachear em estado persistente

**O que dá errado:** `createSignedUrl` com `expiresIn: 3600` gera URL que expira após 1h. Se o Proprietário deixar a tela aberta por muito tempo, as imagens quebram.

**Como evitar:** Para o TCC, `expiresIn: 3600` (1h) é aceitável. Não persistir a signed URL em `localStorage`, `sessionStorage`, ou em banco — sempre re-gerar on-render a partir do path.

> [ASSUMED] Estratégia de cache de signed URL — baseado em comportamento documentado do Supabase Storage. Não verificado via Context7 nesta sessão.

### Pitfall 5: Foto de exemplo (`/public`) não deve ir pelo Storage

**O que dá errado:** Se o handler de "usar foto de exemplo" tentar fazer upload do asset `/public/hero-building.png` (ou similar) ao Storage, cria objeto desnecessário e o path não vai resolver na RLS.

**Como evitar:** Quando o usuário clica "usar foto de exemplo", apenas definir `foto_url = '/public/exemplo.png'` (path público estático). No Server Action, gravar esse valor literalmente. Na exibição, detectar com `fotoUrl.startsWith('/')` e usar `<img src={fotoUrl}>` direto (sem `createSignedUrl`).

> [VERIFIED: D-09 e D-10 em 19-CONTEXT.md]

### Pitfall 6: E2E tests esperam seletores da interface antiga

**O que dá errado:** `e2e/crud-unidades.spec.js` usa `page.getByRole('button', { name: 'Nova Unidade' })`, `page.fill('input[placeholder="Nome da unidade"]')` e `page.getByRole('button', { name: 'Criar Unidade' })` — todos dependem do form inline que será removido.

**Como evitar:** Atualizar `crud-unidades.spec.js` junto com a refatoração. O novo fluxo abre um modal, portanto os seletores mudam (ex: modal com role `dialog` ou classe específica). Igualmente `toast-unidades.spec.js`.

> [VERIFIED: leitura de `e2e/crud-unidades.spec.js` linhas 40–52]

### Pitfall 7: `UnifiedUnidadeModal` deve ser desacoplado de `Unidades.js`

**O que dá errado:** Se o modal depender de estado global de `Unidades.js` (ex: receber `unidades` como prop ou chamar `setUnidades` internamente), a Phase 20 não conseguirá reutilizá-lo no drill-in de Edifícios.

**Como evitar:** O modal só conhece `mode`, `initial`, `edificios`, `onClose`, `onSaved`. Não recebe lista de unidades nem setters de estado do pai. O pai é responsável por recarregar a lista no `onSaved`.

---

## Code Examples

### Assinaturas verificadas da API do Storage

```javascript
// upload — Source: StorageFileApi.ts:193
const { data, error } = await supabase.storage
  .from('unidades-fotos')
  .upload(path, file, { contentType: file.type, upsert: false })
// data.path = caminho do objeto (sem o nome do bucket)

// createSignedUrl — Source: StorageFileApi.ts:586
const { data, error } = await supabase.storage
  .from('unidades-fotos')
  .createSignedUrl(path, 3600)
// data.signedUrl = URL completa com ?token=...

// remove — Source: StorageFileApi.ts:990
const { data, error } = await supabase.storage
  .from('unidades-fotos')
  .remove([path])
// Aceita array de paths (strings)
```

### Extensão mínima de `criarUnidade` para suportar foto_url

```javascript
// src/actions/unidades.js — criarUnidade (extensão)
export async function criarUnidade(form) {
  // ... authGuard, validações existentes ...
  const { nome, descricao, area_m2, valor_mensal, status, valor_visivel, edificio_id, foto_url } = form

  // ... verificação de edificio ...

  const { data, error } = await supabaseAdmin.from('unidades').insert({
    nome: nome.trim(), descricao, area_m2, valor_mensal,
    status, valor_visivel: Boolean(valor_visivel), edificio_id,
    foto_url: foto_url ?? null,
  }).select('id').single()  // retorna id para o client montar o path de upload

  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200, id: data.id }  // id exposto para upload pós-criação
}
```

### Extensão mínima de `deletarUnidade` para cleanup best-effort

```javascript
// src/actions/unidades.js — deletarUnidade (extensão)
export async function deletarUnidade(id) {
  const { err, user } = await authGuard()
  if (err) return err
  if (!UUID_RE.test(id)) return { status: 400, erroMessage: 'ID inválido.' }

  const { data: unidade } = await supabaseAdmin
    .from('unidades').select('edificio_id, foto_url').eq('id', id).single()
  // ... verificação de edificio ...

  // Cleanup best-effort de Storage (server-side usando supabaseAdmin)
  if (unidade.foto_url && !unidade.foto_url.startsWith('/')) {
    await supabaseAdmin.storage
      .from('unidades-fotos')
      .remove([unidade.foto_url])
      .catch(() => {})  // ignora erro
  }

  const { error } = await supabaseAdmin.from('unidades').delete().eq('id', id)
  if (error) return { status: 500, erroMessage: error.message }
  return { status: 200 }
}
```

### Drag & Drop nativo (sem biblioteca)

```javascript
// CoverPhotoField — padrão do protótipo console2.jsx linhas 46-80
const [drag, setDrag] = useState(false)
const inputRef = useRef(null)

// Zona de drop (quando sem foto):
<div
  onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
  onDragLeave={() => setDrag(false)}
  onDrop={(e) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }}
  onClick={() => inputRef.current?.click()}
  style={{ border: `1px dashed ${drag ? 'var(--indigo)' : 'var(--border-2)'}` }}
>
  <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
    onChange={(e) => handleFileSelect(e.target.files[0])} />
  {/* ... */}
</div>
```

---

## State of the Art

| Abordagem antiga | Abordagem atual (nesta fase) | Notas |
|------------------|------------------------------|-------|
| Form inline (`showForm`) em `Unidades.js` | Modal unificado `UnifiedUnidadeModal` separado | Reuso na Phase 20 |
| Edição inline por-card em `UnidadeCard.js` | Mesmo modal com `mode="edit"` | Remove prop drilling pesado |
| Sem foto de capa | Upload direto ao Storage + signed URL on-read | Infra entregue na Phase 17 |
| Sem busca/filtros | Filtragem client-side ao vivo | Dataset pequeno (TCC) |
| Sem métricas | Barra de métricas derivada da lista em memória | Zero queries adicionais |
| `deletarUnidade` sem confirmação visual | `ConfirmDialog` + cleanup de Storage | D-11 |

---

## Assumptions Log

| # | Claim | Section | Risk se errado |
|---|-------|---------|----------------|
| A1 | Revogação de object URL com `URL.revokeObjectURL` evita memory leak ao fechar modal | Pattern 4 | Baixo — comportamento padrão da Web API; API estável |
| A2 | `expiresIn: 3600` (1h) é suficiente para o TCC sem estratégia de refresh | Pitfall 4 | Baixo — apenas visual (imagens quebram após 1h sem reload) |
| A3 | `supabaseAdmin.storage` (service_role) pode fazer `remove()` ignorando RLS | Code Examples: deletarUnidade | Médio — service_role bypassa RLS em tabelas mas também em Storage policies; confirmar se `storage.objects` RLS aplica ao service_role |

---

## Open Questions

1. **Cleanup do Storage no delete: client-side ou server-side?**
   - O que sabemos: D-11 diz "best-effort no Storage, log/ignore erro". Server Action já tem `supabaseAdmin` que pode remover do Storage com service_role.
   - O que está incerto: `supabaseAdmin.storage.remove()` usa service_role key — deve funcionar sem RLS. Mas a decisão não especifica se o cleanup é no client (antes de chamar Server Action) ou dentro da própria Server Action.
   - Recomendação: Fazer o cleanup dentro de `deletarUnidade` no Server Action via `supabaseAdmin.storage` — mais confiável do que depender do browser (conexão pode cair). O client-side handler pode tentar também como "double-coverage" mas o server-side é o canonical.

2. **`criarUnidade` deve retornar o `id` gerado?**
   - O que sabemos: Para construir o path `{unidade_id}/{uuid}.{ext}` antes do upload, o client precisa do `id` da unidade recém-criada (Pitfall 1).
   - Recomendação: Sim — modificar `criarUnidade` para retornar `{ status: 200, id: data.id }`. Isso permite o fluxo: criar unidade → obter id → upload → editar foto_url.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js 16 | ✓ | v24.13.0 | — |
| @supabase/supabase-js | Storage upload/signed URL | ✓ | 2.99.2 (instalado) | — |
| Supabase project `vfymttcajeyhrmsyhrtj` | Storage bucket `unidades-fotos` | ✓ | migração aplicada (Phase 17) | — |
| `unidades.foto_url` column | Persistência do path | ✓ | TEXT nullable (Phase 17) | — |
| `.romma-modal-backdrop` CSS | Modal backdrop | ✓ | globals.css linha 361 (Phase 17) | — |
| Tokens `--rd-*` e `--rt-*` | Tipografia/espaçamento | ✓ | globals.css linhas 384–404 (Phase 17) | — |
| Playwright + E2E suite | Testes | ✓ | ^1.60.0 | — |

**Missing dependencies with no fallback:** nenhum

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright ^1.60.0 |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test e2e/crud-unidades.spec.js --project=chromium` |
| Full suite command | `npx playwright test --project=chromium` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Arquivo existe? |
|--------|----------|-----------|-------------------|----------------|
| UNID-01 | Barra de métricas visível com 4 métricas corretas | E2E smoke | `npx playwright test e2e/crud-unidades.spec.js -k "métricas" --project=chromium` | ❌ Wave 0 |
| UNID-02 | Busca por nome filtra cards ao vivo | E2E | `npx playwright test e2e/crud-unidades.spec.js -k "busca" --project=chromium` | ❌ Wave 0 |
| UNID-02 | Filtro por status filtra cards | E2E | idem | ❌ Wave 0 |
| UNID-03 | Criar unidade via modal (sem foto) | E2E | `npx playwright test e2e/crud-unidades.spec.js -k "criar" --project=chromium` | ❌ precisa atualizar |
| UNID-03 | Editar unidade via modal | E2E | `npx playwright test e2e/crud-unidades.spec.js -k "editar" --project=chromium` | ❌ precisa atualizar |
| UNID-04 | Upload de foto via input file | Manual/E2E | — | ❌ Wave 0 |
| UNID-05 | Remover unidade exige confirmação (ConfirmDialog visível) | E2E | `npx playwright test e2e/crud-unidades.spec.js -k "deletar" --project=chromium` | ❌ precisa atualizar |

### Wave 0 Gaps

- [ ] `e2e/crud-unidades.spec.js` — atualizar seletores para novo fluxo modal (botão abre modal, não form inline); adicionar testes para UNID-01 (métricas), UNID-02 (busca/filtro), UNID-05 (ConfirmDialog aparece antes do delete)
- [ ] `e2e/toast-unidades.spec.js` — verificar se seletores de Remover ainda funcionam (agora exige confirmação prévia)

*(Infra de testes (Playwright, global-setup, seed) já existe — sem gaps de framework)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim | `authGuard()` local em cada Server Action — padrão existente |
| V4 Access Control | sim | Verificação de cadeia `edificio.proprietario_id` em cada mutação — padrão existente; RLS `storage_unidade_owned_by_auth` no bucket |
| V5 Input Validation | sim | Validação de MIME `image/*` e tamanho `<2MB` no client antes do upload; validação de UUID do path antes de `criarUnidade`/`editarUnidade`; campos obrigatórios validados na Server Action |
| V6 Cryptography | não aplicável | Storage usa TLS; signed URLs geradas pelo SDK Supabase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Upload de arquivo arbitrário (exe, script) | Tampering | Validação MIME `image/*` + limit 2MB no client; `contentType` explícito no upload |
| Path traversal no nome do arquivo | Tampering | Não usar `file.name` no path do Storage — usar `crypto.randomUUID()` + extensão extraída |
| IDOR no upload (proprietário A faz upload para unidade do proprietário B) | Elevation of Privilege | RLS `storage_unidade_owned_by_auth` valida cadeia `unidade → edificio → proprietario_id` |
| IDOR no delete (proprietário A deleta foto do proprietário B) | Elevation of Privilege | `deletarUnidade` verifica `edificio.proprietario_id === user.id` antes de qualquer operação |
| Signed URL com TTL longo vaza foto | Information Disclosure | Aceito para TCC com `expiresIn: 3600` (1h); bucket permanece privado |

---

## Sources

### Primary (HIGH confidence)
- `node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts` — assinaturas verificadas de `upload()`, `createSignedUrl()`, `remove()` na versão instalada 2.99.2
- `supabase/migrations/20260601000000_v15_foundation.sql` — definição exata da RLS `storage_unidade_owned_by_auth` e convenção de path (segmento 1 = unidade_id)
- `.planning/design/js/console2.jsx` — protótipo de referência completo: `UnitFormModal`, `CoverPhotoField`, `UnidadesScreen` com métricas e filtros
- `src/app/globals.css` — `.romma-modal-backdrop` (linha 361), tokens `--rd-*`/`--rt-*` (linhas 384–415)
- `src/actions/unidades.js` — Server Actions existentes a estender
- `src/lib/queries-client.js` — `getUnidades()` sem `foto_url` (linha 6) — gap identificado
- `e2e/crud-unidades.spec.js` — seletores existentes que precisam ser atualizados
- `19-CONTEXT.md` — decisões D-01 a D-11 (decisões locked)

### Secondary (MEDIUM confidence)
- `src/components/features/Unidades.js` — estado atual do componente (refatoração alvo)
- `src/components/ui/ConfirmDialog.js` — props API do componente de confirmação
- `src/components/ui/UnidadeCard.js` — card atual (precisará aceitar `foto_url`)
- `next.config.mjs` — `remotePatterns` já configurado para Supabase hostname

### Tertiary (LOW confidence)
- Nenhuma claim de nível LOW nesta pesquisa.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — todos os pacotes já instalados, API verificada no código-fonte
- Architecture: HIGH — protótipo de referência completo disponível em console2.jsx; RLS verificada no SQL de migração
- Pitfalls: HIGH — todos verificados em código existente no repositório, especialmente Pitfall 1 (contradição D-08 vs. RLS real)

**Research date:** 2026-06-14
**Valid until:** 2026-07-14 (APIs de Storage estáveis)
