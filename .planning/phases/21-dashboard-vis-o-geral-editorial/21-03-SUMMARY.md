---
plan: 21-03
phase: 21-dashboard-vis-o-geral-editorial
status: complete
completed_at: "2026-06-16"
commits:
  - c74f9f4  # feat: mobile parity OccupancyBar/CashFlowChart blocks
  - 45b5a11  # fix: mobile layout parity — header + unified stats grid
  - 86c0435  # fix: hide in-bar labels + unify px-3 container
  - 1549e4a  # fix: k-format receita, compact chart, fluxo -4..+1, contratos valor
---

# Plan 21-03 Summary — Mobile Parity

## What Was Built

Mobile dashboard (`md:hidden`) editorial parity for DASH-04/05:

- **Header**: eyebrow + "Visão Geral." title + proprietário name + edifício count
- **Stats 2×2 grid**: unified bordered grid with numbered cells (01–04), amber warning for cell 04
- **CashFlowChart**: `height={120}` `compact` (no top previsto labels, no inner-bar labels) under indigo "FLUXO · PREVISÃO 2026" eyebrow
- **Contratos recentes**: valor + StatusBadge per row; expiring contracts highlighted
- **Quick actions**: `→` arrow added to labels

## Key Decisions

- `CashFlowChart` received `compact` prop → hides top previsto labels + inner-bar value labels; gives bars full vertical space at 120px height
- `OccupancyBar` received `cellHeight` prop (default 28) but was removed from mobile after design review — not in final design
- `fluxo.js` window shifted from `-3..+2` to `-4..+1` → 4 past months + current + 1 future; reduces empty ghost-only bars
- Mobile padding unified to `px-3` (12px) on `romma-mobile-pane` container
- Receita Esperada uses `k` format (`R$79,7k`) to prevent overflow in tight cells
- Stats font reduced to `text-[26px]` for mobile fit

## Side Fixes (same session)

- `MobileNav.js`: `/dashboard` uses exact-match only → INÍCIO no longer activates on sub-routes
- `Unidades.js`: metrics bar → `grid-cols-2 md:grid-cols-4` with responsive border logic; removes scroll wrapper

## Verification

- Mobile 375px browser verified via gsd-browser: all 4 stats visible, chart clean, nav active states correct
- Desktop Unidades: 4-col metrics preserved
- ESLint clean on all touched files
