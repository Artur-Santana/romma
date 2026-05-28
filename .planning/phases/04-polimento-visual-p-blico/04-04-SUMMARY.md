---
phase: 04-polimento-visual-publico
plan: "04"
subsystem: dashboard
tags: [locatarios, editar, modal, server-action, shadcn]

requires:
  - phase: 01-autenticacao-e-dashboard
    provides: LocatariosDesktop.js com listagem e invite modal

provides:
  - Edição de locatário via botão "Editar" em cada linha de locatário aceito
  - Modal de edição pré-preenchido com nome_razao_social, tipo (PF/PJ via Select), documento, email, telefone
  - Server Action editarLocatario em src/actions/locatarios.js
  - Integração com handleSalvarLocatario: chama Server Action, fecha modal em sucesso, exibe erroMessage em erro

affects:
  - src/components/features/LocatariosDesktop.js (editado)
  - src/actions/locatarios.js (nova Server Action editarLocatario)

tech-stack:
  added: []
  patterns:
    - "Botão Editar aparece apenas para locatários com status aceito (!isPendente)"
    - "Estado editandoId + formEdit para controlar qual locatário está sendo editado"
    - "Modal com overlay fixed, campos pré-preenchidos, shadcn Select para tipo PF/PJ"
    - "Server Action retorna { status: 200 } ou { status: 500, erroMessage: '...' }"

key-files:
  modified:
    - path: src/components/features/LocatariosDesktop.js
      role: "Feature component — adiciona fluxo de edição inline com modal"
    - path: src/actions/locatarios.js
      role: "Server Action editarLocatario — valida auth, atualiza locatario no DB"

commits:
  - hash: 8eae93a
    message: "feat(04-04): implementar edição de locatário em LocatariosDesktop.js"
    tasks: [1]

## Self-Check: PASSED

All must_haves verified:
- Botão "Editar" presente para locatários aceitos em LocatariosDesktop.js ✓
- Modal abre com campos pré-preenchidos (nome_razao_social, tipo, documento, email, telefone) ✓
- handleEditarLocatario(locatario) implementado ✓
- handleSalvarLocatario() implementado com Server Action ✓
- Modal fecha em sucesso, exibe erroMessage em erro ✓
- Locatários pendentes não exibem botão Editar ✓
- Modal de convite original permanece inalterado ✓
