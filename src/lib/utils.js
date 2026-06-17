import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function fmtBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v ?? 0)
}

export function fmtBRLk(v) {
  const n = v ?? 0
  if (n >= 1000) {
    return "R$" + (n / 1000).toFixed(1).replace(".", ",").replace(",0", "") + "k"
  }
  return fmtBRL(n)
}

export function shortBuilding(n) {
  return (n || "").replace("Edifício ", "").replace("Centro Empresarial ", "CE ").replace("Torre ", "")
}

export function fmtData(d) {
  if (!d) return "—"
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

export function refOf(u) {
  return "UN-" + u.id.slice(0, 6).toUpperCase()
}
