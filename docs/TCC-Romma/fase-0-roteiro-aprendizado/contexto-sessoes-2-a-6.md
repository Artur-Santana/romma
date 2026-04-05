# 📋 Contexto — Sessões 2 a 6 (Resumo para novo chat)

# Perfil do estudante — capacidades e preocupações

## O que o estudante já demonstrou

- Identifica erros no próprio código com raciocínio próprio (ex: percebeu que faltava a RLS policy de UPDATE sem ajuda)
- Quando entende o conceito, implementa rápido e com pouco retrabalho
- Dá feedback honesto e direto quando algo não está funcionando (metodologia, estimativas, Notion desatualizado)
- Pensa estratégicamente sobre o projeto — superávit de horas, knowledge debt, planejamento de fases
- Alta produtividade uma vez que começa a sessão
- Absorve conceitos visuais e de estrutura bem (HTML/CSS, roteamento, estrutura de pastas)
- Conseguiu listar as props necessárias para o `EdificioCard` com raciocínio próprio após orientação
- Implementou o componente completo corretamente na primeira tentativa

## Limitações atuais

- Não consegue produzir código do zero sem consultar — reconhece padrões ao ler, mas ainda não internalizou a sintaxe
- Base em JS ainda baixa para inferir implementação só com o objetivo — precisa de explicação + exemplo antes de tentar
- Ternário e lógica de renderização condicional ainda confusos ao produzir, mais claros ao ler
- Alta barreira de ativação para começar sessões (procrastinação), mas produtivo uma vez iniciado
- Confunde componentes de criação com componentes de listagem ao pensar na estrutura (confundiu formulário de criação com EdificioCard)

## Preocupações expressas pelo estudante

- **Entrega do TCC** é a preocupação principal — não o aprendizado em si
- Sente que está construindo com "fundação fraca" — reconhece o knowledge debt conscientemente
- Preocupação com prazo de ~2 meses para entregar o projeto completo
- Não gosta de metodologia puramente socrática quando a base técnica ainda é baixa — gera frustração sem avanço
- **Novo:** quer ser mais desafiado na hora de aplicar no código — sentiu falta de tentar usar `<EdificioCard` no dashboard antes de receber a solução pronta

## Decisão tomada

Estudante optou conscientemente por priorizar entrega sobre consolidação total. Após o TCC, está planejada uma fase de exercícios focalizados para quitar o knowledge debt. Essa decisão deve ser respeitada — não insistir em consolidação extra dentro do prazo do TCC.

---

# Para que serve esta página

Este documento resume tudo que foi feito e decidido nas sessões 2 a 6 da Fase 0. Use como contexto de abertura para novos chats.

---

# Estado atual do projeto (25/03/2026)

**Fase:** Fase 0 — Aprendizado (6/7 sessões concluídas)

**Próximo passo:** Sessão 7 — Revisão e Checklist de Prontidão

**Depois:** Fase 1 — Core do Romma

**Projeto rodando:** Next.js App Router, Supabase, sem TypeScript, com Turbopack

**Repositório:** [https://github.com/Artur-Santana/romma](https://github.com/Artur-Santana/romma)

**Supabase URL:** [https://vfymttcajeyhrmsyhrtj.supabase.co](https://vfymttcajeyhrmsyhrtj.supabase.co)

---

# O que foi construído

## `/src/app/login/page.js`

Página de login funcional com:

- Formulário controlado via `useState` (email, senha)
- `supabase.auth.signInWithPassword()` para autenticação
- Exibição de erro na tela com renderização condicional `{erro && <p>{erro}</p>}`
- Redirecionamento para `/dashboard` com `useRouter` após sucesso
- Confirmação de email **desativada** no Supabase Auth (ambiente de dev)
- Comentários removidos (código limpo)

## `/src/app/dashboard/page.js`

Dashboard refatorado com CRUD de edifícios:

- Verificação de sessão no `useEffect` — redireciona para `/login` se não autenticado
- Exibe email do usuário logado via `usuario?.email`
- Logout com `supabase.auth.signOut()` + `router.push("/login")`
- Lista edifícios do banco com `select("*")` no `useEffect`
- Formulário de criação com `insert`
- Usa `<EdificioCard>` para renderizar cada edifício da lista
- Comentários removidos (código limpo)

## `/src/components/EdificioCard.js`

Componente extraído do dashboard — representa um edifício existente na lista:

- Recebe via props: `edificio`, `editandoId`, `nomeEdit`, `enderecoEdit`, `setNomeEdit`, `setEnderecoEdit`, `setEditandoId`, `handleEditar`, `handleDeletar`, `handleSalvar`
- Ternário alternando modo visualização/edição com base em `editandoId === edificio.id`
- Modo visualização: exibe nome e endereço + botões Editar e Remover
- Modo edição: inputs pré-preenchidos + botões Salvar e Cancelar

## `/src/lib/supabase.js`

Cliente Supabase singleton usando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` do `.env.local`.

## RLS Policies configuradas na tabela `edificios`

- SELECT — público (leitura sem auth)
- INSERT — authenticated
- UPDATE — authenticated
- DELETE — authenticated

---

# Conceitos que o estudante já conhece

- `"use client"` — quando usar e por quê
- `useState` — sintaxe, inputs controlados, estado de erro, estado de lista
- `useEffect` com `[]` — executa uma vez ao montar o componente
- Múltiplos `useEffect` no mesmo componente
- Funções compartilhadas entre `useEffect` e handlers (ex: `getEdificios`)
- `useRouter` e `router.push()` para redirecionamento
- `onSubmit` + `e.preventDefault()` em formulários
- `onChange` em inputs controlados
- Renderização condicional com `{condição && <elemento />}`
- Ternário `condição ? (verdadeiro) : (falso)` para alternar modos
- `supabase.auth.signInWithPassword`, `getUser`, `signOut`
- `supabase.from().select()`, `.insert()`, `.update()`, `.delete().eq()`
- `?.` (optional chaining) para acesso seguro
- `.map()` com `key` para listas
- Fragment `<>` para agrupar elementos sem div
- `() =>` em event handlers para passar parâmetros
- RLS policies por operação no Supabase
- Server Components vs Client Components
- **Componentes filhos com props** — criar arquivo separado, desestruturar props, usar no pai com `<Componente prop={valor} />`
- **Passar funções como props** — handlers passados do pai para o filho
- **Passar setters como props** — `setNomeEdit`, `setEnderecoEdit`, `setEditandoId` passados para o filho controlar estado do pai
- **`<select>` controlado** — `value` e `onChange` no `<select>`, `<option>` com `key` e `value` dentro do `.map()`
- **Centralização de queries em `src/lib/queries.js`** — funções puras exportadas (`getUnidades`, `getEdificios`) importadas nos componentes que precisam. Sem hooks, sem estado — só chamada ao Supabase e `return data`

---

# Metodologia de ensino (resumo executivo)

A metodologia completa está em: 🧠 Metodologia de Ensino — Guia para o Claude

**Sequência obrigatória:** explicar conceito → mostrar exemplo simples → pedir que aplique no Romma.

**NÃO usar** hints progressivos puros — base técnica ainda baixa para inferir implementação sem contexto.

**Escala de hints (só após o estudante tentar):**

1. Objetivo apenas
2. Direção conceitual
3. Pista técnica
4. Esqueleto de código
5. Solução comentada

**Abertura de sessão:** verificar se `npm run dev` está rodando, recuperar contexto, apresentar objetivo da sessão.

**Encerramento de sessão:** perguntar o que conseguiria reproduzir de cabeça e o que ficou nebuloso. Atualizar o Notion com tarefas concluídas e tempo real.

**Ajuste identificado na Sessão 6:** Estudante quer ser desafiado a aplicar no código antes de receber a solução pronta. Após explicar o conceito e mostrar o exemplo, dar o esqueleto mínimo e deixar ele tentar — inclusive a parte de usar o componente no pai.

---

# Decisões e observações importantes

- **Knowledge debt intencional:** o estudante optou por priorizar entrega do TCC sobre consolidação total do aprendizado. Após o TCC, está planejada uma fase de exercícios focalizados.
- **Superávit de horas:** Sessões 3, 4 e 5 levaram ~3h no total contra ~9h estimadas. Superávit carregado como gordura para imprevistos.
- **Sessão 6 levou ~30min** (19:37 a 20:07 em 25/03/2026).
- **Ritmo real:** cada sessão dura entre 30min e 2h — bem abaixo das estimativas originais.
- **Conventional Commits:** usar extensão `vivaxy.vscode-conventional-commits`. Fornecer tipo, escopo, gitmoji e descrição separados — não a string formatada completa.
- **WSL:** no notebook secundário, o projeto fica em `~/tcc/romma`.

---

# O que vem a seguir

## Próxima sessão — F1-S2 (continuação)

Retomar a construção da página `/dashboard/unidades`. O `<select>` de edifícios está implementado. Falta:

- Demais inputs do formulário de criação (nome, descricao, area_m2, valor_mensal, valor_visivel, status)
- Função `insertUnidade` com `supabase.from('unidades').insert()`
- Listagem de unidades com `.map()`
- Corrigir o `key` faltando no `.map()` de `page.js` (rota raiz)
- Commit das alterações

## Fase 1 — Core do Romma

Roteiro detalhado disponível na página 🏗️ Fase 1 — Core.

---

# IDs úteis do Notion

- **Página raiz TCC:** `3162b684-81e1-8071-b66f-cd7a8cfb0e5c`
- **Roteiro Fase 0:** `3282b684-81e1-8110-ba3c-fbfe08c0f652`
- **Metodologia de Ensino:** `3292b684-81e1-814a-bb98-f81ddd98002a`
- **Planejamento e Cronograma:** `3162b684-81e1-8141-9176-e02cf05b1ef0`
- **Modelo de Dados:** `3162b684-81e1-8120-bc7c-f817777741eb`