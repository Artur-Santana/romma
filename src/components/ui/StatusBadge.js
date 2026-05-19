const STATUS_MAP = {
  ativo:             { fg: "var(--success)",  bg: "oklch(0.696 0.149 162.48 / 0.12)", label: "Ativo" },
  encerrado:         { fg: "var(--fg-3)",     bg: "oklch(1 0 0 / 0.05)",              label: "Encerrado" },
  cancelado:         { fg: "var(--fg-3)",     bg: "oklch(1 0 0 / 0.05)",              label: "Cancelado" },
  vencendo:          { fg: "var(--warning)",  bg: "oklch(0.769 0.165 70.08 / 0.12)", label: "Vence em 7d" },
  paga:              { fg: "var(--success)",  bg: "oklch(0.696 0.149 162.48 / 0.12)", label: "Paga" },
  pendente:          { fg: "var(--warning)",  bg: "oklch(0.769 0.165 70.08 / 0.12)", label: "Pendente" },
  vencida:           { fg: "var(--danger)",   bg: "oklch(0.417 0.17 27.38 / 0.30)",  label: "Vencida" },
  futura:            { fg: "var(--fg-4)",     bg: "oklch(1 0 0 / 0.04)",             label: "Futura" },
  disponivel:        { fg: "var(--success)",  bg: "oklch(0.696 0.149 162.48 / 0.12)", label: "Disponível" },
  alugada:           { fg: "var(--fg-4)",     bg: "oklch(1 0 0 / 0.04)",             label: "Alugada" },
  aceito:            { fg: "var(--success)",  bg: "oklch(0.696 0.149 162.48 / 0.12)", label: "Convite aceito" },
  pendente_convite:  { fg: "var(--warning)",  bg: "oklch(0.769 0.165 70.08 / 0.12)", label: "Convite pendente" },
};

export default function StatusBadge({ status, size = "sm" }) {
  const config = STATUS_MAP[status] ?? { fg: "var(--fg-3)", bg: "oklch(1 0 0 / 0.05)", label: status };
  const isLg = size === "lg";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: isLg ? "6px 10px" : "4px 8px",
        background: config.bg,
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: isLg ? 11 : 10,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: config.fg,
        lineHeight: 1.2,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          background: config.fg,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {config.label}
    </span>
  );
}
