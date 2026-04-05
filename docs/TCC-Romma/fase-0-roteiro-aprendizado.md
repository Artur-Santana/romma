# 📚 Fase 0 — Roteiro de Aprendizado

# 📚 Fase 0 — Aprendizado

**Status:** In Progress

**Início real:** 18/03/2026

**Conclusão estimada:** 04/04/2026

**Critério de conclusão:** Checklist de Prontidão 100% marcado

**Tempo total estimado:** ~24h (restam ~20h)

---

# Sessões Concluídas

## ✅ Sessão 1 — Setup do ambiente e primeira conexão com o banco *(18/03 · ~4h)*

**Objetivo:** Sair do zero para um projeto Next.js rodando com dados reais do Supabase.

**O que foi feito:**

- [x]  Criar projeto Next.js com `npx create-next-app@latest` *(15min)*
- [x]  Entender estrutura de pastas: `src/app/`, `layout.js`, `page.js` *(30min)*
- [x]  Entender roteamento por pasta e herança de layout *(30min)*
- [x]  Criar conta e projeto no Supabase *(15min)*
- [x]  Instalar `@supabase/supabase-js` e configurar `.env.local` *(20min)*
- [x]  Criar `src/lib/supabase.js` com cliente via `process.env` *(20min)*
- [x]  Criar tabelas `edificios` e `unidades` via SQL Editor *(30min)*
- [x]  Configurar RLS policy de leitura pública na tabela `edificios` *(20min)*
- [x]  Buscar registros do Supabase e renderizar no frontend com `.map()` *(30min)*

**Conceitos absorvidos:** Roteamento Next.js, herança de layout, variáveis de ambiente, cliente Supabase, RLS policy, Server Components com `async`, renderização de lista com `.map()`.

---

# Sessões Planejadas

## ✅ Sessão 2 — Autenticação com Supabase Auth *(20/03 · ~2h)*

**Objetivo:** Implementar login funcional com email e senha.

**Tarefas:**

- [x]  Criar página `/login` com formulário de email e senha
- [x]  Implementar `useState` para campos controlados
- [x]  Implementar `signInWithPassword` com Supabase Auth
- [x]  Redirecionar para `/dashboard` após login bem-sucedido com `useRouter`
- [x]  Configurar Supabase Auth (desativar confirmação de email para dev)
- [x]  Exibir erros de autenticação na tela com `useState` + renderização condicional
- [x]  Criar página `/dashboard` com conteúdo básico

**Conceitos absorvidos:** `useState` para formulários e estado de erro, event handlers (`onSubmit`, `onChange`), renderização condicional, `useRouter` para redirecionamento, Supabase Auth (`signInWithPassword`), Client Components (`"use client"`), diferença entre Server e Client Components.

**Entregável:** Página `/login` funcional com autenticação real via Supabase, exibição de erros na tela e redirecionamento para `/dashboard` após sucesso.

---

---

# Sessões Planejadas

## ✅ Sessão 3 — Proteção de rotas e logout *(23/03 · ~2h)*

**Objetivo:** Garantir que páginas protegidas não sejam acessíveis sem login.

**Tarefas:**

- [x]  Verificar sessão ativa com `supabase.auth.getUser()` no `useEffect`
- [x]  Redirecionar para `/login` se não autenticado
- [x]  Exibir email do usuário logado na tela com `useState`
- [x]  Implementar logout com `supabase.auth.signOut()` e `router.push`
- [x]  Testar fluxo completo: acesso sem login redireciona, logout funciona

**Conceitos absorvidos:** `useEffect` para efeitos colaterais, `supabase.auth.getUser()`, operador de acesso seguro `?.`, `signOut`, fluxo completo de autenticação.

**Entregável:** Rota `/dashboard` protegida com email do usuário exibido e logout funcional.

---

## ✅ Sessão 4 — CRUD: Listar e Criar registros *(23/03 · ~1h)*

**Objetivo:** Buscar dados do Supabase e criar novos registros via formulário.

**Tarefas:**

- [x]  Listar registros da tabela `edificios` com `useEffect` + `select`
- [x]  Implementar formulário de criação com inputs controlados (`useState`)
- [x]  Fazer `insert` no Supabase ao submeter o formulário
- [x]  Atualizar a lista automaticamente após criação re-buscando os dados
- [x]  Configurar RLS policy de INSERT para usuários autenticados

**Conceitos absorvidos:** `useEffect` múltiplos no mesmo componente, `select` e `insert` no Supabase, função compartilhada entre `useEffect` e handler, RLS policies por operação (SELECT vs INSERT).

**Entregável:** Dashboard com lista de edifícios do banco e formulário funcional de criação.

---

## ✅ Sessão 5 — CRUD: Editar e Deletar registros *(23/03 · ~37min)*

**Objetivo:** Completar o CRUD com update e delete.

**Tarefas:**

- [x]  Adicionar botão de deletar com RLS policy de DELETE
- [x]  Fazer `delete` no Supabase com `.eq("id", id)` e atualizar a lista
- [x]  Implementar modo de edição inline com `editandoId` + renderização condicional
- [x]  Fazer `update` no Supabase ao salvar edição com RLS policy de UPDATE
- [x]  Estudante identificou e resolveu a policy de UPDATE sozinho

**Conceitos absorvidos:** `delete` e `update` no Supabase, estado `editandoId` para controle de modo, ternário para renderização condicional, Fragment `<>`, RLS policies por operação, `() =>` em event handlers para passar parâmetros.

**Entregável:** CRUD completo funcionando — listar, criar, editar, deletar.

---

## ✅ Sessão 6 — Componentes e props *(25/03 · ~30min)*

**Objetivo:** Entender o conceito de componentes reutilizáveis e props, e extrair o `EdificioCard` do dashboard.

**Tarefas:**

- [x]  Remover comentários do `login/page.js` e `dashboard/page.js`
- [x]  Entender o conceito de props como argumentos de uma função
- [x]  Identificar quais props o `EdificioCard` precisaria receber
- [x]  Criar `/src/components/EdificioCard.js` com as props corretas
- [x]  Usar `<EdificioCard>` no `.map()` do dashboard

**Conceitos absorvidos:** Componentes filhos com props, desestruturação de props, passar funções e setters como props, diferença entre componente de criação e componente de listagem.

**Entregável:** `EdificioCard.js` funcionando, dashboard refatorado.

---

## 🔲 Sessão 7 — Revisão, polish e Checklist de Prontidão *(~2h30)*

**Objetivo:** Garantir que todos os conceitos foram absorvidos e fechar a Fase 0.

**Tarefas:**

- [ ]  Ler [react.dev](http://react.dev) [— Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) *(30min)*
- [ ]  Ler [react.dev](http://react.dev) [— You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) *(20min)*
- [ ]  Testar fluxo completo: cadastro → login → CRUD → logout *(30min)*
- [ ]  Revisar código e corrigir padrões ruins (ex: `return console.log()`) *(30min)*
- [ ]  Completar o Checklist de Prontidão abaixo *(30min)*

**Entregável:** Fluxo completo testado e checklist 100% marcado.

---

# 📊 Estimativa de Conclusão

| Sessão | Tempo estimado | Status |
| --- | --- | --- |
| Sessão 1 — Setup e banco | ~4h | ✅ Concluída (18/03) |
| Sessão 2 — Auth | ~2h | ✅ Concluída (20/03) |
| Sessão 3 — Proteção de rotas | ~2h | ✅ Concluída (23/03) |
| Sessão 4 — CRUD: Listar e Criar | ~1h | ✅ Concluída (23/03) |
| Sessão 5 — CRUD: Editar e Deletar | ~37min | ✅ Concluída (23/03) |
| Sessão 6 — React puro e refatoração | ~3h | 🔲 Próxima |
| Sessão 7 — Revisão e Checklist | ~2h30 | 🔲 |
| **Total** | **~22h** | **5/7 concluídas** |

**Premissa:** Sessão 1 levou ~4h como primeiro contato total. Sessões seguintes tendem a ser um pouco mais rápidas conforme a familiaridade cresce, mas Auth e CRUD de edição envolvem conceitos novos e debugging, então mantenho estimativas conservadoras.

**Ritmo de ~2h/dia em dias úteis:**

→ Conclusão estimada: **02/04/2026** (quinta-feira)

**Ritmo de ~1h30/dia + fins de semana leves:**

→ Conclusão estimada: **04/04/2026** (sábado)

---

# 📝 Decisões de planejamento

**23/03/2026 — Superávit de horas e knowledge debt**

As Sessões 3, 4 e 5 foram concluídas em ~3h no total, contra ~9h estimadas. O superávit foi mantido como gordura para imprevistos nas fases seguintes. A decisão consciente foi de não usar esse tempo para consolidação adicional agora, priorizando velocidade de entrega do TCC. Após a entrega, está planejada uma fase de consolidação com exercícios focalizados para quitar essa "knowledge debt".

---

# ☑️ Checklist de Prontidão — Fase 1

Só avance para a Fase 1 com **todos** os itens marcados.

- [x]  Sei criar e usar componentes React com props
- [x]  Sei usar `useState` para gerenciar estado local
- [x]  Sei usar `useEffect` para buscar dados
- [x]  Sei criar páginas e navegar entre elas no Next.js
- [x]  Sei aplicar classes do Tailwind em componentes
- [x]  Sei criar e consultar tabelas no Supabase
- [x]  Sei autenticar usuários com Supabase Auth
- [x]  Sei fazer `insert`, `update`, `delete` e `select` via Supabase no Next.js
- [x]  Sei proteger rotas e redirecionar usuário não autenticado

[📋 Contexto — Sessões 2 a 6 (Resumo para novo chat)](%F0%9F%93%9A%20Fase%200%20%E2%80%94%20Roteiro%20de%20Aprendizado/%F0%9F%93%8B%20Contexto%20%E2%80%94%20Sess%C3%B5es%202%20a%206%20(Resumo%20para%20novo%20chat)%2032d2b68481e1813999c6d2da564be12c.md)