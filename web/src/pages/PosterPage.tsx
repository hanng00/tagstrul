import { Logo } from "@/components/Logo"
import { TrainCrashImage } from "@/components/TrainCrashImage"

const stats = [
  { label: "20+ min försening", value: "50", unit: "kr" },
  { label: "Snitt tillbaka/mån", value: "900", unit: "kr", sublabel: "vid 3600kr Movingo" },
  { label: "Pris", value: "Gratis" },
]

export function PosterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4 print:p-0 print:bg-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* A4 at 96dpi = 794 x 1123 px */}
      <div
        className="bg-background flex flex-col shadow-xl print:shadow-none"
        style={{ width: "794px", height: "1123px", padding: "48px" }}
      >
        {/* Header */}
        <header className="flex items-center justify-between">
          <Logo size="default" />
        </header>

        {/* Image at top with money popups */}
        <TrainCrashImage 
          className="flex-1" 
          style={{ marginTop: "32px", minHeight: "200px" }} 
        />

        {/* Hero */}
        <div style={{ marginTop: "32px" }}>
          <h1
            style={{ fontSize: "68px", lineHeight: "0.95" }}
            className="font-semibold tracking-tight text-foreground"
          >
            Tåget var sent.
            <br />
            Du har pengar att hämta.
          </h1>

          <p
            style={{ fontSize: "20px", lineHeight: "1.4" }}
            className="mt-6 text-muted-foreground"
          >
            Trafikverket håller inte tidtabellen. Vi ser till att du får betalt.
          </p>

          {/* Stats row - 3 cards */}
          <div className="flex gap-4" style={{ marginTop: "36px" }}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-2xl border border-border bg-card"
                style={{ padding: "20px 24px" }}
              >
                <p style={{ fontSize: "12px" }} className="font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p style={{ fontSize: "48px", lineHeight: "1" }} className="mt-2 font-semibold tabular-nums text-foreground">
                  {stat.value}
                  {stat.unit && (
                    <span style={{ fontSize: "24px" }} className="font-medium text-muted-foreground ml-1">
                      {stat.unit}
                    </span>
                  )}
                </p>
                {stat.sublabel && (
                  <p style={{ fontSize: "11px" }} className="mt-2 text-muted-foreground">
                    {stat.sublabel}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between" style={{ marginTop: "32px" }}>
          <div>
            <p style={{ fontSize: "32px" }} className="font-semibold tracking-tight text-foreground">
              ersattningsverket.se
            </p>
            <p style={{ fontSize: "15px" }} className="mt-1 text-muted-foreground">
              Det enda verket som ger dig något tillbaka
            </p>
          </div>

          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://ersattningsverket.se&format=svg"
            alt="QR-kod till ersattningsverket.se"
            className="rounded-xl"
            style={{ width: "110px", height: "110px" }}
          />
        </div>
      </div>
    </div>
  )
}
