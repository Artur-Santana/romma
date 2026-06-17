---
plan: 23-01
phase: 23-locat-rios-busca-m-scaras
status: complete
requirements: [LOC-03, LOC-04]
key-files:
  created: []
  modified:
    - src/actions/locatarios.js
---

## What Was Built

**Task 1 — SA `reenviarConvite` (LOC-04):**
Exportada em `src/actions/locatarios.js` seguindo o padrão de `revogarConvite`. Fluxo: auth guard → UUID_RE → select com `.eq('proprietario_id', user.id)` (fecha IDOR) → guard `status_convite !== 'pendente'` → `inviteUserByEmail` com `redirectTo: SITE_URL/auth/confirm`. Retorna `{ status: 200 }` ou `{ status: 4xx|5xx, erroMessage }`.

**Task 2 — Whitelist `editarLocatario` (LOC-03, D-09):**
Removidos `tipo` e `documento` da desestruturação do form e do objeto passado ao `.update()`. A SA agora aceita e persiste apenas `{ nome_razao_social, email, telefone }`, sem regredir tipo/documento do locatário.

## Deviations

Nenhum.

## Self-Check: PASSED

- `reenviarConvite` exportada com guard IDOR (`proprietario_id`) e guard de pendente
- `editarLocatario` sem `tipo`/`documento` na desestruturação nem no `.update()`
- `npx eslint src/actions/locatarios.js` — sem issues
- Nenhuma outra SA alterada
