# ✨ Fase 3 — Refinamento Visual + Deploy

# Visão Geral

Fase final antes da apresentação para a banca. Não adiciona funcionalidades — foca em **correções críticas de segurança**, polimento visual, deploy e estabilidade para a demo ao vivo.

**Pré-requisitos:** Fases 1 e 2 concluídas. Sistema funcional com ciclo completo, LP, listagem Realtime e Dashboard.

**Objetivo da fase:** O sistema precisa estar deployed no Vercel, **seguro** (sem PII pública, sem rotas privadas servidas a anônimos, sem Edge Function aberta), visualmente consistente com o design Obsidian Blueprint e estável o suficiente para uma demo ao vivo sem surpresas.

**Entrada:** Code review `docs/code-reviews/deploy-readiness-2026-04-26.md` (2026-04-26) listou 8 críticos, 8 altos, 10 médios, 7 baixos. Esta fase mapeia todos eles em sessões executáveis.

---

# Resumo das Sessões

| Sessão | Conteúdo | Severidade Coberta | Estimativa |
| --- | --- | --- | --- |
| F3-S0 | Bloqueadores absolutos pré-deploy (segurança + auth + env) | 8 Críticos | ~4-5h |
| F3-S1 | Deploy no Vercel + hardening Altos + build limpo | 5 Altos + 1 Médio | ~2h |
| F3-S2 | Refinamento visual — páginas públicas (LP + /unidades) | 2 Altos visuais | ~2h |
| F3-S3 | Refinamento visual + refatoração + Médios/Baixos do dashboard | 7 Médios + 5 Baixos | ~5-6h |
| F3-S4 | Polish final + limpeza + preparação para demo | 1 Baixo | ~1.5h |

**Total: ~14-16h**

---

# Detalhamento das Sessões

## F3-S0 — Bloqueadores Absolutos Pré-Deploy

**Objetivo:** Resolver os 8 achados **Críticos** do code review. Sem esta sessão, o deploy expõe PII de Locatários, deixa rotas privadas acessíveis a anônimos, permite POST não autenticado em `gerar-parcelas` e boota com env vars `undefined`.

**Entregavel:** Sistema com auth real na Edge Function, RLS de PII restrita, rotas privadas protegidas no servidor, login funcional via `@supabase/ssr`, logout exposto na UI, env vars documentadas corretamente.

**Tarefas — Eixo Segurança:**

- [x]  **C1.1** — Reescrever `supabase/functions/gerar-parcelas/index.ts`: extrair token do header `Authorization`, chamar `supabase.auth.getUser(token)`, verificar ownership do `contrato_id` antes de operar com service role.
- [ ]  **C1.2** — Alterar política RLS SELECT de `locatarios`: trocar role `public` / `qual = true` por role `authenticated` filtrado por `auth.uid() = usuario_id` (ou role apropriado para Proprietário).
- [x]  **C1.3** — Mascarar `valor_mensal: null` quando `valor_visivel = false` no return de `getUnidadesDisponiveis` em `queries-server.js` e `queries-client.js`. (Abordagem ajustada: mascaramento no return em vez de remoção da projeção — mantém campo para unidades visíveis.)

**Tarefas — Eixo Auth & Rotas:**

- [x]  **C2.1** — Criar `src/proxy.js` (middleware Next.js 16) usando `supabase-server.js`: validar sessão antes de renderizar qualquer rota `dashboard/**`. Redirect para `/login` se ausente.
- [x]  **C2.2** — Em `src/app/login/page.js`: trocar import de `src/lib/supabase.js` por `src/lib/supabase-browser.js` (`createBrowserClient` de `@supabase/ssr`). Sem isso, sessão fica em `localStorage` e `proxy.js` (que lê cookies) não a enxerga → loop de redirect.
- [x]  **C2.3** — Criar `src/components/ui/HeaderDashboard.js` (client component com nav + logout) e `src/app/dashboard/layout.js` (aplica header em todas as rotas `/dashboard/**`). Remover handleLogout inline de `dashboard/page.js`. (Abordagem ajustada: header separado para dashboard em vez de condicional no header público.)

**Tarefas — Eixo Build & Deploy (env):**

- [ ]  **C6.1** — Corrigir `README.md:83-87`: substituir `NEXT_PUBLIC_SUPABASE_JWT` e `SUPABASE_SERVICE_ROLE_KEY` pelos nomes reais lidos pelo código (`SUPABASE_JWT`, `SUPABASE_ROLE_KEY`). Deploy seguindo README atual boota com `undefined`.
- [x]  **C6.2** — `.env.example` criado. (C6.1 — README ainda pendente de verificação.)

**Verificação:**
- [x]  POST não autenticado em `gerar-parcelas` retorna 401.
- [ ]  `curl https://<projeto>.supabase.co/rest/v1/locatarios` com anon key retorna `[]` ou 401. ← **C1.2 pendente**
- [x]  `curl http://localhost:3000/dashboard` sem cookie de sessão retorna redirect para `/login`.
- [x]  Aba Network: payload de `/unidades` para anônimos não contém `valor_mensal` quando `valor_visivel = false`.
- [x]  Login → cookie de sessão presente em `document.cookie`; sessão sobrevive a refresh.
- [x]  Botão de logout visível para autenticado; clique limpa cookie e redireciona.

> ⚠️ **Bloqueador absoluto.** Nenhuma sessão posterior pode rodar antes de F3-S0 estar completa.

---

## F3-S1 — Deploy no Vercel + Altos

**Objetivo:** Colocar o Romma em produção no Vercel e resolver achados **Altos** que afetam superfície de ataque, idempotência e build limpo.

**Entregavel:** URL pública do Romma acessível, login + CRUD + Realtime funcionando em produção, Edge Function idempotente, mensagens de erro genéricas, build sem warnings.

**Tarefas — Deploy:**

- [ ]  Criar conta no Vercel (se ainda não tiver) e conectar repositório GitHub.
- [ ]  Configurar variáveis no painel Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_JWT`, `SUPABASE_ROLE_KEY` (server-only, sem prefixo `NEXT_PUBLIC_`).
- [ ]  Primeiro deploy; verificar build verde.
- [ ]  Configurar Redirect URL do Supabase Auth para incluir domínio Vercel.
- [ ]  Testar fluxo de login + invite Locatário em produção.
- [ ]  **M1.1** — Restringir CORS da Edge Function `gerar-parcelas`: substituir `Access-Control-Allow-Origin: '*'` por allowlist (`https://<projeto>.vercel.app` + `http://localhost:3000` para dev).

**Tarefas — Hardening (Altos):**

- [ ]  **A1.1** — Adicionar auth check (`getUser()` via `supabase-server.js`) no início de `convidarLocatario` e `criarContrato` em `src/actions/`. CSRF do Next ≠ autenticação.
- [ ]  **A1.2** — Criar unique index em `parcelas (contrato_id, numero)` via migration. Em `gerar-parcelas/index.ts:98`, trocar insert simples por upsert (ou guard `select count` antes do insert) para garantir idempotência.
- [ ]  **A1.3** — Em `gerar-parcelas/index.ts:116`, substituir `String(err)` no catch por log server-side + mensagem genérica ao cliente.
- [ ]  **A2.1** — Em `src/app/login/page.js:24,50`, substituir `setErro(error.message)` por mensagem genérica única (`"Email ou senha inválidos."`). Evita enumeração de contas.
- [ ]  **A6.1** — Remover linha `SUPABASE_URL=` morta de `.env.local` (nenhum arquivo lê; só `NEXT_PUBLIC_SUPABASE_URL` é consumida).

**Tarefas — Build limpo:**

- [ ]  **M6.2** — Adicionar `"engines": { "node": ">=20" }` ao `package.json`.
- [ ]  Rodar localmente antes do push: `npm run lint`, `npm run build`, `npm audit --omit=dev`. Corrigir qualquer erro/critical.
- [ ]  Commit dos ajustes.

**Conceitos novos:**

- Deploy contínuo via Vercel (push em `main` = deploy automático).
- Variáveis de ambiente em produção vs desenvolvimento.
- Redirect URLs do Supabase Auth para múltiplos ambientes.
- CORS allowlist em Edge Functions Deno.

---

## F3-S2 — Refinamento Visual — Páginas Públicas

**Objetivo:** Aplicar o design system Obsidian Blueprint nas páginas públicas (LP e listagem de unidades) e resolver Altos visuais relacionados ao bundle/Core Web Vitals.

**Entregavel:** LP e `/unidades` visualmente consistentes com paleta Romma (roxo `#370085`, dourado `#C5A059`, fundo `#faf8fc`), tipografia Manrope/Noto Sans e estética Obsidian Blueprint. Sem `<img>` nativo, sem fonts não utilizadas.

**Tarefas:**

- [ ]  Revisar design Obsidian Blueprint no Figma (arquivo `C16bXWN7RoGwA5oOCu8Qy1`) como referência.
- [ ]  Aplicar paleta de cores via variáveis CSS globais no `globals.css`.
- [ ]  Configurar fontes Manrope (display) e Noto Sans (body) via `next/font`.
- [ ]  Aplicar design na LP (`src/app/page.js`).
- [ ]  Aplicar design na listagem pública (`src/app/unidades/page.js`).
- [ ]  **A6.2** — Remover import não utilizado `Public_Sans` em `src/app/layout.js:1` (lint warning + processamento desnecessário).
- [ ]  **A6.3** — Migrar `<img>` nativo para `next/image` em `src/app/page.js` (linhas 81, 96, 112, 128, 166). Mistura atual com `next/image` (linhas 14, 53) viola `@next/next/no-img-element` e degrada Core Web Vitals.
- [ ]  Commit das alterações.

**Conceitos novos:**

- `next/font` para Google Fonts otimizadas no Next.js.
- Variáveis CSS globais com Tailwind v4.
- `next/image` (otimização, lazy load, prevenção de CLS).

---

## F3-S3 — Refinamento Visual + Refatoração — Dashboard

**Objetivo:** Aplicar consistência visual do Obsidian Blueprint em todas as telas do dashboard, resolver achados **Médios** e **Baixos** restantes (refatoração de estado, queries, headers de segurança, padronização de contratos).

**Entregavel:** Dashboard visualmente consistente, sem código morto, com headers de segurança configurados, contratos de Server Actions padronizados, clients Supabase corretos em todos os Client Components.

**Tarefas — Visual:**

- [ ]  Auditar todas as telas e listar inconsistências visuais.
- [ ]  Definir e aplicar padrões reutilizáveis: cards, botões, badges de status, formulários.
- [ ]  Refinar navegação (sidebar ou menu consistente).
- [ ]  Aplicar refinamento em cada tela do dashboard.

**Tarefas — Refatoração de estado (single-object do CLAUDE.md):**

- [ ]  Consolidar 18 `useState` em `src/components/features/Unidades.js` em objetos `form` e `editForm`.
- [ ]  Consolidar 6 `useState` em `src/components/features/GestaoEdificios.js` em objetos `form` e `editForm`.
- [ ]  Consolidar 5 `useState` de inserção em `src/components/features/Locatarios.js` em objeto `form`.
- [ ]  Atualizar `src/components/ui/UnidadeCard.js` para receber `editForm`/`setEditForm` em vez de 18 props.
- [ ]  Atualizar `src/components/ui/EdificioCard.js` para receber `editForm`/`setEditForm` em vez de 9 props.

**Tarefas — Loading, hooks, queries (existentes):**

- [ ]  Adicionar estado `loading` + indicador visual em `Contratos.js`, `Unidades.js`, `GestaoEdificios.js`, `Parcelas.js`.
- [ ]  Corrigir `handleEditarUnidade` em `Unidades.js` para popular `statusEdit` a partir dos dados existentes.
- [ ]  Corrigir `cancelarContrato` em `Contratos.js` para só atualizar estado (`setContratos`) no branch de sucesso.
- [ ]  **B2.1** — Adicionar `router` ao dep array do `useEffect` em `dashboard/page.js`, `unidades/page.js`, `locatarios/page.js`, `contratos/page.js`, `contratos/[id]/page.js` (resolve `react-hooks/exhaustive-deps`).
- [ ]  Remover `getEdificios()` local de `GestaoEdificios.js` e importar de `@/lib/queries`.

**Tarefas — Médios restantes:**

- [ ]  **M1.2** — Padronizar contrato de Server Actions: `src/actions/contratos.js:19` retorna `errorMessage`; CLAUDE.md e `locatarios.js` definem `erroMessage`. Trocar para `erroMessage` (consumidores hoje recebem `undefined` silencioso).
- [ ]  **M1.3** — Adicionar `import 'server-only'` no topo de `src/lib/supabase-server.js` (paridade com `supabaseAdmin.js` e `supabaseJWT.js`; falha de import acidental no build, não em runtime).
- [ ]  **M2.1** — Remover lógica de guard duplicada (`useEffect + verificarSessao + getUser + router.push('/login')`) das 5 páginas dashboard. Já centralizada em `proxy.js` (F3-S0/C2.1).
- [ ]  **M2.2** — Remover `useState(null)` de `usuario` definido e nunca consumido em 4 dashboards.
- [ ]  **M2.3** — Em `dashboard/page.js:27-29`, sequenciar: `verificarSessao()` primeiro, `grabMetricas()` depois (não em paralelo). Evita queries para anônimos.
- [ ]  **M6.1** — Em `next.config.mjs`, adicionar `headers()` retornando `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Adicionar `images.remotePatterns` para `*.supabase.co` (preparar Storage).
- [ ]  **M6.3** — Atualizar `README.md`: remover `--turbopack` da menção do `next dev` (Turbopack é default em Next 16).
- [ ]  **M6.4** — Mover `tw-animate-css` de `dependencies` para `devDependencies` em `package.json` (asset CSS, sem runtime JS).

**Tarefas — Baixos restantes:**

- [ ]  **B1.1** — Trocar import de `src/lib/supabase.js` por `src/lib/supabase-browser.js` em Client Components que usam auth: `dashboard/page.js`, `Parcelas.js`, `Contratos.js` (login já corrigido em C2.2). Evita dessincronização entre abas.
- [ ]  **B1.2** — Em `src/actions/contratos.js:13`, remover campo `message` do retorno de sucesso. CLAUDE.md define apenas `{ status: 200 }`.
- [ ]  **B2.2** — Header com condicional de auth (já resolvido em C2.3 — apenas confirmar).
- [ ]  **B6.1** — Adicionar comentário em `next.config.mjs` documentando `babel-plugin-react-compiler` + `reactCompiler: true` (top-level em Next 16, promovida de `experimental`).
- [ ]  **B6.2** — Adicionar `"baseUrl": "."` em `jsconfig.json` (não afeta build, melhora resolução em IDEs/CI).

- [ ]  Commit das alterações.

> ⚠️ Sessão mais longa da Fase 3. Estimar 5-6h considerando refinamento visual + refatoração + Médios/Baixos. Priorizar telas que aparecerão na demo.

---

## F3-S4 — Polish Final + Preparação para Demo

**Objetivo:** Garantir que o sistema está estável, sem erros visíveis e pronto para demo ao vivo.

**Entregavel:** Sistema em produção com dados de demo cadastrados, fluxo validado ponta a ponta, roteiro definido.

**Tarefas:**

- [ ]  Cadastrar dados de demo realistas no Supabase de produção (edifícios, unidades, locatários, contratos com parcelas).
- [ ]  Executar fluxo completo: LP → listagem → login Proprietário → dashboard → criar contrato → observar unidade sumir da listagem pública.
- [ ]  Identificar e corrigir qualquer erro ou inconsistência visual restante.
- [ ]  Definir roteiro de demonstração para banca.

**Limpeza final de código (baixa prioridade):**

- [ ]  Remover estado `usuario` não utilizado das 5 páginas dashboard (se não removido em M2.2).
- [ ]  Renomear `grabMetricas` → `carregarMetricas` em `src/app/dashboard/page.js`.
- [ ]  Corrigir casing inconsistente: `setlocatarios` → `setLocatarios` e `handleDeletarlocatario` → `handleDeletarLocatario` em `Locatarios.js`.
- [ ]  Remover `defaultValue` redundante do `<select>` controlado em `Locatarios.js`.
- [ ]  Corrigir operador vírgula em `Contratos.js` — usar ponto-e-vírgula: `{ setEditandoId(null); resetEdit(); }`.
- [ ]  Remover `async` desnecessário de `pushLogin` em `src/app/page.js`.
- [ ]  Padronizar import path em `GestaoEdificios.js`: trocar `'../ui/EdificioCard'` por `'@/components/ui/EdificioCard'`.
- [ ]  Remover `key` do `<div>` raiz em `EdificioCard.js` (manter apenas no `.map()` do pai).
- [ ]  Remover `export` de `countRegistros` em `queries.js` (manter como helper interno).
- [ ]  **B6.3** — Confirmar que `code-review.md`, `code-review-plan.md` na raiz não aparecem no `git status` antes do PR final.

- [ ]  Atualizar Notion com status final.
- [ ]  Commit final.

---

# Decisões Técnicas Registradas

**F3-S0 criada após code review (2026-04-26):** O code review `docs/code-reviews/deploy-readiness-2026-04-26.md` identificou 8 bloqueadores absolutos de deploy (PII pública, rotas privadas servidas a anônimos, Edge Function sem auth, env vars com nomes errados no README). Esses itens não cabem em F3-S1 — exigem sessão dedicada antes de qualquer deploy. F3-S0 é pré-requisito hard para todas as demais sessões da Fase 3.

**Deploy no Vercel:** Plataforma escolhida pela integração nativa com Next.js e deploy automático via GitHub. `SUPABASE_ROLE_KEY` configurada apenas como variável server-side (sem prefixo `NEXT_PUBLIC_`).

**Refinamento visual em fase separada:** Decisão intencional de separar construção funcional (Fases 1 e 2) de polimento visual (Fase 3) para manter foco e reduzir retrabalho.

**Figma como referência:** Design Obsidian Blueprint documentado no arquivo Figma `C16bXWN7RoGwA5oOCu8Qy1`. Usar como referência visual, não como spec pixel-perfect.

**Sessões expandidas após code review:** F3-S0 nova (8 Críticos). F3-S1 absorveu 5 Altos + CORS. F3-S2 absorveu 2 Altos visuais. F3-S3 incorporou 7 Médios + 5 Baixos. F3-S4 mantém limpeza pontual + 1 Baixo. Todos os 33 achados do code review estão mapeados.

---

# Melhorias Futuras (Pós-TCC)

**Dívida técnica — `Contratos.js` (F1-S7):** Três itens identificados na revisão de código foram adiados para esta fase: (1) **Feedback de erros ausente** — operações de cancelamento e criação não exibem mensagem ao usuário quando falham; adicionar um `useState` de erro e renderização condicional na UI. (2) **`setContratos` fora do bloco de sucesso em `cancelarContrato`** — a UI atualiza mesmo quando uma das três operações falhou; mover para dentro do `if (!errorParcelas)`. (3) **Atomicidade de `cancelarContrato`** — as três operações (`contratos`, `unidades`, `parcelas`) são chamadas independentes sem rollback; migrar para uma Edge Function `cancelar-contrato` que execute tudo no servidor com service role key.

**Transição automática de status de Contrato para `encerrado`:** O status `encerrado` não é uma ação manual do Proprietário — é uma transição natural quando `data_fim` passa. Portanto, o botão "Encerrar" foi removido do frontend. A única ação manual destrutiva é "Cancelar" (status `cancelado`). A transição `ativo` → `encerrado` será feita por um cron job: uma Edge Function agendada que roda diariamente, busca contratos com `status = 'ativo'` e `data_fim < hoje`, atualiza o status para `encerrado` e reverte a Unidade para `disponivel`. Isso garante que o banco reflita o estado real sem depender de lógica de exibição no frontend.

**Transição automática de status de Parcelas (`futura` → `pendente` → `vencida`):** As parcelas são criadas com status `futura` e armazenadas estático no banco. A transição de status é date-driven (`data_fechamento <= hoje` → `pendente`; `data_vencimento < hoje` e não paga → `vencida`), mas atualmente não há mecanismo que execute essa transição — o frontend exibe o status armazenado sem recomputar. Implementar junto ao cron job de contratos: a mesma Edge Function agendada diária busca parcelas com status desatualizado e os corrige em lote.

**Validação de input nas Server Actions e Edge Functions:** As Server Actions (`locatarios.js`) e a Edge Function (`gerar-parcelas`) não validam os dados recebidos. Implementar: validação de formato de email, `tipo` ∈ `['pf','pj']`, tamanho de documento (11 para CPF, 14 para CNPJ), e formato UUID para `contrato_id`. Retornar 400 para inputs inválidos.

**Tratamento de erros em `queries.js`:** Todas as funções de query ignoram o `error` retornado pelo Supabase. Se uma query falha (rede, RLS), `data` é `null` e `.map()` quebra no caller. Implementar destructuring de `error`, throw ou retorno explícito, e fallback defensivo (`data ?? []`). Permitir que a UI exiba estados de erro diferenciados ("sem dados" vs "falha na busca").

**Otimização da Landing Page como Server Component:** A página `/app/page.js` está inteira como `"use client"` apenas por usar `useRouter` para um clique de botão. Extrair apenas o botão interativo em um Client Component separado e manter a página como Server Component para reduzir o bundle JavaScript enviado ao browser.

**Padronização de nomenclatura de arquivos em `src/lib/`:** Convenção inconsistente entre `supabase.js` (plain), `supabase-browser.js` (kebab-case) e `supabaseAdmin.js` (camelCase). Definir e aplicar uma convenção única para todos os arquivos utilitários.

**Imagem arquitetônica em `public/`:** `public/Detalhe Arquitetônico.png` é servida sem autenticação a qualquer pessoa com a URL. Se contiver informações proprietárias do edifício, mover para Supabase Storage com RLS.

**Hook de pre-commit para segredos:** `.gitignore` cobre arquivos `.env*` mas não há guard ativo que impeça commits acidentais de segredos. Considerar adicionar `husky` + `lint-staged` com verificação de padrões sensíveis (`eyJ`, `sk-`, `service_role`).

**Reclassificação de `contratos` RLS:** Policies declaradas no role `public` com filtro `auth.role()='authenticated'`. Funcionalmente correto, semanticamente impreciso. Migrar para policies declaradas diretamente no role `authenticated`.

**Realtime para transição `disponivel → alugada`:** Limitação conhecida documentada no CLAUDE.md — RLS descarta o evento. Investigar policy presence filter ou broadcast custom via Edge Function.
