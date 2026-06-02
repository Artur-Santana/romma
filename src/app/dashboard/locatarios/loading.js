import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="romma-page p-12 bg-background min-h-full">
      {/* Eyebrow */}
      <Skeleton className="h-[10px] w-24 mb-2 rounded-none" />
      {/* Título */}
      <Skeleton className="h-9 w-48 mb-8 rounded-none" />
      {/* Tabela / lista */}
      <Skeleton className="h-64 w-full rounded-none" />
    </div>
  )
}
