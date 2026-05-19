"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileTopBar({ title, subtitle, onBack, onMenu, right }) {
  return (
    <div
      style={{
        background: "var(--background)",
        borderBottom: "1px solid var(--border-2)",
        padding: "20px 20px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}
    >
      {(onBack || onMenu) && (
        <button
          onClick={onBack || onMenu}
          style={{
            width: 32,
            height: 32,
            border: "1px solid var(--border-2)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            color: "var(--fg-2)",
          }}
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
      <div style={{ flex: 1 }}>
        {subtitle && (
          <span className="eyebrow eyebrow--indigo" style={{ fontSize: 9 }}>
            {subtitle}
          </span>
        )}
        <h1
          style={{
            fontFamily: "var(--font-display-arch)",
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: -1,
            color: "var(--fg-1)",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

export function MobileBottomNav({ items = [], pathname: pathnameProp }) {
  const routerPathname = usePathname();
  const pathname = pathnameProp ?? routerPathname;

  return (
    <div
      style={{
        background: "var(--background)",
        borderTop: "1px solid var(--border-2)",
        display: "flex",
        flexShrink: 0,
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              flex: 1,
              padding: "14px 8px 16px",
              textAlign: "center",
              textDecoration: "none",
              borderTop: isActive
                ? "2px solid var(--indigo)"
                : "2px solid transparent",
              background: isActive ? "oklch(0.265 0 0)" : "transparent",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: isActive ? "var(--fg-1)" : "var(--fg-4)",
                lineHeight: 1.5,
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: isActive ? "var(--indigo)" : "var(--fg-5)",
              }}
            >
              {item.code}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
