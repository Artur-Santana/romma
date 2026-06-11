"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileTopBar({ title, subtitle, onBack, onMenu, right }) {
  return (
    <div className="bg-background border-b border-[var(--border-2)] px-5 pt-5 pb-4 flex items-center gap-3 shrink-0">
      {(onBack || onMenu) && (
        <button
          onClick={onBack || onMenu}
          className="w-8 h-8 border border-[var(--border-2)] bg-transparent flex items-center justify-center cursor-pointer shrink-0 text-fg-2"
        >
          {onBack ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
            </svg>
          )}
        </button>
      )}
      <div className="flex-1">
        {subtitle && (
          <span className="eyebrow eyebrow--indigo text-[11px]">
            {subtitle}
          </span>
        )}
        <h1 className="font-display font-bold text-[28px] tracking-[-1px] text-fg-1 m-0 leading-[1.1]">
          {title}
        </h1>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function MobileBottomNav({ items = [], pathname: pathnameProp }) {
  const routerPathname = usePathname();
  const pathname = pathnameProp ?? routerPathname;

  return (
    <div className="bg-background border-t border-[var(--border-2)] flex shrink-0">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 px-2 pt-[14px] pb-4 text-center no-underline flex flex-col items-center gap-0.5 border-t-2",
              isActive
                ? "border-indigo bg-[oklch(0.265_0_0)]"
                : "border-transparent bg-transparent"
            )}
          >
            <span
              className={cn(
                "font-body font-bold text-[11px] tracking-[1px] uppercase leading-[1.5]",
                isActive ? "text-fg-1" : "text-fg-4"
              )}
            >
              {item.label}
            </span>
            <span
              className={cn(
                "font-mono text-[11px]",
                isActive ? "text-indigo" : "text-fg-5"
              )}
            >
              {item.code}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
