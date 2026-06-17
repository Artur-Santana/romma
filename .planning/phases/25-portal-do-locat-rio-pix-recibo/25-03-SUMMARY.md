---
phase: 25-portal-do-locat-rio-pix-recibo
plan: "03"
subsystem: portal-ui
tags: [portal, locatario, pix-modal, confirmar-pagamento, qr-estatico, PORT-05, PORT-06]
dependency_graph:
  requires:
    - 25-01 (confirmarPagamentoLocatario server action)
    - 25-02 (PortalDashboard wiring — pixModal state, onSucesso callback)
  provides:
    - PixModal completo (QR estático, copia-e-cola, nota demo obrigatória, confirmar pagamento)
    - public/pix-qr.png (asset estático PNG 200x200)
  affects:
    - src/components/features/portal/PixModal.js
    - public/pix-qr.png
tech_stack:
  added: []
  patterns:
    - Modal com romma-modal-backdrop + stopPropagation (sem fechar no backdrop)
    - Estado objeto único: { loading, erro, copiado, copiouErro }
    - navigator.clipboard.writeText com try/catch (IC-03 fallback sem crash)
    - Escape key via useEffect keydown listener (IC-04)
    - PIX_CODE_CONST em nível de módulo (D-01)
    - handleFechar com reset de estado completo
key_files:
  created:
    - src/components/features/portal/PixModal.js
    - public/pix-qr.png
  modified: []
decisions:
  - "PixModal.js substitui stub criado no Plan 02 — funcionalidade completa em um único componente"
  - "public/pix-qr.png gerado via Python stdlib (zlib + struct) sem dependências externas"
  - "PIX_CODE_CONST no nível do módulo conforme D-01 (string fixa de demo, não por-proprietário)"
  - "handleCopiar usa try/catch com feedback [!] ERRO AO COPIAR por 2s (IC-03)"
  - "Escape fecha modal apenas se não estiver em loading (previne dismiss acidental)"
metrics:
  duration_seconds: 90
  completed_date: "2026-06-17"
  tasks_completed: 1
  files_changed: 2
---

# Phase 25 Plan 03: PixModal Completo + public/pix-qr.png Summary

**One-liner:** PixModal completo com QR estático 200px, cópia de código PIX com feedback try/catch, nota de demo obrigatória PORT-05, e integração com confirmarPagamentoLocatario via loading/erro/sucesso state machine.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Criar public/pix-qr.png + PixModal.js completo | d700614 | src/components/features/portal/PixModal.js, public/pix-qr.png |

---

## What Was Built

### `public/pix-qr.png` (novo)

Arquivo PNG válido de 200x200 pixels com padrão visual de QR code (finder patterns + módulos aleatórios com seed 42). Gerado via Python stdlib (zlib + struct) sem dependências externas. Serve como asset de demo estático para o TCC — o conteúdo do QR não é um BR Code real.

### `src/components/features/portal/PixModal.js` (substituído)

Substitui o stub `return null` criado pelo Plan 02. Componente `'use client'` completo:

**Constante de módulo:**
- `PIX_CODE_CONST` — string BR Code de demonstração (D-01, não secreta, aceita em T-25-09)

**Estado único:**
- `{ loading, erro, copiado, copiouErro }` — convenção de objeto único do projeto

**Handlers:**
- `handleCopiar` — `navigator.clipboard.writeText` com `try/catch`. Sucesso → `[✓] COPIADO` 2s. Falha → `[!] ERRO AO COPIAR` 2s. IC-03 compliance.
- `handleConfirmar` — chama `confirmarPagamentoLocatario(parcela.id)`, loading state, fecha + chama `onSucesso()` em `{ status: 200 }`, exibe `erroMessage` inline em erro
- `handleFechar` — reseta estado completo + chama `onClose()`

**Escape key (IC-04):**
- `useEffect` com `keydown` listener; remove listener no unmount; respeita `modal.loading` (não fecha durante confirmação)

**JSX (Surface 4 — UI-SPEC):**
- Header: eyebrow `PAGAMENTO VIA PIX`, valor BRL 32px bold via `fmtBRL(contrato?.unidades?.valor_mensal)`, subtítulo com `parcela.numero` e `fmtData(parcela.data_vencimento)`
- QR: `<img src="/pix-qr.png" />` centralizado, `w-[160px] sm:w-[200px]`
- Código copia-e-cola: box `bg-background` + botão com `cn()` condicional por estado
- Nota de demo (PORT-05 obrigatório): `"Este é um ambiente de demonstração. O pagamento real não é processado. Clique em confirmar para registrar o pagamento."` com `border-l-2 border-warning`
- Erro inline: `text-danger-fg` quando `modal.erro` presente
- Actions: CANCELAR (ghost) + CONFIRMAR (bg-indigo) — ambos desabilitados durante loading

**Backdrop:** `.romma-modal-backdrop z-[100]` com `stopPropagation` no modal body (click no fundo não fecha — IC-04)

---

## Deviations from Plan

None — plano executado exatamente como escrito.

---

## Known Stubs

None — o stub do Plan 02 foi substituído pelo componente completo. `public/pix-qr.png` é um placeholder intencional (decisão D-01 e PRD: QR estático único para TCC).

---

## Threat Flags

None — nenhuma nova superfície além do threat model documentado no plano:
- T-25-09: `PIX_CODE_CONST` no bundle JS — aceito (string de demo, não secreta)
- T-25-10: `parcela.id` → `confirmarPagamentoLocatario` — mitigado pelo guard 3-hop do Plan 01
- T-25-11: clipboard sem HTTPS — mitigado pelo try/catch em `handleCopiar`

---

## Self-Check

Files exist:
- `src/components/features/portal/PixModal.js` — contém `'use client'`, `export default function PixModal`, `confirmarPagamentoLocatario`, `PIX_CODE_CONST`, nota de demo PORT-05, `handleCopiar` com try/catch, `handleConfirmar` com loading state
- `public/pix-qr.png` — PNG válido 200x200

Commits exist:
- d700614 — feat(25-03): PixModal completo — QR, copia-e-cola, confirmar pagamento

Build: `npm run build` exit 0
Tests: `npx vitest run` 127/127 PASS

## Self-Check: PASSED
