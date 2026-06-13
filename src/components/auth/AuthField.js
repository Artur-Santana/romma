"use client"

export default function AuthField({
  id,
  label,
  refLabel,
  type,
  value,
  onChange,
  focused,
  hasError,
  onFocus,
  onBlur,
  extra,
  inputRef,
  disabled,
  hint,
}) {
  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
        <label
          htmlFor={id}
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: focused ? "var(--primary-hover)" : "var(--fg-4)",
            transition: "color var(--dur-fast)",
          }}
        >
          {label}
        </label>
        {refLabel && (
          <span className="r-meta" style={{ color: "var(--fg-5)" }}>
            {refLabel}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          style={{
            all: "unset",
            display: "block",
            width: "100%",
            padding: "12px 56px 12px 0",
            fontSize: 16,
            fontFamily: "var(--font-body)",
            color: "var(--fg-1)",
            borderBottom: `1px solid ${hasError ? "var(--danger-fg)" : focused ? "var(--primary-hover)" : "var(--border-2)"}`,
            boxShadow: focused ? "0 1px 0 0 var(--primary-hover)" : "none",
            transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
            boxSizing: "border-box",
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {extra}
      </div>
      {hint && (
        <p className="r-meta" style={{ marginTop: 6, color: "var(--fg-5)" }}>
          {hint}
        </p>
      )}
    </div>
  )
}
