import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="romma-page p-12 bg-background min-h-full">
      {/* Eyebrow */}
      <Skeleton className="h-[10px] w-32 mb-2 rounded-none" />
      {/* Título display */}
      <Skeleton className="h-12 w-64 mb-12 rounded-none" />

      {/* Grid de 4 KPI cards */}
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}
        className="border border-border-3 mb-12"
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={i < 3 ? "p-7 border-r border-border-3" : "p-7"}
          >
            <Skeleton className="h-[10px] w-24 mb-3 rounded-none" />
            <Skeleton className="h-12 w-32 rounded-none" />
          </div>
        ))}
      </div>

      {/* Bloco de lista/tabela */}
      <Skeleton className="h-64 w-full rounded-none mt-4" />
    </div>
  )
}
