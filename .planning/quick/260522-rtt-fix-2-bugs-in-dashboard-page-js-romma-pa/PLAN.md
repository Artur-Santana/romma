---
quick_id: 260522-rtt
slug: fix-2-bugs-in-dashboard-page-js-romma-pa
title: Fix 2 bugs in dashboard/page.js
status: complete
---

# Fix 2 bugs in dashboard/page.js

**Task:** Remove `romma-page` duplicado no wrapper e `hidden md:block` redundante vs `romma-desktop-only`.

## Changes

- `src/app/dashboard/page.js` — 2 wrappers (isEmpty + normal return):
  - Remove `hidden md:block` from outer div (conflicts with `.romma-desktop-only` CSS which already handles display toggle)
  - Remove `romma-page` from outer div (animation class applied twice — inner div retains it)
