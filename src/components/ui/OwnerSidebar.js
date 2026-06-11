"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import LogoutButton from "@/components/ui/LogoutButton";

const NAV_ITEMS = [
  { href: "/dashboard",             label: "Visão Geral",  code: "VG" },
  { href: "/dashboard/edificios",   label: "Edifícios",    code: "ED" },
  { href: "/dashboard/unidades",    label: "Unidades",     code: "UN" },
  { href: "/dashboard/contratos",   label: "Contratos",    code: "CT" },
  { href: "/dashboard/locatarios",  label: "Locatários",   code: "LC" },
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
    <div className="w-64 bg-background border-r border-[var(--border-1)] flex flex-col h-full shrink-0">
      {/* Wordmark */}
      <div className="px-8 pt-8 pb-6">
        <span className="eyebrow eyebrow--indigo">Console · Proprietário</span>
        <div className="font-display font-bold text-[35px] tracking-[-1px] text-fg-1 mt-2">
          ROMMA
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-8 py-3 border-l-2 no-underline",
                isActive
                  ? "border-indigo bg-surface"
                  : "border-transparent bg-transparent hover:bg-[oklch(0.265_0_0)]"
              )}
            >
              <span
                className={cn(
                  "font-body font-bold text-[15px] tracking-[1.2px] uppercase",
                  isActive ? "text-fg-1" : "text-fg-3"
                )}
              >
                {item.label}
              </span>
              {badges[item.code] != null && (
                <span className="font-mono text-[13px] text-indigo">
                  {badges[item.code]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border-1)] px-8 pt-6 pb-8 flex flex-col gap-[10px]">
        <Link
          href="/"
          className="font-mono text-[14px] text-fg-3 no-underline tracking-[0.5px]"
        >
          → Ver Página Pública
        </Link>
        {email && (
          <span className="font-mono text-[13px] text-fg-5 mt-2 tracking-[0.5px]">
            {email}
          </span>
        )}
        <LogoutButton />
      </div>
    </div>
  );
}
