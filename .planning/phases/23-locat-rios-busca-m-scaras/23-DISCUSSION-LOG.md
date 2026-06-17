# Phase 23: Locatários — Busca & Máscaras - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 23-locat-rios-busca-m-scaras
**Areas discussed:** Componente principal, SA reenviarConvite, Campos editáveis, Estrutura mobile/desktop, Contador de contratos no card

---

## Componente principal

| Option | Description | Selected |
|--------|-------------|----------|
| Reescrever Locatarios.js | Substituir 190L por versão completa seguindo console3.jsx | |
| Evoluir LocatariosDesktop.js | Estender 17.7K existente adicionando busca, máscaras, cards, mobile actions | ✓ |

**User's choice:** Evoluir LocatariosDesktop.js
**Notes:** Usuário perguntou como outras rotas tratam o ponto mobile/desktop antes de decidir. Após verificar que Unidades.js, GestaoEdificios.js e Contratos.js usam romma-desktop-only/romma-mobile-only num componente único, confirmou o mesmo padrão: LocatariosDesktop.js evolui para substituir Locatarios.js.

---

## SA reenviarConvite

| Option | Description | Selected |
|--------|-------------|----------|
| inviteUserByEmail novamente | Chamar admin.inviteUserByEmail para email do locatário pendente | ✓ |
| Endpoint alternativo | Pesquisar endpoint mais adequado no Supabase | |

**User's choice:** inviteUserByEmail novamente
**Notes:** SA nova com guard status_convite === 'pendente'. Feedback "✓ Reenviado" por 2200ms no client sem reload.

---

## Campos editáveis no modal de edição

| Option | Description | Selected |
|--------|-------------|----------|
| Só nome, e-mail, telefone | Tipo e documento não editáveis pós-convite | ✓ |
| Incluir tipo e documento | Permitir corrigir erros | |

**User's choice:** Só nome, e-mail, telefone (seguindo design console3.jsx)
**Notes:** SA editarLocatario precisa ajuste para não sobrescrever tipo/documento quando não enviados.

---

## Estrutura mobile/desktop

| Option | Description | Selected |
|--------|-------------|----------|
| Componente único com romma-desktop-only/romma-mobile-only | Padrão do codebase | ✓ |
| Dois componentes separados | LocatariosDesktop.js + Locatarios.js com classes de visibilidade | |

**User's choice:** Padrão do codebase — confirmado após investigar Unidades.js como referência canônica.

---

## Contador de contratos no card

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, incluir contador | Derivar client-side de prop `contratos` já existente na page.js | ✓ |
| Não, sem contador | Simplificar card | |

**User's choice:** Incluir contador. `contratos` já é passado como prop; derivar por `locatario_id` client-side.

---

## Claude's Discretion

- Posição exata do campo de busca (acima da grade, com ícone ⌕ ou não)
- Se LocatariosDesktop.js é editado in-place ou novo Locatarios.js criado e antigo removido
- Skeleton loading
- Animação de remoção ao revogar
- Ajuste exato da SA editarLocatario (update parcial vs whitelist)

## Deferred Ideas

- Medidor de adimplência por locatário — removido a pedido
- Histórico de acessos/logins — pós-TCC
- Filtros por status — busca textual cobre o TCC
- Edição de tipo/documento — decisão desta fase: não permitido
