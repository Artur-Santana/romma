import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const cssPath = resolve(process.cwd(), 'src/app/globals.css')
const css = readFileSync(cssPath, 'utf-8')

describe('v1.5 Design Refinement Tokens — source assertions on globals.css', () => {

  describe('REFINO-01 — Type scale tokens (--rt-*)', () => {
    it('has --rt-metric: 40px', () => expect(css).toMatch(/--rt-metric:\s*40px/))
    it('has --rt-title: 32px', () => expect(css).toMatch(/--rt-title:\s*32px/))
    it('has --rt-title-sm: 24px', () => expect(css).toMatch(/--rt-title-sm:\s*24px/))
    it('has --rt-section: 20px', () => expect(css).toMatch(/--rt-section:\s*20px/))
    it('has --rt-subhead: 16px', () => expect(css).toMatch(/--rt-subhead:\s*16px/))
    it('has --rt-body: 14px', () => expect(css).toMatch(/--rt-body:\s*14px/))
    it('has --rt-data: 14px', () => expect(css).toMatch(/--rt-data:\s*14px/))
    it('has --rt-label: 11px', () => expect(css).toMatch(/--rt-label:\s*11px/))
    it('has --rt-meta: 10px', () => expect(css).toMatch(/--rt-meta:\s*10px/))
  })

  describe('REFINO-02 — Density tokens (--rd-*) — Regular only', () => {
    it('has --rd-gutter: 32px', () => expect(css).toMatch(/--rd-gutter:\s*32px/))
    it('has --rd-gutter-m: 20px', () => expect(css).toMatch(/--rd-gutter-m:\s*20px/))
    it('has --rd-page-y: 28px', () => expect(css).toMatch(/--rd-page-y:\s*28px/))
    it('has --rd-block: 24px', () => expect(css).toMatch(/--rd-block:\s*24px/))
    it('has --rd-block-sm: 16px', () => expect(css).toMatch(/--rd-block-sm:\s*16px/))
    it('has --rd-panel: 20px', () => expect(css).toMatch(/--rd-panel:\s*20px/))
    it('has --rd-cell: 20px', () => expect(css).toMatch(/--rd-cell:\s*20px/))
    it('has --rd-row-y: 12px', () => expect(css).toMatch(/--rd-row-y:\s*12px/))
    it('has --rd-row-x: 16px', () => expect(css).toMatch(/--rd-row-x:\s*16px/))
  })

  describe('Alias + duration tokens required by .r-* classes', () => {
    it('has --dur-base: 220ms', () => expect(css).toMatch(/--dur-base:\s*220ms/))
    it('has --dur-fast: 120ms', () => expect(css).toMatch(/--dur-fast:\s*120ms/))
    it('has --font-display: var(--font-display-arch)', () => expect(css).toMatch(/--font-display:\s*var\(--font-display-arch\)/))
    it('has --highlight: var(--color-highlight)', () => expect(css).toMatch(/--highlight:\s*var\(--color-highlight\)/))
  })

  describe('.r-* helper classes presence', () => {
    it('has .r-metric', () => expect(css).toMatch(/\.r-metric\s*\{/))
    it('has .r-title', () => expect(css).toMatch(/\.r-title\s*\{/))
    it('has .r-section', () => expect(css).toMatch(/\.r-section\s*\{/))
    it('has .r-subhead', () => expect(css).toMatch(/\.r-subhead\s*\{/))
    it('has .r-body', () => expect(css).toMatch(/\.r-body\s*\{/))
    it('has .r-data', () => expect(css).toMatch(/\.r-data\s*\{/))
    it('has .r-label', () => expect(css).toMatch(/\.r-label\s*\{/))
    it('has .r-meta', () => expect(css).toMatch(/\.r-meta\s*\{/))
    it('has .r-eyebrow', () => expect(css).toMatch(/\.r-eyebrow\s*\{/))
    it('has .r-eyebrow.gold (highlight color)', () => expect(css).toMatch(/\.r-eyebrow\.gold\s*\{[^}]*var\(--highlight\)/))
    it('has .r-panel', () => expect(css).toMatch(/\.r-panel\s*\{/))
    it('has .r-dot', () => expect(css).toMatch(/\.r-dot\s*\{/))
  })

  describe('Utilities and keyframes', () => {
    it('has @keyframes rFade (transform-only)', () => expect(css).toMatch(/@keyframes rFade\s*\{/))
    it('has @keyframes rPulse', () => expect(css).toMatch(/@keyframes rPulse\s*\{/))
    it('has .romma-modal-backdrop', () => expect(css).toMatch(/\.romma-modal-backdrop\s*\{/))
    it('romma-modal-backdrop has position:fixed', () => expect(css).toMatch(/\.romma-modal-backdrop\s*\{[^}]*position:\s*fixed/))
    it('romma-modal-backdrop has inset:0', () => expect(css).toMatch(/\.romma-modal-backdrop\s*\{[^}]*inset:\s*0/))
    it('romma-modal-backdrop has display:flex', () => expect(css).toMatch(/\.romma-modal-backdrop\s*\{[^}]*display:\s*flex/))
    it('romma-modal-backdrop has align-items:center', () => expect(css).toMatch(/\.romma-modal-backdrop\s*\{[^}]*align-items:\s*center/))
    it('romma-modal-backdrop has justify-content:center', () => expect(css).toMatch(/\.romma-modal-backdrop\s*\{[^}]*justify-content:\s*center/))
  })

  describe('REFINO-05 — Animation retrofit (.romma-page)', () => {
    it('.romma-page uses rFade (transform-only, not rommaFadeIn)', () => {
      expect(css).toMatch(/\.romma-page\s*\{\s*animation:\s*rFade/)
    })
    it('has @media print guard for .romma-page', () => {
      expect(css).toMatch(/@media print\s*\{[^}]*\.romma-page\s*\{[^}]*animation:\s*none/)
    })
    it('has prefers-reduced-motion guard for .romma-page', () => {
      expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.romma-page/)
    })
  })

  describe('REFINO-F1 guard — density variants must NOT exist', () => {
    it('does NOT contain [data-density] selector (compact/comfy deferred)', () => {
      expect(css).not.toMatch(/data-density/)
    })
  })

  describe('Animation fill-mode bug guard — REFINO-05', () => {
    it('.romma-page does NOT use rommaFadeIn with fill:both', () => {
      expect(css).not.toMatch(/\.romma-page[\s\S]*?rommaFadeIn[^;]*both/)
    })
  })

})
