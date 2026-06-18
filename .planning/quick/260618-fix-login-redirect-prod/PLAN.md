---
slug: fix-login-redirect-prod
date: 2026-06-18
status: complete
---

# Fix: Login redirect não funciona em produção

## Diagnóstico

`router.push('/dashboard')` faz soft navigation no Next.js App Router.
O proxy (src/proxy.js) roda server-side e lê os cookies da request.
Na soft navigation, os cookies recém-setados pelo `createBrowserClient` após `signInWithPassword`
não chegam no request do proxy → proxy não vê sessão → redireciona de volta a /login.

Direto funciona porque é hard navigation (full page reload), cookies chegam no servidor.

## Fix

Em `src/app/login/page.js` linha 62:
- Antes: `router.push(isProprietario ? "/dashboard" : "/portal/dashboard")`
- Depois: `window.location.href = isProprietario ? "/dashboard" : "/portal/dashboard"`

Force full page reload pós-login garante que cookies chegam no proxy.
