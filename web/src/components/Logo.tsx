export function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizes = {
    small: { icon: 18, text: 14, gap: 6 },
    default: { icon: 24, text: 17, gap: 8 },
    large: { icon: 32, text: 26, gap: 10 },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center text-foreground" style={{ gap: s.gap }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        fill="none"
        style={{ width: s.icon, height: s.icon }}
      >
        <g transform="rotate(-12 16 16)">
          <rect x="8" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          <line x1="12" y1="11" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="20" y1="11" x2="20" y2="21" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="11" cy="23" r="2" fill="currentColor"/>
          <circle cx="21" cy="23" r="2" fill="currentColor"/>
        </g>
      </svg>
      <span
        className="font-semibold tracking-tight"
        style={{ fontSize: s.text }}
      >
        tågstrul
      </span>
    </div>
  )
}
