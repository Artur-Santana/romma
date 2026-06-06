# Feature Landscape — Romma v1.1 Polish & Completeness

**Domain:** Single-instance rental management SaaS — polish milestone
**Researched:** 2026-06-05
**Scope:** Seven v1.1 categories only. Generic property-management features already built (dashboard, portal, parcelas, contratos) are out of scope here.

---

## Feature Analysis

### 1. Proprietário Signup — First-Run Bootstrap

**Context:** Single-owner model. `is_proprietario` RPC guards dashboard access. No second Proprietário can ever exist. This is NOT a SaaS funnel — it's a first-launch admin claim screen, similar to Ghost/Plausible/Outline "create your admin account on first install."

**Table stakes:**
- Simple form: email + password (matches Supabase Auth email/password flow already in use)
- "Instance already configured" guard — if a Proprietário row already exists, redirect to /login with a clear message. Prevents any second account from claiming the role.
- Success redirect to /dashboard (or /login with "conta criada, faça login")
- Validation inline: empty fields, invalid email format, password minimum length (8 chars)

**Differentiators:**
- Brief onboarding copy explaining what Romma is (useful for banca: evaluators land here cold) — LOW complexity
- On success, auto-redirect to login rather than making the user find /login manually — LOW complexity

**Anti-features:**
- Email verification step — adds friction and an extra callback for a single known-admin account; not worth it at this scope
- Pricing/plan selection screen — explicitly out of scope (single instance, TCC)
- Multi-step wizard with profile photo, building pre-fill, etc. — pós-TCC
- Social login (Google/GitHub) — adds OAuth surface area, not useful for a single owner
- Password strength meter with animated indicator — nice-to-have but costs time

**Dependencies on existing features:**
- Depends on Supabase Auth (`supabase.auth.signUp`)
- Depends on existing `is_proprietario` RPC — signup action must INSERT into the proprietario table after auth signup, or the RPC will return false and block dashboard access
- `supabaseAdmin` needed server-side to check "already has owner" before allowing signup (bypasses RLS)
- proxy.js already guards /dashboard — signup page must be at an unprotected route (e.g., `/signup` or `/setup`)

**Complexity:** LOW-MEDIUM. The form is trivial. The non-trivial part is the "already claimed" guard, which requires a server-side check before rendering the signup form at all (redirect to /login if owner exists). One Server Action + one server-side existence check.

---

### 2. Landing Page CTAs

**Context:** Static landing page at `/` already exists. CTAs are broken or missing. The goal is repair + add conversion-oriented buttons.

**Table stakes:**
- At least one primary CTA above the fold: "Ver Unidades Disponíveis" → /unidades (works for both leads and banca reviewers)
- Secondary CTA: "Acessar Dashboard" → /dashboard or /login (for the Proprietário)
- Broken buttons/links fixed — currently identified as a known gap

**Differentiators:**
- CTA copy tailored to two audiences: visitor (prospects / banca) and owner (Proprietário) — one primary, one muted secondary
- Smooth scroll to features section if page has multiple sections — LOW complexity with CSS

**Anti-features:**
- "Fale conosco" contact form — no backend for it, creates dead end
- Newsletter signup — no email service configured
- Pricing table — explicitly out of scope
- Chatbot or live chat widget — out of scope entirely
- Cookie consent banner — the landing page has no tracking and no need for one

**Dependencies on existing features:**
- /unidades must be accessible publicly (already is)
- /login must exist and work (already does)
- No new backend dependencies — purely frontend repair

**Complexity:** LOW. This is link repair + button addition in an existing static component.

---

### 3. /unidades Public Listing Redesign

**Context:** Phase 4 (v1.0) already did a "redesign to Obsidian Blueprint." The milestone notes it is "currently extremely ugly" — indicating the v1.0 redesign didn't land well, or the milestone description is pre-Phase-4. The existing page already handles: Realtime subscription (cards disappear on rental), `valor_visivel` masking ("Consulte o Proprietário"), `next/image`, Manrope/Noto Sans fonts.

**Table stakes:**
- Price prominently displayed (or "Consulte o Proprietário" — already masked via `valor_visivel`)
- Unit name, building name, area (m²) visible on card without expanding
- Status badge: "Disponível" clearly distinguishable (green or brand color)
- "Back to home" navigation working — currently identified as a bug
- Mobile-readable cards (tap targets ≥44px, no horizontal overflow)
- Empty state when no units are available (don't show a blank page)

**Differentiators:**
- Filter/sort by building or price range — MEDIUM complexity (client-side is fine, no new queries)
- Search by unit name — LOW complexity client-side filter
- Card hover state with subtle elevation/shadow to indicate interactivity — LOW complexity
- Contact CTA on each card ("Fale com o Proprietário" → email link or phone) if the Proprietário's contact info is available — LOW complexity

**Anti-features:**
- Map view with pins — needs a maps API, not justified for a demo
- Photo gallery carousel per unit — `unidades` schema has no `fotos` column; adding it is pós-TCC
- "Save to favorites" — requires auth for visitors, out of scope
- Advanced filter UI (sliders, dropdowns with multiple criteria) — over-engineered for the number of units a single Proprietário manages
- Pagination — single Proprietário has at most dozens of units; pagination is premature

**Dependencies on existing features:**
- Realtime subscription (`useUnidadesRealtime.js`) must not be broken by layout changes
- `valor_visivel` masking must be preserved through any redesign
- `next/image` domains already configured — keep using it
- The "voltar para home" bug (broken back-navigation) is a dependency: fix this in the same phase as redesign

**Complexity:** LOW-MEDIUM for card layout polish + back-navigation fix. MEDIUM for optional filter feature.

---

### 4. Mobile Responsive — Authenticated Area

**Context:** Dashboard and portal layout/navigation are broken on mobile. This is a known gap, not a new feature — it's rework on existing screens.

**Table stakes:**
- Sidebar collapses to hamburger menu or bottom tab bar on small screens (≤768px)
- Tables become vertically-stacked cards or horizontally-scrollable with sticky first column
- Modals/dialogs don't overflow viewport — full-width on mobile with padding
- Tap targets ≥44px on all interactive elements (buttons, links, form fields)
- No horizontal scroll on the main content area
- Form inputs don't trigger unwanted zoom on focus (font-size ≥16px in inputs)

**Differentiators:**
- Bottom navigation bar for mobile authenticated area (home/contratos/parcelas) — clean native-app feel, LOW-MEDIUM complexity with shadcn Sheet or custom
- Swipe-to-dismiss for mobile modals — MEDIUM complexity, needs a gesture library

**Anti-features:**
- Dedicated native mobile app (React Native/Expo) — pós-TCC, entirely out of scope
- Progressive Web App (PWA) manifest with service worker — adds complexity without banca value
- Touch gesture customization beyond standard tap — out of scope for this timeline

**Dependencies on existing features:**
- All four dashboard tabs (unidades, contratos, parcelas, locatários) must be audited individually
- Portal do Locatário has its own layout — must be handled separately
- shadcn/ui Sheet component is already available (sidebar collapse candidate)
- Tailwind v4 responsive prefixes (md:, lg:) are available and should be the primary tool

**Complexity:** MEDIUM-HIGH. Every authenticated screen needs a responsive pass. The sidebar collapse alone (hamburger → Sheet) is the most work; tables-to-cards is repetitive but mechanical.

---

### 5. Desktop Font Scale and Spacing

**Context:** Dashboard elements are "subdimensionado" (too small) on desktop. This is a design calibration task, not a feature.

**Table stakes:**
- Body text ≥14px (shadcn default), heading scale visually distinct (h1 ≥24px in dashboard context)
- Adequate line-height (1.5 for body, 1.2–1.3 for headings)
- Consistent spacing between sections (16px/24px/32px rhythm matching Tailwind v4 scale)
- No elements that feel "lost" in whitespace on 1440px+ displays

**Differentiators:**
- Fluid typography using `clamp()` for graceful scaling from 1280px to 1920px — LOW complexity with Tailwind v4 `text-[clamp(...)]`
- Increased card padding on ≥1280px breakpoint for breathing room — LOW complexity

**Anti-features:**
- Custom CSS variables duplicating what Tailwind v4 already provides
- Font loading via Google Fonts CDN (already using Manrope/Noto Sans locally via next/font)
- Variable fonts with custom axes — over-engineered for this scope

**Dependencies on existing features:**
- CSS vars already defined in `globals.css` (`--font-body`, `--font-display`) — changes must go through these vars, not scattered inline
- Obsidian Blueprint design system must remain intact (roxo/dourado identity)

**Complexity:** LOW. Find-and-replace on spacing/text classes in the affected layout files. High visual impact for low effort.

---

### 6. Action Animations — Micro-interactions

**Context:** `tw-animate-css` is already installed. Target actions: contract close, revoke user access, other destructive CRUD operations.

**Table stakes:**
- Visual feedback on destructive action confirmation (modal shake or button pulse before confirm)
- Row/card exit animation on delete (fade-out + height-collapse, ~200ms)
- Loading spinner on async operations (already partially implemented with skeleton loading)
- Success toast or inline confirmation after action completes ("Contrato encerrado com sucesso")
- Error feedback inline, not just console (already uses `erroMessage` pattern — connect to visible UI)

**Differentiators:**
- Optimistic UI for non-critical actions: mark parcela as paid instantly, revert if server fails — MEDIUM complexity
- Staggered list animation when a section loads (cards fade in sequentially) — LOW complexity with `tw-animate-css` delay utilities
- Button state transitions: idle → loading (spinner replaces label) → success (checkmark) → idle — LOW-MEDIUM complexity

**Anti-features:**
- Framer Motion or React Spring — adds a bundle dependency when `tw-animate-css` + CSS transitions cover the scope
- Page transition animations (route-level) — Next.js App Router makes these fragile; not worth it
- Animated SVG illustrations for empty states — visual scope creep
- Physics-based spring animations — overkill for a CRUD dashboard

**Dependencies on existing features:**
- Revoke access bug must be fixed before adding an animation to it — animation on a broken action is misleading
- Edit-unidades FK constraint error must be fixed before animating edit flows
- Server Actions already return `{ status: 200 }` or `{ status: 500, erroMessage }` — toast/feedback layer should key off this return shape
- shadcn Toast (Sonner) or existing shadcn components should be used — no new UI library

**Complexity:** LOW for CSS-class-based transitions (tw-animate-css). MEDIUM for optimistic UI. The exit animation on row delete is the highest-value / lowest-effort single item.

---

### 7. Theme Color Variations

**Context:** Current design is "Obsidian Blueprint" (roxo/dourado). The goal is to test alternative palettes — likely for post-banca flexibility or demonstrating design system maturity.

**Table stakes:**
- Existing Obsidian Blueprint must remain the default and must not regress
- Any variation must swap only CSS vars (`--indigo`, `--success`, `--warning`, `--danger`, `--fg-*`, `--surface`, `--border-*`) — not touching component markup
- At least one working alternative palette to demonstrate the theme system works

**Differentiators:**
- CSS class-based theme switching (`[data-theme="slate"]` on `<html>`) so switching is zero-JS — LOW complexity
- Dark/light mode as a proper variation (if not already fully implemented) — MEDIUM complexity

**Anti-features:**
- User-selectable theme persisted in DB — database change for a cosmetic feature, pós-TCC
- Fully custom theme builder UI — product scope creep
- Tailwind `darkMode: 'class'` migration from v4 default — risky breaking change this close to banca
- More than 2–3 variations — diminishing returns, the banca cares about polish not variety

**Dependencies on existing features:**
- All CSS vars already in `globals.css` — this is the only file that needs to change for a new theme
- shadcn/ui components bind to the CSS var system — a clean var swap propagates automatically
- Obsidian Blueprint design identity is load-bearing for banca (evaluators expect consistency)

**Complexity:** LOW for a single well-named alternative palette as a CSS block. The hard part is ensuring every surface in the app actually uses vars (not hardcoded colors) — audit required first.

---

## Cross-Category Dependencies

```
Revoke bug fix → Revoke animation (6)
Edit-unidades FK fix → Edit animations (6)
/unidades back-navigation fix → /unidades redesign (3)
Signup → is_proprietario RPC + supabaseAdmin (1)
Theme variations → CSS var audit (7)
Mobile responsive (4) → must not conflict with desktop scale changes (5)
```

## MVP Recommendation for v1.1 (ordered by value/effort)

Prioritize in this order:

1. Bug fixes first (revoke access, edit-unidades FK) — unblock animations and prevent banca-visible failures
2. /unidades back-navigation fix + card layout polish — most public-facing surface
3. Landing page CTA repair — 30 minutes of work, high banca first-impression value
4. Desktop font/spacing scale — high visual impact, low effort
5. Signup Proprietário — needed for "fresh demo" capability; implement the claimed-guard carefully
6. Mobile responsive — MEDIUM-HIGH effort, scope to sidebar + the most-used screens only
7. Action animations (row exit + success toast) — polish that rewards attention
8. Theme variation — single alternative palette as CSS-only; defer dark-mode to pós-TCC

## Sources

- [UX Best Practices for Property Listing Pages](https://www.revivalpixel.com/blog/ux-best-practices-high-converting-property-listing-pages/)
- [Real Estate UX/UI Design Best Practices](https://aspirity.com/blog/best-practices-real-estate)
- [Micro-Interactions: Tiny UI Details Create Massive UX Gains](https://dev.to/parth_g/micro-interactions-explained-how-tiny-ui-details-create-massive-ux-gains-1mca)
- [Guidelines for Optimistic UI in Modern CRUD Apps](https://www.jacobparis.com/content/remix-crud-ui)
- [Real Estate CTAs That Convert](https://www.propphy.com/blog/real-estate-cta-examples-that-convert)
- PROJECT.md (validated features inventory, out-of-scope list, known technical debt)
- CLAUDE.md (stack, schema, conventions)
