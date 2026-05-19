"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/dashboard",            label: "Visão Geral",  code: "VG" },
  { href: "/dashboard/unidades",   label: "Unidades",     code: "UN" },
  { href: "/dashboard/contratos",  label: "Contratos",    code: "CT" },
  { href: "/dashboard/locatarios", label: "Locatários",   code: "LC" },
];

export default function OwnerSidebar({ badges = {} }) {
  const pathname = usePathname();
  const [email, setEmail] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email ?? null);
    });
  }, []);

  return (
    <div
      style={{
        width: 256,
        background: "var(--background)",
        borderRight: "1px solid var(--border-1)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flexShrink: 0,
      }}
    >
      {/* Wordmark */}
      <div style={{ padding: "32px 32px 24px" }}>
        <span className="eyebrow eyebrow--indigo">Console · Proprietário</span>
        <div
          style={{
            fontFamily: "var(--font-display-arch)",
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: -1,
            color: "var(--fg-1)",
            marginTop: 8,
          }}
        >
          ROMMA
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 32px",
                borderLeft: isActive
                  ? "2px solid var(--indigo)"
                  : "2px solid transparent",
                background: isActive ? "var(--surface)" : "transparent",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "oklch(0.265 0 0)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: isActive ? "var(--fg-1)" : "var(--fg-3)",
                }}
              >
                {item.label}
              </span>
              {badges[item.code] != null && (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--indigo)",
                  }}
                >
                  {badges[item.code]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--border-1)",
          paddingTop: 24,
          padding: "24px 32px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-3)",
            textDecoration: "none",
            letterSpacing: 0.5,
          }}
        >
          → Ver Página Pública
        </Link>
        <Link
          href="/portal"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-3)",
            textDecoration: "none",
            letterSpacing: 0.5,
          }}
        >
          → Acessar como Locatário
        </Link>
        {email && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--fg-5)",
              marginTop: 8,
              letterSpacing: 0.5,
            }}
          >
            {email}
          </span>
        )}
      </div>
    </div>
  );
}
