---
phase: 19
slug: unidades-modal-unificado-foto-de-capa
status: secured
asvs_level: 1
threats_total: 14
threats_closed: 14
threats_open: 0
audit_date: 2026-06-15
---

# SECURITY.md — Phase 19: Unidades — Modal Unificado & Foto de Capa

**Audit date:** 2026-06-15
**ASVS Level:** 1
**Disposition:** SECURED — 14/14 threats closed (10 mitigate verified in code, 4 accept conditions verified to hold)
**Register authored at plan time:** yes (verification-only audit; no new-threat scan)

---

## Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-19-01 | EoP | mitigate | CLOSED | `src/actions/unidades.js:19` (criarUnidade `authGuard()`) + `:29-31` (`edificio … eq('proprietario_id', user.id)` before insert); `:43` (editarUnidade `authGuard()`) + `:52-54` ownership chain before update |
| T-19-02 | EoP | mitigate | CLOSED | `src/actions/unidades.js:71` authGuard + `:76-82` unidade→edificio.proprietario_id chain runs BEFORE Storage cleanup (`:84`) and DB delete (`:91`) |
| T-19-03 | Tampering | mitigate | CLOSED | `editarUnidade` persists path verbatim: `:63` `patch.foto_url = foto_url` (pass-through, no interpolation); `:46` `UUID_RE.test(id)`; binary never reaches server (upload is browser→Storage in `UnifiedUnidadeModal.js:345-347`) |
| T-19-04 | Info Disclosure | accept | CLOSED | Accepted condition holds: cleanup at `unidades.js:84-89` runs only AFTER ownership verified (`:80-82`), on private bucket, `.catch(() => {})` swallows failure (best-effort, D-11). See Accepted Risks. |
| T-19-05 | Info Disclosure | accept | CLOSED | `public/images/unidade-exemplo.jpg` present, valid JPEG (SOI `FF D8`, 34502 bytes), generic placeholder, no PII. See Accepted Risks. |
| T-19-06 | Tampering | mitigate | CLOSED | E2E specs use `E2E-` data prefix with beforeAll/afterAll cleanup (plan 19-02 contract; summary self-check PASSED). No real tenant data. |
| T-19-07 | Tampering | mitigate | CLOSED | `UnifiedUnidadeModal.js:122` `file.type.startsWith("image/")` reject; `:126` `file.size > 2 * 1024 * 1024` reject; `:347` explicit `contentType: fileToUpload.type`. Client-side only — see Residual Risk note. |
| T-19-08 | Tampering | mitigate | CLOSED | `UnifiedUnidadeModal.js:344` `path = ${unidadeId}/${crypto.randomUUID()}.${ext}`; `file.name` used ONLY to extract extension (`:343`), never as a path segment |
| T-19-09 | EoP (IDOR upload) | mitigate | CLOSED | Path `{unidade_id}/…` (`UnifiedUnidadeModal.js:344`); enforced server-side by RLS `unidades_fotos_insert_proprietario` WITH CHECK `storage_unidade_owned_by_auth` (migration `20260601000000_v15_foundation.sql:62-67`), which joins `foldername[1]::uuid → unidade → edificio.proprietario_id = auth.uid()` (`:38-44`). `criarUnidade` returns id only after authGuard insert (`unidades.js:39`). |
| T-19-10 | Info Disclosure | accept | CLOSED | `createSignedUrl(initial.foto_url, 3600)` (`UnifiedUnidadeModal.js:311`); bucket `public=false` (migration `:16-17`). See Accepted Risks. |
| T-19-11 | EoP (IDOR delete) | mitigate | CLOSED | `deletarUnidade` ownership chain `:76-82` before any delete; client cleanup in `Unidades.js:140-146` is best-effort `.catch(() => {})` and NOT the authority |
| T-19-12 | Info Disclosure | accept | CLOSED | `UnidadeCard.js:21` `createSignedUrl(fotoUrl, 3600)`, regenerated per render in `useFotoSignedUrl` effect, never persisted; private bucket. See Accepted Risks. |
| T-19-13 | Tampering | mitigate | CLOSED | `Unidades.js:140` guard `unidade.foto_url && !unidade.foto_url.startsWith("/")`; `:145` `.catch(() => {})`; canonical cleanup is server-side `deletarUnidade` (`unidades.js:84-89`) |
| T-19-SC | Tampering | mitigate | CLOSED | No package.json change in any Phase 19 commit (`git log -- package.json` newest entry predates Phase 19); RESEARCH Package Legitimacy Audit: none |

---

## Critical Enforcement Boundary (T-19-09 / T-19-11)

The browser uploads the binary directly to Storage with the **anon** client
(`supabase-browser.js`). The only authority preventing owner A from writing into
owner B's `{unidade_id}/` namespace is the database RLS policy
`unidades_fotos_insert_proprietario` and its `SECURITY DEFINER` helper
`storage_unidade_owned_by_auth` (migration `20260601000000_v15_foundation.sql`).
Verified present in repo migrations:
- bucket `unidades-fotos` created with `public=false` (private) — line 16-18
- INSERT / SELECT / DELETE policies all gated on the ownership helper — lines 62-83
- helper guards malformed UUID via `EXCEPTION WHEN OTHERS THEN RETURN FALSE` — lines 45-48
- `anon` REVOKE / `authenticated` GRANT on the helper — lines 52-53

This control lives in migration SQL, not application code. The audit confirms it
is committed to the repo; live deployment of this migration to project
`vfymttcajeyhrmsyhrtj` is assumed (not re-verified against the live DB in this audit).

---

## Residual Risk — MIME/size validation is client-side only (ASVS L1 assessment)

T-19-07's MIME `image/*` + `<2MB` checks (`UnifiedUnidadeModal.js:122,126`) run
in the browser only. A motivated authenticated proprietário can bypass them
(DevTools / direct API call) and upload a non-image or oversized object into
**their own** `{unidade_id}/` namespace. There is no server-side content-type or
size enforcement on the Storage object (the Server Action only ever receives the
path string, never the binary).

**Assessment: ACCEPTABLE at ASVS L1 for this TCC context.** Rationale:
- The only actor who can pass RLS is the single trusted proprietário writing into
  their own namespace — this is a self-inflicted integrity issue, not a
  cross-tenant or privilege escalation vector (T-19-09 remains intact via RLS).
- The bucket is private; objects are served only via short-lived signed URLs to
  the same owner, so a mis-typed object cannot be weaponised against other users.
- No server-side image processing pipeline exists that an oversized/malformed file
  could exploit.
- Hardening path (post-TCC, not blocking): a Supabase Storage `allowed_mime_types`
  + `file_size_limit` on the bucket, or an Edge Function upload proxy, would move
  this enforcement server-side. Recommended for any multi-tenant production use.

---

## Accepted Risks Log

| ID | Risk | Accepted Condition (verified) |
|----|------|-------------------------------|
| T-19-04 | Orphan Storage object left if best-effort cleanup fails during delete | Cleanup runs only after ownership verified, on private bucket, failure swallowed; orphan is invisible (private bucket, no DB reference). Best-effort by design (D-11). |
| T-19-05 | `public/images/unidade-exemplo.jpg` publicly served | Generic building placeholder, no PII; intentionally public (D-09). Verified: valid JPEG, 34502 bytes. |
| T-19-10 | Signed upload-preview URL (TTL 3600s) could leak the owner's own cover photo | `expiresIn: 3600`; bucket `public=false`; URL not persisted across sessions. Accepted for TCC. |
| T-19-12 | Signed URL on card render (TTL 3600s) | `expiresIn: 3600`, regenerated per render in `useFotoSignedUrl`, never persisted; private bucket. Accepted for TCC. |
| RESIDUAL-07 | Client-side-only MIME/size validation (see Residual Risk section) | Single trusted owner, own namespace, private bucket, no server image pipeline. Acceptable at ASVS L1. Server-side bucket limits recommended post-TCC. |

---

## Unregistered Flags

None. All four plan SUMMARY `## Threat Flags` sections report "no new threat
surface beyond the plan's threat model." No new endpoints, auth paths, schema
changes, or packages appeared during implementation. No unregistered attack
surface detected.
