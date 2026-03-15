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
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: s.icon, height: s.icon }}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 8h6M8 12h4M8 16h6" />
      </svg>
      <span
        className="font-semibold tracking-tight"
        style={{ fontSize: s.text }}
      >
        ersättningsverket
      </span>
    </div>
  )
}
