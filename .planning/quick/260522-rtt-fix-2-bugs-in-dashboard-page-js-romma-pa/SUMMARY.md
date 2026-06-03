---
quick_id: 260522-rtt
status: complete
---

# Summary

Fixed 2 bugs in `src/app/dashboard/page.js` (ambos os branches — isEmpty + normal return):

1. `hidden md:block` removido do wrapper `romma-desktop-only` — conflito de specificity: Tailwind v4 utilities sobrescrevem CSS regular, tornando `.romma-desktop-only` ineficaz no toggle mobile/desktop.
2. `romma-page` removido do wrapper externo — animação `rommaFadeIn` aplicada duas vezes em divs aninhados; somente o div interno retém a classe.

Commit: fix(dashboard): remover romma-page duplicado e hidden md:block redundante no wrapper desktop
