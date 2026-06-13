"use client"

export default function CornerBrackets() {
  const base = {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: "rgba(201,168,76,0.7)",
    borderStyle: "solid",
    borderWidth: 0,
  }
  const corners = [
    { top: 16, left: 16, borderTopWidth: 1, borderLeftWidth: 1 },
    { top: 16, right: 16, borderTopWidth: 1, borderRightWidth: 1 },
    { bottom: 16, left: 16, borderBottomWidth: 1, borderLeftWidth: 1 },
    { bottom: 16, right: 16, borderBottomWidth: 1, borderRightWidth: 1 },
  ]
  return (
    <>
      {corners.map((style, i) => (
        <span key={i} style={{ ...base, ...style }} />
      ))}
    </>
  )
}
