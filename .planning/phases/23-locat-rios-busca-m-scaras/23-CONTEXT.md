# Phase 23: Locatários — Busca & Máscaras - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

O Proprietário gerencia Locatários em **componente único** com: grade de cards no desktop, lista de rows com ações expostas no mobile, busca client-side por nome/e-mail/documento, máscaras de CPF/CNPJ/telefone com armazenamento só de dígitos, e ações de reenviar/revogar/editar acessíveis em ambos os layouts.

Cobre **LOC-01 a LOC-06**. Não altera schema, não cria novas tabelas. Dependência de tokens da Phase 17.

**Fora de escopo:** medidor de adimplência por locatário (removido a pedido, ver design README), qualquer Realtime, histórico de acessos, filtros além de busca textual.

</domain>

<decisions>
## Implementation Decisions

### Componente principal (LOC-01 a LOC-06)

- **D-01 (Componente alvo):** Evoluir `LocatariosDesktop.js` para cobrir desktop + mobile — renomear/substituir `Locatarios.js` ao final. Padrão idêntico às outras telas: **um único componente** com `romma-desktop-only` / `romma-mobile-only` separando os dois layouts. `page.js` importa um único componente.
- **D-02 (Desktop — cards):** Grade `display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px`. Cada card: Avatar com inicial + nome (`r-subhead`), tipo + documento formatado (`r-meta`), email (`r-meta`), footer com badge status + contador "N/M contrato(s)" + ações. Igual `console3.jsx:447-480`.
- **D-03 (Mobile — rows com ações expostas):** Lista dentro de `r-panel`. Cada row: Avatar + nome + badge. Footer da row (sempre visível, sem hover-reveal): ações Reenviar/Revogar para pendentes; contador + Editar para ativos. Igual `console3.jsx:490-543`.
- **D-04 (Avatar):** Componente inline simples — quadrado 40×40 (desktop) / 32×32 (mobile), fundo `--indigo` com opacidade reduzida quando `pendente`, inicial da `nome_razao_social` em `var(--font-mono)`. Não requer shadcn Avatar.

### Busca (LOC-01)

- **D-05:** Busca **client-side** sobre a lista já carregada. `q` filtro: `(l.nome_razao_social + " " + l.email + " " + l.documento).toLowerCase().includes(q.toLowerCase())`. Campo `documento` no filtro usa valor bruto (só dígitos) para funcionar mesmo sem máscara no input de busca. Exibir contador `{N} resultado(s)` quando `q` não vazio. Igual `console3.jsx:413-416`.

### Máscaras (LOC-02, LOC-03)

- **D-06 (Funções de máscara):** Declarar no componente (não em lib separada):
  - `onlyDigits(s)` → strip não-dígitos
  - `maskCPF(v)` → `000.000.000-00` (11 dígitos)
  - `maskCNPJ(v)` → `00.000.000/0000-00` (14 dígitos)
  - `maskDocumento(tipo, v)` → dispatch por tipo
  - `maskPhone(v)` → `(11) 99999-9999` ou `(11) 99999-9999` (10 ou 11 dígitos)
  - `fmtDoc(tipo, doc)` → formata valor armazenado (só dígitos) para exibição nos cards
- **D-07 (Tipo PF/PJ no convite):** Segmented control: dois botões `PF` / `PJ`. Ao trocar o tipo: `setForm({ ...form, tipo: t, documento: maskDocumento(t, form.documento) })` — re-formata os dígitos existentes para o novo padrão sem digit-jumble. Igual `console3.jsx:566-567`.
- **D-08 (Strip antes da SA):** Handler de submit do convite faz `onlyDigits(form.documento)` e `onlyDigits(form.telefone)` antes de chamar `convidarLocatario`. SA já valida `DOCUMENTO_RE = /^\d{11}$|\d{14}$/`. Telefone: strip para 10-11 dígitos antes de persistir.
- **D-09 (Editar — campos):** Modal de edição: **só nome, e-mail, telefone** (com máscara no input; strip antes de salvar). Tipo e documento **não editáveis** pós-convite. SA `editarLocatario` recebe `{ nome_razao_social, email, telefone }` (sem tipo/documento) — precisa ajustar para não sobrescrever campos não enviados.

### Reenviar convite (LOC-04)

- **D-10 (Nova SA `reenviarConvite`):** Export em `src/actions/locatarios.js`. Lógica:
  1. `authGuard()` + UUID_RE validate
  2. Buscar locatário: `eq('proprietario_id', user.id)` + `select('email, status_convite')`
  3. Guard: `if (loc.status_convite !== 'pendente') return { status: 400, erroMessage: '...' }`
  4. `supabaseAdmin.auth.admin.inviteUserByEmail(loc.email, { redirectTo: SITE_URL + '/auth/confirm' })`
  5. Retornar `{ status: 200 }` ou `{ status: 5xx, erroMessage }`
- **D-11 (Feedback reenvio):** Client-side: `resent` Set com `setTimeout` de 2200ms — botão muda para `"✓ Reenviado"` em `--success` durante esse período, sem reload da lista. Igual `console3.jsx:412-413`.

### Revogar acesso (LOC-05)

- **D-12:** SA `revogarConvite` já existe e funciona (valida pendente, sem contratos). Frontend precisa adicionar modal de confirmação (ação destrutiva) antes de chamar. Usar `ConfirmDialog` ou modal inline igual ao padrão de `console3.jsx:421-423`.

### Contador de contratos no card

- **D-13:** `contratos` já passado como prop na `page.js` (`getContratos()` já na query existente). Derivar client-side: `cs = contratos.filter(c => c.locatario_id === l.id)`, `ativosCount = cs.filter(c => c.status === 'ativo').length`. Exibir `{ativosCount}/{cs.length} contrato(s)`. Sem query extra.

### Claude's Discretion

- Posição exata do campo de busca (acima da grade, com ícone `⌕` ou sem).
- Se `LocatariosDesktop.js` é editado in-place ou se um novo `Locatarios.js` é criado e o antigo removido.
- Skeleton loading para a fase (se aplicar o padrão das outras telas).
- Animação de remoção ao revogar (opacity/scale 220ms — padrão já estabelecido).
- Ajuste exato da SA `editarLocatario` para não sobrescrever tipo/documento (pode ser update parcial ou whitelist de campos).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design (fonte visual canônica)
- `.planning/design/js/console3.jsx` — `LocatariosScreen` (linhas 401-593): cards desktop, rows mobile com ações, busca, segmented PF/PJ, máscaras CPF/CNPJ/telefone, reenviar/revogar/editar — **portar para o codebase real trocando dados mock por Supabase**.
- `.planning/design/screenshots/desktop/09-locatarios.png` — Alvo visual desktop.
- `.planning/design/screenshots/mobile/09-locatarios.png` — Alvo visual mobile.
- `.planning/design/README.md` §"Locatários" — variante B escolhida + lista de features + itens removidos.
- `.planning/design/styles/app.css` — Tokens de refino (`--rt-*`, `--rd-*`).
- `src/app/globals.css` — Tokens de produção (`--indigo`, `--success`, `--danger-fg`, `--surface-hi`, `--border-3`, `--font-mono`).

### Código a estender
- `src/components/features/LocatariosDesktop.js` — Componente atual a evoluir: adicionar busca, cards desktop, rows mobile com ações, máscaras, reenviar. Substituirá `Locatarios.js` ao final.
- `src/components/features/Locatarios.js` — Versão antiga (190L) a ser substituída/removida após evolução do LocatariosDesktop.js.
- `src/actions/locatarios.js` — SAs existentes: `convidarLocatario`, `editarLocatario`, `deletarLocatario`, `revogarConvite`. Adicionar `reenviarConvite`. Ajustar `editarLocatario` para whitelist de campos.
- `src/lib/queries-client.js` §`getLocatarios` — já retorna `status_convite`; sem mudança necessária.
- `src/app/dashboard/locatarios/page.js` — já passa `contratos` como prop; verificar se ajuste é necessário após renomear componente.

### Padrão de referência (mesma estrutura)
- `src/components/features/Unidades.js` — exemplo canônico de `romma-desktop-only`/`romma-mobile-only` no mesmo componente (linhas 39, 54, 459, 571).
- `src/components/features/Contratos.js` — mesmo padrão de componente único desktop+mobile.

### Requisitos
- `.planning/REQUIREMENTS.md` — LOC-01 a LOC-06.
- `.planning/ROADMAP.md` §"Phase 23" — Goal + 5 Success Criteria.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `revogarConvite` (`src/actions/locatarios.js:91-113`): SA completa, valida pendente + sem contratos + deleta auth user. Só falta o modal de confirmação no frontend.
- `editarLocatario` (`src/actions/locatarios.js:63-77`): SA funcional; ajuste necessário para whitelist nome/email/telefone (não enviar tipo/documento).
- `convidarLocatario` (`src/actions/locatarios.js:10-61`): SA funcional; já valida `DOCUMENTO_RE` (só dígitos) + `EMAIL_RE`. Strip de máscara deve ocorrer no handler antes de chamar.
- `getLocatarios` (`src/lib/queries-client.js:15-18`): já retorna `status_convite`. Sem extensão necessária.
- `getInitials(name)` (`LocatariosDesktop.js:27-30`): já existe — reusar para Avatar component inline.
- `fmtDoc(tipo, doc)` (`LocatariosDesktop.js:19-24`): já existe — manter.
- `toast` (sonner), `PageHeader`, `StatusBadge`: já importados em `LocatariosDesktop.js`.
- `removingIds` Set + opacity/scale 220ms: já implementado em `LocatariosDesktop.js`.

### Established Patterns
- `romma-desktop-only` / `romma-mobile-only`: classes CSS para separar layouts no mesmo componente (ver `Unidades.js`, `Contratos.js`).
- Form state objeto único + `setForm({ ...form, key: val })` + reset via função nomeada.
- `authGuard()` local em cada arquivo de actions (não compartilhado).
- UUID_RE redeclarado por arquivo de action.
- Feedback temporário: `Set` + `setTimeout` (padrão `removingIds`; adaptar para `resent`).
- `style={{ all: "unset", cursor: "pointer", ... }}` para botões fantasma (ghost buttons).

### Integration Points
- `reenviarConvite` usa `supabaseAdmin.auth.admin.inviteUserByEmail` (mesmo método de `convidarLocatario`).
- Frontend chama `reenviarConvite(id)` → sem reload; só atualiza estado local `resent`.
- Contador de contratos: `contratos` prop já existe em `page.js`; derivação client-side por `locatario_id`.
- Após `revogarConvite` sucesso: remover locatário do estado local com animação (padrão `removingIds` existente).

</code_context>

<specifics>
## Specific Ideas

- Segmented PF/PJ: ao trocar tipo, re-formatar documento mantendo os dígitos (`maskDocumento(novoTipo, form.documento)`) — evita "digit-jumble" onde os dígitos somem ou re-aparecem fora de posição.
- Busca inclui `l.documento` (dígitos brutos) no filtro — usuário pode digitar CPF com ou sem pontuação e encontrar.
- "✓ Reenviado" com 2200ms timeout — feedback visual sem poluir o estado permanente.
- Cards com opacidade reduzida no avatar quando `status_convite === 'pendente'` — sinaliza convite pendente.

</specifics>

<deferred>
## Deferred Ideas

- Medidor de adimplência por locatário — removido a pedido (design README §"Não implementar").
- Histórico de acessos/logins por locatário — pós-TCC.
- Filtros por status (ativos/pendentes) — busca textual cobre o caso de uso do TCC.
- Edição de tipo e documento — não permitida pós-convite (decisão da fase).

</deferred>

---

*Phase: 23-locat-rios-busca-m-scaras*
*Context gathered: 2026-06-17*
