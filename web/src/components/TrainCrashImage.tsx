const moneyPopups = [
  { amount: "+50 kr", top: "40%", left: undefined, right: "20%", bottom: undefined, size: "24px", rotate: "3deg" },
]

export function TrainCrashImage({ 
  className = "",
  style,
  showDisclaimer = true,
}: { 
  className?: string
  style?: React.CSSProperties
  showDisclaimer?: boolean 
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-muted ${className}`} style={style}>
      <img
        src="/traincrash.webp"
        alt="Försenat tåg"
        className="w-full h-full object-cover object-center"
      />
      
      {/* Game-style money popups */}
      {moneyPopups.map((popup, i) => (
        <div
          key={i}
          className="absolute rounded-lg bg-emerald-500/80 backdrop-blur-sm text-white font-bold shadow-lg border border-emerald-400/50"
          style={{
            top: popup.top,
            left: popup.left,
            right: popup.right,
            bottom: popup.bottom,
            padding: popup.size === "26px" ? "12px 18px" : popup.size === "22px" ? "10px 16px" : "8px 14px",
            fontSize: popup.size,
            transform: `rotate(${popup.rotate})`,
          }}
        >
          {popup.amount}
        </div>
      ))}

      {/* Disclaimer */}
      {showDisclaimer && (
        <div 
          className="absolute bottom-3 right-3 rounded-lg bg-black/60 backdrop-blur-sm text-white/80 text-center"
          style={{ padding: "6px 12px", fontSize: "10px" }}
        >
          Urspårning vid ovädret Hans, augusti 2023. Ingen kom till skada.
        </div>
      )}
    </div>
  )
}
