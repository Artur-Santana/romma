import { cn } from "@/lib/utils";

export default function RealtimeDot({ label, compact = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative w-2 h-2 shrink-0">
        <span className="absolute inset-0 bg-success [animation:rommaPulse_2s_ease-in-out_infinite]" />
        <span className="absolute inset-0 bg-success" />
      </span>
      {label && (
        <span
          className={cn(
            "font-mono uppercase text-fg-2",
            compact ? "text-[9px] tracking-[0.5px]" : "text-[10px] tracking-[1px]"
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
