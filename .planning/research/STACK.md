# Technology Stack — v1.1 Polish & Completeness

**Project:** Romma
**Researched:** 2026-06-05
**Milestone:** v1.1 — adding to existing Next.js 16 + Supabase + Tailwind v4 + shadcn/ui app

---

## Stack Analysis

### New Dependencies Needed

**Default position: add nothing.** The existing stack already covers most v1.1 features. Every candidate below starts as "unjustified" until the feature actually requires it.

---

#### Candidate 1: `motion` (formerly framer-motion) — CONDITIONAL

**Package:** `motion` v12.40.0
**React 19 peer dep:** `"react": "^18.0.0 || ^19.0.0"` — verified via npm
**React Compiler (`reactCompiler: true`):** No known blocking issues found. `motion` components must be in `'use client'` files — which is already the rule in this codebase.

**Add only if:** Contract-close or revoke-access animations need exit orchestration (AnimatePresence for unmount sequences) that CSS + delayed-unmount cannot provide.

**Do NOT add for:** Fade-in, slide-in, scale effects. The project already has `tw-animate-css` (v1.4.0, Tailwind v4-compatible) and working CSS keyframes (`rommaFadeIn`, `rommaUnitOut`, `loadingBar`, `rommaPulse`) declared in `globals.css`. The `/unidades` exit animation (`romma-unit-out`) already ships without a JS library. New enter/exit transitions should use this pattern first.

**Decision rule:** If `AnimatePresence` (unmounting with animation) is genuinely needed for the contract-close or revoke-access action, add `motion`. Otherwise extend CSS keyframes.

```bash
npm install motion
# Import: import { motion, AnimatePresence } from 'motion/react'
# NOT from 'framer-motion'
```

---

#### Candidate 2: `sonner` — CONDITIONAL

**Package:** `sonner` v2.0.7
**React 19 peer dep:** `"react": "^18.0.0 || ^19.0.0 || ^19.0.0-rc"` — verified via npm
**Current usage:** Zero toast/notification infrastructure in codebase.

**Add only if:** The revoke-access fix and contract-close action need user feedback beyond the existing ConfirmDialog pattern. Currently destructive actions use `ConfirmDialog.js` — if that's retained, sonner is unnecessary.

**Decision rule:** If any v1.1 action needs a non-blocking success/error toast (e.g., "Acesso revogado", "Contrato encerrado"), add sonner. shadcn CLI can install it (`npx shadcn add sonner`) which generates a pre-styled `Toaster` component consistent with the design system. Do not roll a custom toast.

```bash
npx shadcn add sonner
# This wires Toaster into layout and provides import { toast } from 'sonner'
```

---

#### Candidate 3: `next-themes` — NOT NEEDED

**Package:** `next-themes` v0.4.6
**React 19 peer dep:** `"react": "^16.8 || ^17 || ^18 || ^19 || ^19.0.0-rc"` — verified via npm

**Verdict: Do not add.** The v1.1 milestone says "testar paletas de cores alternativas" — this is developer experimentation, not a runtime user-facing theme switcher. The existing CSS architecture already supports this perfectly: the `--ds-primary`, `--ds-background`, `--ds-surface`, `--ds-secondary`, `--ds-highlight` source tokens in `:root` of `globals.css` cascade to all derived variables. Swapping a palette means editing 5 OKLCH values. No library needed.

If a demo-time palette toggle is desired for the banca presentation, a simple `document.documentElement.style.setProperty('--ds-primary', newValue)` call is sufficient — no persistent state, no provider, no library.

---

### What NOT to Add

| Library | Why Not |
|---------|---------|
| `framer-motion` (old package) | Superseded by `motion` — wrong import path |
| `react-spring` | Motion already covers animation needs; two animation libs create conflict |
| `@radix-ui/react-toast` | shadcn/ui already includes Radix primitives; use sonner instead |
| Any CSS-in-JS (styled-components, emotion) | Incompatible with Tailwind v4 + CSS vars approach |
| `react-hot-toast` | Sonner is the shadcn-ecosystem standard and more DX-friendly |
| `lucide-react` as standalone | Radix UI icons already available via `radix-ui` package |
| `zustand` / `jotai` | State complexity doesn't justify global store for this scope |
| `react-query` / `swr` | Server Actions + `useEffect` pattern is established; migration risk outweighs benefit |
| `next-themes` | CSS variable token architecture already handles palette switching without JS |
| Any UI kit (MUI, Chakra, etc.) | Would conflict with shadcn/ui + Tailwind v4 design system |

---

### Integration Notes

#### Animations — extend CSS first

The existing system is already capable:
- `tw-animate-css` provides `animate-*` utility classes (enter/exit, fade, slide, scale) directly in JSX
- Custom keyframes in `globals.css` handle project-specific motions
- Pattern: add class on mount, `setTimeout` + `setState` for delayed unmount

Only reach for `motion` if AnimatePresence (coordinated exit while element leaves DOM) is required.

#### Theme switching — CSS token swap

No library needed. To test alternative palettes, edit the 5 `--ds-*` values in `:root`. For a runtime toggle, use `document.documentElement.style.setProperty`. The derived variable system (`oklch(from var(--ds-primary) ...)`) propagates changes automatically.

#### Mobile layout fixes

Pure CSS work. `globals.css` already has `romma-desktop-only` / `romma-mobile-only` utilities and `@media (max-width: 768px)` breakpoints. No new library needed.

#### Signup Proprietário

Supabase Auth (`signUp`) + existing Server Action pattern. No new library.

#### Revoke access bug / FK constraint bug

Logic/query fixes. No new library.

#### Font scale (desktop)

CSS `font-size` or Tailwind utility changes. The font system (`--font-headline-hanken`, `--font-body`) is already wired.

---

### Summary Decision Table

| Feature | New Library? | Rationale |
|---------|-------------|-----------|
| Signup Proprietário | No | Supabase Auth signUp |
| Landing CTAs / button fixes | No | HTML/CSS |
| /unidades redesign | No | CSS + existing components |
| Mobile layout | No | CSS breakpoints already exist |
| Desktop font scale | No | CSS font-size |
| Animations (enter/exit) | Maybe `motion` | Only if AnimatePresence needed |
| Action feedback (toast) | Maybe `sonner` | Only if ConfirmDialog insufficient |
| Revoke access bug | No | Logic fix |
| FK constraint bug | No | Query fix |
| Theme variations | No | Edit `--ds-*` CSS vars |

---

## Sources

- npm registry: `motion` v12.40.0 peerDependencies — verified
- npm registry: `next-themes` v0.4.6 peerDependencies — verified
- npm registry: `sonner` v2.0.7 peerDependencies — verified
- motion.dev/docs/react-upgrade-guide — framer-motion → motion migration
- Context7 /grx7/framer-motion — peer dependency spec (React 18 min, extended to 19 in v12)
- Context7 /pacocoursey/next-themes — App Router integration pattern
- Context7 /emilkowalski/sonner — installation and basic usage
- globals.css inspection — confirmed existing keyframe + tw-animate-css setup
- next.config.mjs inspection — confirmed `reactCompiler: true`
- package.json inspection — confirmed existing `tw-animate-css: ^1.4.0`
