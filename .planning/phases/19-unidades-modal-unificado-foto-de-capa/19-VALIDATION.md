---
phase: 19
slug: unidades-modal-unificado-foto-de-capa
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-14
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.60.0 (E2E only) |
| **Config file** | `playwright.config.js` |
| **Quick run command** | `npx playwright test e2e/crud-unidades.spec.js --project=chromium` |
| **Full suite command** | `npx playwright test --project=chromium` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| W0 | 0 | UNID-01..05 | — | N/A | E2E setup | `npx playwright test e2e/crud-unidades.spec.js --project=chromium` | ❌ W0 (atualizar seletores p/ modal) | ⬜ pending |
| UNID-01 | 3 | UNID-01 | — | N/A | E2E | `npx playwright test e2e/crud-unidades.spec.js -k "métricas" --project=chromium` | ❌ W0 | ⬜ pending |
| UNID-02 | 3 | UNID-02 | — | N/A | E2E | `npx playwright test e2e/crud-unidades.spec.js -k "busca\|filtro" --project=chromium` | ❌ W0 | ⬜ pending |
| UNID-03 | 1 | UNID-03 | — | N/A | E2E | `npx playwright test e2e/crud-unidades.spec.js -k "criar\|editar" --project=chromium` | ❌ atualizar | ⬜ pending |
| UNID-04 | 2 | UNID-04 | T-19 upload arbitrário / IDOR | MIME image/* + <2MB; path `{unidade_id}/{uuid}.{ext}`; RLS `storage_unidade_owned_by_auth` | Manual + E2E | `npx playwright test e2e/crud-unidades.spec.js -k "foto" --project=chromium` | ❌ W0 | ⬜ pending |
| UNID-05 | 2 | UNID-05 | T-19 IDOR delete | ConfirmDialog antes do delete; cleanup best-effort; `edificio.proprietario_id === user.id` | E2E | `npx playwright test e2e/crud-unidades.spec.js -k "deletar" --project=chromium` | ❌ atualizar | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `e2e/crud-unidades.spec.js` — atualizar seletores para o novo fluxo modal (botão abre `UnifiedUnidadeModal`, não form inline); adicionar specs para UNID-01 (métricas), UNID-02 (busca/filtro), UNID-05 (ConfirmDialog aparece antes do delete)
- [ ] `e2e/toast-unidades.spec.js` — verificar seletores de Remover (agora exige confirmação prévia)

*Infra de testes (Playwright, global-setup, seed) já existe — sem gaps de framework.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Upload real de foto persiste no bucket privado e exibe via signed URL | UNID-04 | Storage real exige sessão autenticada + arquivo binário; difícil em E2E headless determinístico | No dashboard, abrir modal de unidade → arrastar/selecionar imagem <2MB → salvar → reabrir e confirmar preview carrega via signed URL |
| Foto órfã removida do Storage antes do delete no banco | UNID-05 | Verificação de ausência do objeto no bucket exige inspeção do Storage | Criar unidade com foto → remover unidade → confirmar objeto sumiu do bucket `unidades-fotos` |
| "Usar foto de exemplo" salva path `/public` direto (não passa pelo Storage) | UNID-04 | Confirma que asset estático não gera upload | Abrir modal → "usar foto de exemplo" → salvar → confirmar `foto_url` = path público, sem objeto novo no bucket |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
