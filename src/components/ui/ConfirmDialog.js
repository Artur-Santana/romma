"use client";

import { cn } from "@/lib/utils";

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const eyebrowMod  = danger ? "eyebrow--danger" : "eyebrow--indigo";
  const eyebrowText = danger ? "AÇÃO DESTRUTIVA" : (confirmLabel ?? "Confirmação");

  return (
    <div
      onClick={onCancel}
      className="romma-modal-backdrop z-[100]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-[480px] bg-background border flex flex-col gap-5 p-8",
          danger ? "border-danger-fg" : "border-indigo"
        )}
      >
        <span className={`eyebrow ${eyebrowMod}`}>{eyebrowText}</span>
        <div className="font-display font-bold text-[28px] tracking-[-1.2px] text-fg-1 leading-[1.1]">
          {title}
        </div>
        <div className="text-[14px] leading-[1.5] text-fg-2">
          {body}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-border-3 bg-transparent py-[14px] font-body font-bold text-[12px] tracking-[1.2px] uppercase text-fg-2 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 border-none py-[14px] font-body font-bold text-[12px] tracking-[1.2px] uppercase cursor-pointer",
              danger ? "bg-[var(--danger-bg)] text-danger-fg" : "bg-indigo text-fg-1"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
