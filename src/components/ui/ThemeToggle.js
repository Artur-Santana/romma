"use client"

// DEV-ONLY: ThemeToggle permite ciclar paletas candidatas durante desenvolvimento.
// Este componente NÃO vaza para produção — gateado por process.env.NODE_ENV no layout.
//
// Para ativar manualmente via DevTools:
//   document.documentElement.setAttribute('data-theme', 'pumpkin')
//
// Paletas disponíveis:
//   ""           → Obsidian Blueprint (padrão)
//   "ultra-violet" → Ultra-Violet
//   "pumpkin"    → Pumpkin
//   "cloudy-sky" → Cloudy Sky
//   "deep-olive" → Deep Olive

import { useState } from "react"

const THEMES = ["", "ultra-violet", "pumpkin", "cloudy-sky", "deep-olive"]
const LABELS = ["Obsidian", "Ultra-Violet", "Pumpkin", "Cloudy Sky", "Deep Olive"]

export default function ThemeToggle() {
  const [idx, setIdx] = useState(0)

  function handleNext() {
    const nextIdx = (idx + 1) % THEMES.length
    setIdx(nextIdx)
    document.documentElement.setAttribute("data-theme", THEMES[nextIdx])
  }

  return (
    <div style={{
      position: "fixed",
      bottom: "16px",
      right: "16px",
      zIndex: 9999,
    }}>
      <button
        style={{ all: "unset", cursor: "pointer" }}
        className="font-mono text-[15px] text-fg-4 tracking-[1px] uppercase hover:text-fg-2 transition-colors bg-surface border border-border-3 px-3 py-2"
        onClick={handleNext}
        data-testid="theme-toggle"
      >
        DEV: Tema — {LABELS[idx]}
      </button>
    </div>
  )
}
