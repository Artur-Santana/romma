"use client"

import { cn } from "@/lib/utils";

export default function PageHeader({ eyebrow, title, subtitle, cta }) {
  return (
    <div className="flex items-end justify-between mb-12">
      <div className="flex flex-col gap-2.5">
        <span className="eyebrow eyebrow--indigo">{eyebrow}</span>
        <h2 className="font-display font-bold text-[48px] tracking-[-2.4px] text-fg-1 m-0 leading-none">
          {title}
        </h2>
        {subtitle && (
          <span className="font-mono text-[11px] text-fg-4 tracking-[0.3px]">
            {subtitle}
          </span>
        )}
      </div>
      {cta && (
        <button
          onClick={cta.onClick}
          style={{ all: "unset" }}
          className="flex items-center gap-3 px-5 py-3 border border-indigo bg-[oklch(0.339_0.179_301.68/0.08)] cursor-pointer"
        >
          <span className="font-mono text-[9px] text-indigo tracking-[1px]">
            {cta.code}
          </span>
          <span className="font-body font-bold text-[11px] tracking-[1.4px] uppercase text-fg-1">
            {cta.label}
          </span>
        </button>
      )}
    </div>
  )
}
