/**
 * Desktop scale tests — UX-01 e D-08
 *
 * UX-01: Conteúdo do dashboard contido em max-width ~1570px e centralizado
 *        a viewports >= 1280px. Não deve esticar até as bordas.
 *
 * D-08: Nenhum texto de corpo (não-isento) abaixo de 14px em viewport desktop.
 *       Isentos: labels uppercase/tracking, chips font-mono, elementos mobile-only,
 *       e classes utilitárias [9px], [10px], [11px], [12px].
 *
 *       AVISO: esta verificação cobre "texto de corpo inesperado abaixo de 14px",
 *       não "nenhum texto abaixo de 14px". Elementos com classes tracking/font-mono/
 *       [9-12px] são isentos por design. Cobertura é proporcional ao seed de dados.
 *
 * Para executar:
 *   npx playwright test desktop-scale --project=chromium
 */

import { test, expect } from '@playwright/test'
import { login } from './helpers.js'
import { PROPRIETARIO } from './fixtures.js'

test.describe("desktop-scale", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, PROPRIETARIO)
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
  })

  // -------------------------------------------------------------------------
  // UX-01 — max-width wrapper: conteúdo não estica até as bordas a 2200px
  // -------------------------------------------------------------------------
  test("UX-01 — wrapper do dashboard limitado a ~1570px e centralizado (viewport 2200px)", async ({ page }) => {
    // Viewport muito maior que 1570px para que o cap seja ativo
    await page.setViewportSize({ width: 2200, height: 1000 })
    await page.goto('/dashboard')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })

    // Aguardar conteúdo real renderizar
    await expect(page.getByText('Visão Geral.')).toBeVisible({ timeout: 10_000 })

    const result = await page.evaluate(() => {
      // O wrapper é o primeiro filho de <main> com maxWidth definido inline
      const main = document.querySelector('main')
      if (!main) return { error: 'main not found' }

      const wrapper = Array.from(main.querySelectorAll('div')).find(el => {
        return el.style.maxWidth && el.style.maxWidth !== ''
      })
      if (!wrapper) return { error: 'wrapper with maxWidth not found' }

      const wRect = wrapper.getBoundingClientRect()
      const mRect = main.getBoundingClientRect()

      return {
        wrapperWidth: wRect.width,
        wrapperLeft: wRect.left,
        wrapperRight: wRect.right,
        mainWidth: mRect.width,
        mainLeft: mRect.left,
        mainRight: mRect.right,
        inlineMaxWidth: wrapper.style.maxWidth,
        inlineMargin: wrapper.style.margin,
      }
    })

    expect(result.error).toBeUndefined()

    // 1. max-width inline está definido como 1570px
    expect(result.inlineMaxWidth).toBe('1570px')

    // 2. Largura real do wrapper não excede 1570px + tolerância de padding (48px de padding 0 24px)
    expect(result.wrapperWidth).toBeLessThanOrEqual(1570 + 48 + 5)

    // 3. Wrapper NÃO estica até as bordas do main — deve ser significativamente menor
    //    (a main tem ~1950px com sidebar ~250px; wrapper capped em ~1570px)
    expect(result.wrapperWidth).toBeLessThan(result.mainWidth - 100)

    // 4. Centralizado: distâncias esquerda e direita do main devem ser ~iguais (tolerância 10px)
    const leftGap = result.wrapperLeft - result.mainLeft
    const rightGap = result.mainRight - result.wrapperRight
    expect(Math.abs(leftGap - rightGap)).toBeLessThan(10)
  })

  // -------------------------------------------------------------------------
  // D-08 — Typography floor: nenhum texto de corpo < 14px em páginas do dashboard
  // -------------------------------------------------------------------------
  const dashboardRoutes = [
    { path: '/dashboard',            waitSelector: 'Visão Geral.' },
    { path: '/dashboard/contratos',  waitSelector: 'Contratos.' },
    { path: '/dashboard/locatarios', waitSelector: null }, // URL-based wait only
  ]

  for (const { path, waitSelector } of dashboardRoutes) {
    test(`D-08 — nenhum texto de corpo < 14px em ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(path)
      await page.waitForURL(`**${path}`, { timeout: 10_000 })

      // Aguardar conteúdo renderizado
      await page.waitForLoadState('networkidle', { timeout: 10_000 })
      if (waitSelector) {
        await expect(page.getByText(waitSelector, { exact: false }).first()).toBeVisible({ timeout: 10_000 })
      }

      const result = await page.evaluate(() => {
        // Classes que isentam um elemento da regra de 14px (conforme brief D-08)
        const EXEMPT_CLASSES = [
          'tracking', 'eyebrow', 'uppercase',
          '[9px]', '[10px]', '[11px]', '[12px]',
          'font-mono',
        ]

        function isExempt(el) {
          let node = el
          while (node && node !== document.body) {
            const cls = node.className || ''
            const classStr = typeof cls === 'string' ? cls : ''

            // mobile-only containers
            if (classStr.includes('romma-mobile-only') || classStr.includes('mobile')) {
              return true
            }

            // classes de isenção tipográfica
            for (const exempt of EXEMPT_CLASSES) {
              if (classStr.includes(exempt)) return true
            }

            // computed uppercase
            const cs = window.getComputedStyle(node)
            if (cs.textTransform === 'uppercase') return true

            node = node.parentElement
          }
          return false
        }

        function isVisible(el) {
          const cs = window.getComputedStyle(el)
          if (cs.display === 'none' || cs.visibility === 'hidden') return false
          if (cs.opacity === '0') return false
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 && rect.height === 0) return false
          return true
        }

        function getLeafTextElements(root) {
          const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_ELEMENT,
            null
          )
          const leaves = []
          let node = walker.nextNode()
          while (node) {
            const directText = Array.from(node.childNodes)
              .filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0)
              .map(n => n.textContent.trim())
              .join(' ')

            if (directText.length > 0) {
              leaves.push({ el: node, text: directText })
            }
            node = walker.nextNode()
          }
          return leaves
        }

        const main = document.querySelector('main') || document.body
        const leaves = getLeafTextElements(main)

        const violations = []
        let checkedCount = 0

        for (const { el, text } of leaves) {
          if (!isVisible(el)) continue
          if (isExempt(el)) continue

          checkedCount++
          const fs = parseFloat(window.getComputedStyle(el).fontSize)
          if (fs < 14) {
            violations.push({
              text: text.slice(0, 60),
              fontSize: fs,
              tagName: el.tagName,
              className: (el.className || '').slice(0, 120),
              id: el.id || '',
            })
          }
        }

        return { violations, checkedCount }
      })

      if (result.violations.length > 0) {
        console.log(`D-08 violations on ${path}:`, JSON.stringify(result.violations, null, 2))
      }

      // Deve ter verificado pelo menos 1 nó não-isento — garante que o filtro
      // não exemptou absolutamente tudo (zero checked = página vazia ou filtro quebrado)
      expect(result.checkedCount).toBeGreaterThanOrEqual(1)

      // Zero violações de texto de corpo abaixo de 14px
      expect(result.violations).toHaveLength(0)
    })
  }
})
