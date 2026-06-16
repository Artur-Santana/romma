import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="romma-desktop-only">
      <div className="romma-page p-12 pb-20 bg-background min-h-full">
        {/* Header */}
        <Skeleton className="h-[10px] w-28 mb-2 rounded-none" />
        <Skeleton className="h-12 w-56 mb-3 rounded-none" />
        <Skeleton className="h-[10px] w-44 mb-12 rounded-none" />

        {/* Hero grid 1.55fr / 1fr */}
        <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16 }} className="mb-12">
          {/* Left: occupancy + chart panel */}
          <Skeleton className="h-80 w-full rounded-none" />
          {/* Right: 3 stacked metric cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Skeleton className="rounded-none" style={{ flex: 1 }} />
            <Skeleton className="rounded-none" style={{ flex: 1 }} />
            <Skeleton className="h-20 w-full rounded-none" />
          </div>
        </div>

        {/* Contratos + Parcelas */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr" }} className="gap-8 mb-12">
          <Skeleton className="h-52 w-full rounded-none" />
          <Skeleton className="h-52 w-full rounded-none" />
        </div>

        {/* Quick actions */}
        <Skeleton className="h-16 w-full rounded-none" />
      </div>
    </div>
  )
}
