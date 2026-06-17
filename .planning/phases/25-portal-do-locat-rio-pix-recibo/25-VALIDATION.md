---
phase: 25
slug: portal-do-locat-rio-pix-recibo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit) + Playwright (E2E) |
| **Config file** | `vitest.config.js` / `playwright.config.js` |
| **Quick run command** | `npx vitest run test/actions/parcelas.test.js` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds (unit); E2E separate |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run test/actions/parcelas.test.js`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full unit suite green + `npm run build` clean (SSR safety for jsPDF dynamic import)
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-xx | 01 | 1 | PORT-06 | T-25-01 (IDOR) | Locatário só paga parcela do próprio contrato; cross-tenant → 404 | unit (TDD) | `npx vitest run test/actions/parcelas.test.js` | ❌ W0 | ⬜ pending |
| 25-02-xx | 02 | 2 | PORT-04 | — | Próximo vencimento + progresso renderizam de todas as parcelas | manual/E2E | Playwright portal flow | ✅ | ⬜ pending |
| 25-03-xx | 03 | 2 | PORT-05 | — | Modal PIX, copiar código, confirmar → status paga | manual/E2E | Playwright portal flow | ✅ | ⬜ pending |
| 25-04-xx | 04 | 3 | PORT-07 | — | Recibo PDF gera no browser sem crash SSR | manual + build | `npm run build` (SSR) + manual download | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/actions/parcelas.test.js` — adicionar `describe('confirmarPagamentoLocatario')` com helper 3-hop (mirror do guard 4-hop existente). Casos: dono paga (200), parcela de outro locatário (404), inexistente (404), não autenticado (401), já paga (no-op).

*Vitest infra já existe (test/helpers/supabaseMock.js). Sem novo framework.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Recibo PDF gera e baixa no browser | PORT-07 | jsPDF roda só no browser; geração de blob não testável em unit headless de forma confiável | Em produção/preview, marcar parcela paga → clicar "Baixar comprovante" → PDF abre com valor/parcela/locatário/unidade/datas/forma PIX/código autenticação |
| Modal PIX exibe QR + copiar código | PORT-05 | Interação visual + clipboard | Abrir portal → "Pagar Agora" → QR visível, botão copiar funciona, nota "pagamento real não processado" presente |
| Baixa reflete no painel do Proprietário | PORT-06 | Sync refresh-based cross-sessão | Pagar no portal → refresh dashboard Proprietário → parcela "Paga" na Visão Geral + detalhe contrato |
| Build SSR-safe | PORT-07 | jsPDF não pode quebrar SSR | `npm run build` exit 0 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
