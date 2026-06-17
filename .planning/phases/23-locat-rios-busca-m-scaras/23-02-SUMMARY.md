---
plan: 23-02
phase: 23-locat-rios-busca-m-scaras
status: complete
requirements: [LOC-01, LOC-02, LOC-03, LOC-05, LOC-06]
key-files:
  created: []
  modified:
    - src/components/features/LocatariosDesktop.js
  deleted:
    - src/components/features/Locatarios.js
---

## What Was Built

**Task 1 — Lógica (máscaras, busca, estado):**
Funções puras `onlyDigits`, `maskCPF`, `maskCNPJ`, `maskDocumento`, `maskPhone` adicionadas no topo do módulo. Estado `q` (busca), `resent` (Set de UUIDs com feedback visual), `confirmRevogarId` (ConfirmDialog). Derivação `view = locatarios.filter(...)` para busca client-side por nome/e-mail/documento. `handleConvidar` faz strip via `onlyDigits` antes de chamar a SA. `handleEditarLocatario` inicializa `formEdit` com `maskPhone(telefone)` e sem tipo/documento. `handleSalvarLocatario` chama `editarLocatario` com whitelist nome/email/telefone (onlyDigits no telefone). `handleReenviar` usa Set de UUIDs para evitar Pitfall 5, timeout 2200ms. `handleRevogar` usa `toast.error` para feedback de falha (contratos vinculados).

**Task 2 — Layout duplo:**
Desktop: grade `repeat(auto-fill, minmax(300px, 1fr))` com cards contendo Avatar inline (size=40), nome/tipo/doc, email, StatusBadge, contador contratos, ghost buttons. Mobile: rows com ações sempre visíveis no footer (sem hover-reveal). Campo de busca com ícone ⌕ e contador `{N} resultado(s)`. ConfirmDialog para revogar. Modal editar reduzido a Nome/Email/Telefone. Segmented PF/PJ re-mascara documento ao trocar tipo. `Locatarios.js` removido.

**Fixes pós-checkpoint (Issues 5 e 6):**
`reenviarConvite` SA: delete auth user + re-invite → update `usuario_id` para contornar erro "already registered" do Supabase. `handleRevogar`: substituído `setErro` por `toast.error` para que o feedback de falha apareça na view principal.

## Deviations

- `handleRevogar` usa `toast.error` em vez de `setErro` — o estado `erro` só é renderizado dentro dos modais, não na view principal.

## Self-Check: PASSED

- Busca client-side por nome/e-mail/documento com contador
- Máscaras CPF/CNPJ/telefone; re-formatação ao trocar PF↔PJ
- Layout duplo desktop (cards) + mobile (rows com ações expostas)
- Reenviar com "✓ Reenviado" 2200ms sem reload
- ConfirmDialog antes de revogar; toast.error em falha
- Modal editar sem tipo/documento; maskPhone no input
- Locatarios.js removido
- ESLint limpo em ambos os arquivos
- Aprovado em checkpoint humano
