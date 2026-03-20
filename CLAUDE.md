# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
```

## Stack

- **Next.js 16.2.0** with App Router — see `node_modules/next/dist/docs/` for current API (breaking changes from prior versions)
- **React 19.2.4** with React Compiler enabled (`reactCompiler: true` in `next.config.mjs`)
- **Tailwind CSS v4** — configured via PostCSS plugin (`@tailwindcss/postcss`), no `tailwind.config.js`; add global styles/utilities in `src/app/globals.css`
- **Supabase** (`@supabase/supabase-js`) for database/backend; client initialized in `src/lib/supabase.js` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture

- `src/app/` — App Router routes; `layout.js` is the root layout with Geist fonts
- `src/lib/supabase.js` — singleton Supabase client, import as `@/lib/supabase`
- Path alias `@/*` maps to `src/*`
- Data fetching is done directly in async Server Components (see `src/app/dashboard/page.js` for the pattern)
- JavaScript only (no TypeScript)
