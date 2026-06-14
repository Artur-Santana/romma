---
phase: 18-acesso-login-cadastro-redefinir
slug: acesso-login-cadastro-redefinir
status: verified
threats_total: 17
threats_open: 0
asvs_level: 1
created: 2026-06-14
---

# Phase 18 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time across four PLAN.md `<threat_model>` blocks (18-01..18-04).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser → Server Action (`cadastrarProprietario`) | Untrusted signup fields cross into server-side signUp | email, senha, nome, sobrenome, telefone |
| Browser form → client validation | Untrusted user input validated client-side before submit | signup/reset form fields |
| Browser → Supabase Auth (signInWithPassword) | Untrusted credentials cross to auth | email, senha |
| Email link → Route Handler (`/auth/confirm`) | Untrusted token_hash/code from email crosses into verifyOtp + admin INSERT | one-time OTP token / PKCE code |
| Route Handler → Postgres (supabaseAdmin) | service-role write into `proprietarios` bypasses RLS | usuario_id + metadata |
| Email recovery link → recovery session | One-time token grants temporary password-change capability | recovery session cookie |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-18-01 | Tampering | signUp options.data metadata | accept | JSONB in auth.users; values reach `proprietarios` only via parameterized supabase-js insert (`route.js:35-37`). See Accepted Risks. | closed |
| T-18-02 | Elevation of Privilege | supabaseAdmin in confirm/route.js | mitigate | `import 'server-only'` guard on `src/lib/supabaseAdmin.js:2`; imported only by route handlers + Server Actions, never by `'use client'` files (verified: no leak). | closed |
| T-18-03 | Spoofing | recovery/signup OTP token replay | mitigate | `verifyOtp` invalidates one-time token (Supabase default); route does not re-accept used tokens — `route.js:69`. | closed |
| T-18-04 | Information Disclosure | empty metadata → null proprietarios rows | mitigate | metadata read only from verifyOtp response (`route.js:81` user_metadata); columns nullable; INSERT after verifyOtp only. | closed |
| T-18-05 | Tampering | client-only password policy | accept | `validarSenha` is a UX guardrail; Supabase enforces ≥6 server-side. `src/lib/auth-form.js:50-59`. See Accepted Risks. | closed |
| T-18-06 | Input Validation | email/phone regex bypass via direct API | accept | Pure helpers, no I/O; direct API call still hits Supabase validation. `src/lib/auth-form.js`. See Accepted Risks. | closed |
| T-18-07 | Information Disclosure | login error banner enumeration | mitigate | Generic `Credenciais inválidas` for all failures — `src/app/login/page.js:116`. Same copy for unknown email vs wrong password. | closed |
| T-18-08 | Spoofing | "manter sessão" implies stronger control | accept | Cosmetic checkbox; sessions persist via @supabase/ssr cookies regardless. `src/app/login/page.js:172-204`. See Accepted Risks. | closed |
| T-18-09 | Tampering | client validation bypassable | mitigate | `validarCadastro(form)` gates submit (`signup/page.js:67`); `soDigitos(form.telefone)` ensures digits-only to DB (`signup/page.js:79`); parameterized insert. | closed |
| T-18-10 | Elevation of Privilege | supabaseAdmin import in client page | mitigate | signup page imports only Server Action `cadastrarProprietario` (`signup/page.js:7`); never supabaseAdmin. `server-only` guard enforces. | closed |
| T-18-11 | Spoofing | recovery token replay | mitigate | `verifyOtp`/`exchangeCodeForSession` invalidate one-time token; `updateUser` requires live recovery session cookie (`reset-password/page.js:104`). | closed |
| T-18-12 | Elevation of Privilege | wrong-role redirect after reset | mitigate | Unconditional `/portal/dashboard` replaced by `rpc("is_proprietario")` branch — `reset-password/page.js:113-114`. RLS still enforces access. | closed |
| T-18-13 | Information Disclosure | reset request reveals account existence | accept | `resetPasswordForEmail` returns success uniformly (Supabase default); `E-MAIL_ENVIADO · 200` banner shown regardless. See Accepted Risks. | closed |
| T-18-14 | Tampering | weak new password via define-flow | mitigate | `validarSenha(form.senha)` blocks before `updateUser` (`reset-password/page.js:92-96`); Supabase ≥6 backstop. | closed |
| T-18-SC | Tampering | npm/pip/cargo installs (Plan 01) | mitigate | No package installs this phase (`git log main..HEAD -- package.json` empty). | closed |
| T-18-SC | Tampering | npm installs (Plan 02) | mitigate | Same — no installs. | closed |
| T-18-SC | Tampering | npm installs (Plans 03/04) | mitigate | Same — no installs. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

> Note: T-18-SC appears as one row per plan in the source threat models; all resolve to the same evidence (no package.json delta in this phase). Counted as 3 toward `threats_total` to match the four authored registers.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-18-01 | T-18-01 | signUp metadata stored as JSONB; no SQL surface; reaches `proprietarios` only via parameterized insert. TCC scope. | plan author (18-01) | 2026-06-14 |
| AR-18-02 | T-18-05 | Client-side uppercase/number policy is a UX guardrail; Supabase enforces ≥6 server-side (bcrypt). TCC scope (RESEARCH A1). | plan author (18-02) | 2026-06-14 |
| AR-18-03 | T-18-06 | email/phone helpers are pure formatting/validation with no I/O; direct API calls still hit Supabase validation. No elevation. | plan author (18-02) | 2026-06-14 |
| AR-18-04 | T-18-08 | "Manter sessão" is cosmetic; @supabase/ssr cookie sessions always persist — honest, no false security boundary. | plan author (18-03) | 2026-06-14 |
| AR-18-05 | T-18-13 | Uniform success banner on reset request matches Supabase default no-enumeration behavior. | plan author (18-04) | 2026-06-14 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-14 | 17 | 17 | 0 | gsd-security-auditor |

### Cross-reference: code review fixes verified present in current code

| Review ID | Threat Tie | Verified Evidence |
|-----------|------------|-------------------|
| CR-01 (PKCE promotes locatário) | T-18-10 / role integrity | `route.js:114` — code path promotes only when `meta.nome` present; recovery routed out first. |
| CR-02 (recovery cookies lost) | T-18-11 | `route.js:48-55` `redirectComSessao` copies staged cookies onto redirect; used at every redirect. |
| CR-03 (SITE_URL fallback) | config / link integrity | `auth.js:32-35` — `NEXT_PUBLIC_SUPABASE_URL` fallback removed; fails closed with status 500. |
| Recovery PKCE routing (`?next=recovery`) | T-18-11/T-18-12 | `reset-password/page.js:76` sends `?next=recovery`; `route.js:105` routes recovery → `/auth/reset-password`. |

---

## Unregistered Flags

None. All four `18-0N-SUMMARY.md` `## Threat Flags` sections report "None" and map to existing register IDs.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-14
