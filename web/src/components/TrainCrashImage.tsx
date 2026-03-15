const moneyPopups = [
  { amount: "+50 kr", top: "25%", left: "15%", rotate: "-3deg", size: "22px" },
  { amount: "+50 kr", top: "45%", right: "12%", rotate: "4deg", size: "26px" },
  { amount: "+50 kr", bottom: "30%", left: "25%", rotate: "2deg", size: "20px" },
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
          className="absolute rounded-lg bg-emerald-500/70 backdrop-blur-sm text-white font-bold shadow-lg"
          style={{
            top: popup.top,
            left: popup.left,
            right: popup.right,
            bottom: popup.bottom,
            padding: "10px 16px",
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
