import { Logo } from "@/components/Logo"
import { TrainCrashImage } from "@/components/TrainCrashImage"

const steps = [
  { number: "1", text: "Koppla ditt SL-kort" },
  { number: "2", text: "Vi bevakar alla dina resor" },
  { number: "3", text: "Pengarna kommer automatiskt" },
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
            Sluta missa ersättningar. Vi bevakar dina resor och ser till att du får tillbaka pengarna — automatiskt.
          </p>

          {/* How it works - 3 steps */}
          <div className="flex gap-4" style={{ marginTop: "36px" }}>
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex-1 rounded-2xl border border-border bg-card flex items-center gap-4"
                style={{ padding: "20px 24px" }}
              >
                <div 
                  className="flex items-center justify-center rounded-full bg-foreground text-background font-bold"
                  style={{ width: "40px", height: "40px", fontSize: "20px", flexShrink: 0 }}
                >
                  {step.number}
                </div>
                <p style={{ fontSize: "18px", lineHeight: "1.3" }} className="font-medium text-foreground">
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          {/* Value prop */}
          <p
            style={{ fontSize: "16px", lineHeight: "1.4", marginTop: "24px" }}
            className="text-muted-foreground"
          >
            <span className="text-foreground font-medium">50 kr</span> per försening över 20 min · Snitt <span className="text-foreground font-medium">900 kr/mån</span> tillbaka · <span className="text-foreground font-medium">Helt gratis</span>
          </p>
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between" style={{ marginTop: "32px" }}>
          <div>
            <p style={{ fontSize: "32px" }} className="font-semibold tracking-tight text-foreground">
              tagstrul.se
            </p>
            <p style={{ fontSize: "15px" }} className="mt-1 text-muted-foreground">
              Få tillbaka pengarna när tåget strular
            </p>
          </div>

          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://tagstrul.se&format=svg"
            alt="QR-kod till tagstrul.se"
            className="rounded-xl"
            style={{ width: "110px", height: "110px" }}
          />
        </div>
      </div>
    </div>
  )
}
