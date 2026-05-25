# Phase 3: Refatoração e Qualidade - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 03-refatora-o-e-qualidade
**Areas discussed:** Lint warnings scope, Fixes de segurança HIGH, REF-04 scope, Logout no portal

---

## Lint Warnings Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fase 3 corrige os warnings | Substitui `<img>` por `next/image` agora, sem redesenho | |
| Fase 4 resolve junto com VIS-01 | Aceitar 8 warnings até fase de redesenho; DEPL-03 passa com "sem warnings críticos" | ✓ |

**User's choice:** Defer para Fase 4 — usuário perguntou primeiro "isso impede a conclusão da fase?" e ao confirmar que não impede (são warnings não-críticos, não errors), optou por deferir.
**Notes:** Os 2 errors `set-state-in-effect` (distintos dos 8 warnings) DEVEM ser corrigidos — são `errors` que efetivamente bloqueiam DEPL-03.

---

## Fixes de Segurança HIGH

| Option | Description | Selected |
|--------|-------------|----------|
| Incluir ambos na Fase 3 | Auth bypass + allowlist — 5-10 linhas cada | ✓ |
| Só o allowlist de editarLocatario | Auth bypass requer query extra; allowlist é 1 linha | |
| Nenhum — manter escopo original | Fase 3 = só REF-01..04 | |

**User's choice:** Incluir ambos.
**Notes:** Qualidade inclui segurança. Sem os fixes, o sistema vai à banca com bypass de autorização real.

---

## REF-04 Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Consolidar in-place | Refatoração mínima nos legados | |
| Consolidar e remover legados | Remove Unidades.js e Locatarios.js se Desktop já cobre | |
| Auditar primeiro | Podem já estar consolidados | ✓ |

**User's choice:** Auditar primeiro.
**Notes:** Auditoria confirmou que `form` e `formEdit` já são objetos em todos os 3 arquivos. Estados restantes (`edificios`, `editandoId`, `erro`, `loading`) são legítimos e não devem ser consolidados. REF-04 está essencialmente cumprido.

---

## Logout no Portal

| Option | Description | Selected |
|--------|-------------|----------|
| Sim — incluir logout no portal | Locatário não tem como sair; funcionalidade mínima | ✓ |
| Não — portal funciona sem logout por ora | Fase 3 já tem escopo crescendo | |

**User's choice:** Incluir logout.
**Notes:** Ideia deferida da Fase 2 explicitamente para Fase 3. TopStrip ou canto do PortalDashboard. Se TopStrip for Server Component, criar `LogoutButton.js` Client Component.

---

## Claude's Discretion

- Localização exata do botão de logout (TopStrip vs PortalDashboard)
- Abordagem do fix `set-state-in-effect` — solução mais simples que elimina o error sem aumentar complexidade

## Deferred Ideas

- `@next/next/no-img-element` warnings (8x em `src/app/page.js`) → Fase 4 VIS-01
- `criarContrato + gerarParcelas` não-atômicos (CONCERNS.md #5 HIGH) → fora do escopo das phases planejadas
- Issues MEDIUM do CONCERNS.md → fora do escopo
