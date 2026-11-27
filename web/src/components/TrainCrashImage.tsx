const moneyPopups = [
  { amount: "+50 kr", top: "25%", left: "15%", rotate: "-3deg" },
  { amount: "+50 kr", top: "45%", right: "12%", rotate: "4deg" },
  { amount: "+50 kr", bottom: "30%", left: "25%", rotate: "2deg" },
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
          className="absolute rounded-md sm:rounded-lg bg-money/90 backdrop-blur-sm text-white font-bold shadow-lg px-2 py-1 sm:px-4 sm:py-2.5 text-xs sm:text-base"
          style={{
            top: popup.top,
            left: popup.left,
            right: popup.right,
            bottom: popup.bottom,
            transform: `rotate(${popup.rotate})`,
          }}
        >
          {popup.amount}
        </div>
      ))}

      {/* Disclaimer */}
      {showDisclaimer && (
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 rounded-md sm:rounded-lg bg-black/60 backdrop-blur-sm text-white/80 text-center px-2 py-1 sm:px-3 sm:py-1.5 text-[8px] sm:text-[10px] max-w-[140px] sm:max-w-none">
          Urspårning vid ovädret Hans, augusti 2023. Ingen kom till skada.
        </div>
      )}
    </div>
  )
}
