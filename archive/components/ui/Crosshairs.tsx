/** Four crosshair marks sitting on the corners of the parent (parent must be `relative`). */
export function Crosshairs({ color = "rgba(255,255,255,0.35)", size = 10, inset = -5 }: { color?: string; size?: number; inset?: number }) {
  const pos = [
    { left: inset, top: inset },
    { right: inset, top: inset },
    { left: inset, bottom: inset },
    { right: inset, bottom: inset },
  ];
  return (
    <>
      {pos.map((p, i) => (
        <svg
          key={i}
          aria-hidden
          width={size}
          height={size}
          viewBox="0 0 10 10"
          className="pointer-events-none absolute transition-colors duration-300"
          style={{ ...p, color }}
        >
          <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1" />
        </svg>
      ))}
    </>
  );
}
