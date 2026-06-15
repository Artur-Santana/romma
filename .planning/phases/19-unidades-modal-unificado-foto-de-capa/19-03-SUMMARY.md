---
phase: 19-unidades-modal-unificado-foto-de-capa
plan: 03
subsystem: ui
tags: [supabase-storage, signed-url, file-upload, modal, react, next-js]

# Dependency graph
requires:
  - phase: 19-01
    provides: criarUnidade returns {status:200,id}; editarUnidade accepts foto_url patch
  - phase: 17-funda-o-tokens-mobile-modal-fixes-infra
    provides: romma-modal-backdrop CSS utility; unidades-fotos private bucket + RLS storage_unidade_owned_by_auth

provides:
  - UnifiedUnidadeModal: self-contained create/edit modal with CoverPhotoField, Storage upload, signed-URL preview
  - CoverPhotoField (inline): dropzone drag/click, foto de exemplo, trocar/remover, MIME+size validation
  - 3-step create upload flow: criarUnidade -> browser upload to {unidade_id}/{uuid}.{ext} -> editarUnidade
  - Edit-mode signed URL resolution via supabase-browser createSignedUrl on mount

affects:
  - phase-20-edificios-cards-drill-in  # imports UnifiedUnidadeModal directly

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CoverPhotoField inline in modal: preview state + fileToUpload state + inputRef managed in parent modal scope so submit handler can access file"
    - "3-step create-with-photo: criarUnidade (get id) -> supabase.storage.upload({unidade_id}/uuid.ext) -> editarUnidade(foto_url path)"
    - "Signed URL on mount: useEffect resolves storage path to signed URL only on edit mode; static /public paths used directly"
    - "Object URL lifecycle: revokeObjectURL on replace, remove, and useEffect cleanup on unmount"
    - "Path shape for RLS: {unidade_id}/{uuid}.{ext} — segment[0] = unidade_id as required by storage_unidade_owned_by_auth"

key-files:
  created:
    - src/components/ui/UnifiedUnidadeModal.js
  modified: []

key-decisions:
  - "CoverPhotoField kept inline in UnifiedUnidadeModal (not extracted) — Phase 20 reuses the modal, not the field separately"
  - "fileToUpload and preview state live in modal scope (not inside CoverPhotoField) so handleSubmit can read fileToUpload without prop drilling"
  - "Object URL revoked via useEffect cleanup that depends on [preview] — runs each time preview changes, revoking the previous blob URL"
  - "Example asset path /images/unidade-exemplo.jpg saved via criarUnidade's fotoInicial (startsWith('/') check) in create mode; in edit mode passed through form.foto_url"
  - "ESLint warnings (no-img-element, exhaustive-deps) are intentional: img required for blob/signed URLs; useEffect([]) intentional per PATTERNS spec"

patterns-established:
  - "UnifiedUnidadeModal props API: { mode, initial, edificios, onClose, onSaved } — no parent setters, Phase 20 reusable"
  - "Inline styles + CSS vars exclusively; className only for whitelisted utilities (romma-modal-backdrop, r-*, eyebrow*)"
  - "Field primitives (FLabel, FInput, FSelect, FormField, ErrLine, FormCheck) defined as local functions at top of modal file"

requirements-completed: [UNID-03, UNID-04]

# Metrics
duration: 35min
completed: 2026-06-14
---

# Phase 19 Plan 03: UnifiedUnidadeModal Summary

**Self-contained create/edit modal with inline CoverPhotoField, browser-side Storage upload to `{unidade_id}/{uuid}.{ext}`, and signed URL preview for existing photos in edit mode**

## Performance

- **Duration:** 35 min
- **Started:** 2026-06-14T22:23:00Z
- **Completed:** 2026-06-14T22:58:33Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Built `UnifiedUnidadeModal` handling both create and edit via `mode`/`initial` props — fully decoupled from `Unidades.js` state, ready for Phase 20 reuse
- Implemented inline `CoverPhotoField` with three states: empty dropzone (drag/click), photo preview with Trocar/Remover overlay, and edit-mode signed URL resolution
- Implemented 3-step create-with-photo flow: `criarUnidade` returns id → browser upload to `{unidade_id}/{uuid}.{ext}` via `supabase-browser` → `editarUnidade` persists only the path string
- Added client-side MIME `image/*` and `<2MB` validation with exact UI-SPEC copy; object URLs properly revoked on replace, remove, and unmount

## Task Commits

1. **Task 1 + Task 2: Build UnifiedUnidadeModal shell + CoverPhotoField + 3-step upload** - `9e4771a` (feat)

**Plan metadata:** _(see final commit below)_

## Files Created/Modified
- `src/components/ui/UnifiedUnidadeModal.js` — 508-line self-contained modal: field primitives, CoverPhotoField inline, form state, signed URL on mount, 3-step upload submit, backdrop + header + action bar

## Decisions Made
- Task 1 and Task 2 committed as single atomic commit because the file cannot meaningfully exist in a "shell without upload" state — committing an incomplete submit handler would leave code that errors on use.
- CoverPhotoField left inline in the modal (not extracted to a separate file) as specified by UI-SPEC discretion note; Phase 20 imports `UnifiedUnidadeModal`, not `CoverPhotoField` directly.
- `fileToUpload` and `preview` state hoisted to modal scope so `handleSubmit` can access `fileToUpload` without extra prop callbacks.
- ESLint warning `no-img-element`: intentional — `<img>` required for blob object URLs and Supabase signed URLs which include query params (`?token=`); `next/image` cannot handle these without explicit `remotePatterns` per-token which the bucket omits (per Phase 17 decision).
- ESLint warning `exhaustive-deps` on signed URL effect: intentional per PATTERNS spec "only on mount — re-generate on reload, not on timer".

## Deviations from Plan

None — plan executed exactly as written. The automated verification regex `/\$\{[^}]*\}\/\$\{[^}]*randomUUID/` has a backtracking limitation (greedy `[^}]*` consumes the literal `randomUUID` inside the second template expression), but the actual storage path `${unidadeId}/${crypto.randomUUID()}.${ext}` is present in the source and confirmed via `indexOf` check. Both path shapes (create and edit modes) verified.

## Known Stubs

None — all fields are wired to real form state; submit handler calls actual Server Actions and Storage API.

## Threat Flags

No new threat surface beyond what was specified in the plan's threat model. All four mitigations (T-19-07, T-19-08, T-19-09) implemented:
- T-19-07: MIME `file.type.startsWith('image/')` + size `> 2 * 1024 * 1024` checked in `handleFileSelect`; explicit `contentType: fileToUpload.type` on upload call
- T-19-08: `crypto.randomUUID()` used for filename; `file.name` never appears in Storage path
- T-19-09: Path `${unidadeId}/...` — RLS `storage_unidade_owned_by_auth` validates unidade→edificio→proprietario_id chain

## Issues Encountered

None.

## Next Phase Readiness
- `UnifiedUnidadeModal` exported and ready for Phase 20 to `import UnifiedUnidadeModal from "@/components/ui/UnifiedUnidadeModal"` with props `{ mode, initial, edificios, onClose, onSaved }`
- `criarUnidade` and `editarUnidade` already accept `foto_url` and return `id` (delivered in Plan 19-01)
- Phase 20 can pass any `edificios` array; modal is not coupled to the Unidades feature screen

---
*Phase: 19-unidades-modal-unificado-foto-de-capa*
*Completed: 2026-06-14*
