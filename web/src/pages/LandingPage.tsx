import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { ChevronRight, Loader2 } from "lucide-react"

const STATIONS = [
  "Stockholm C",
  "Uppsala C",
  "Västerås C",
  "Eskilstuna C",
  "Örebro C",
  "Södertälje Syd",
  "Arlanda C",
  "Knivsta",
  "Märsta",
  "Enköping",
  "Strängnäs",
  "Katrineholm C",
  "Linköping C",
]

const MOCK_DELAY_DATA: Record<string, { delays: number; amount: number }> = {
  "Stockholm C-Uppsala C": { delays: 4, amount: 240 },
  "Uppsala C-Stockholm C": { delays: 3, amount: 180 },
  "Stockholm C-Västerås C": { delays: 2, amount: 180 },
  "Västerås C-Stockholm C": { delays: 3, amount: 270 },
  "Stockholm C-Eskilstuna C": { delays: 2, amount: 150 },
  "Eskilstuna C-Stockholm C": { delays: 2, amount: 150 },
  "Stockholm C-Örebro C": { delays: 3, amount: 360 },
  "Örebro C-Stockholm C": { delays: 2, amount: 240 },
  "Uppsala C-Arlanda C": { delays: 1, amount: 60 },
  "Arlanda C-Uppsala C": { delays: 2, amount: 120 },
  "Stockholm C-Södertälje Syd": { delays: 2, amount: 90 },
  "Södertälje Syd-Stockholm C": { delays: 3, amount: 135 },
}

function getDelayData(from: string, to: string) {
  const key = `${from}-${to}`
  if (MOCK_DELAY_DATA[key]) return MOCK_DELAY_DATA[key]
  const hash = (from.length * to.length) % 5
  return { delays: hash + 1, amount: (hash + 1) * 60 + hash * 30 }
}

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          tågersättning
        </span>
        <button
          onClick={() => navigate("/login")}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Logga in
        </button>
      </header>

      <section className="flex flex-1 flex-col px-5 pb-12 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div className="animate-fade-up">
              <h1 className="text-[clamp(2rem,6vw,3rem)] font-semibold leading-[1.1] tracking-tight text-foreground">
                Tåget var sent.
                <br />
                Du har pengar att hämta.
              </h1>

              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Vi bevakar dina Mälartåg och visar när du kan kräva ersättning.
                Movingo-kort ger pengar tillbaka redan vid 20 min försening.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => navigate("/login")}
                  className="h-12 rounded-lg bg-foreground px-6 text-[15px] font-semibold text-background transition-transform hover:bg-foreground/90 active:scale-[0.98]"
                >
                  Kom igång gratis
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>

            <div className="animate-fade-up stagger-1 relative">
              <div className="overflow-hidden rounded-2xl bg-muted">
                <img
                  src="/traincrash.webp"
                  alt="Försenat tåg"
                  className="aspect-4/3 w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card px-4 py-3 shadow-lg sm:-bottom-6 sm:-left-6">
                <p className="text-xs font-medium text-muted-foreground">
                  Senaste veckan
                </p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                  312{" "}
                  <span className="text-sm font-medium text-muted-foreground">
                    förseningar
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CalculatorSection onGetStarted={() => navigate("/login")} />

      <section className="border-t border-border bg-card px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-lg font-semibold text-foreground">
            Så funkar det
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-base font-medium text-foreground">
                Lägg in din pendling
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vilka stationer och vilken tid du brukar åka. Tar tio sekunder.
              </p>
            </div>
            <div>
              <p className="text-base font-medium text-foreground">
                Vi hittar förseningar
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Varje dag kollar vi Mälartågs data mot dina resor. Du behöver
                inte göra något.
              </p>
            </div>
            <div>
              <p className="text-base font-medium text-foreground">
                Kräv ersättning direkt
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vi fyller i ansökan. Du trycker skicka. Klart på 30 sekunder.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-xs text-muted-foreground">
            tågersättning.se
          </span>
          <span className="text-xs text-muted-foreground">
            Byggt för Movingo-pendlare i Mälardalen
          </span>
        </div>
      </footer>
    </div>
  )
}

function CalculatorSection({ onGetStarted }: { onGetStarted: () => void }) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<{
    delays: number
    amount: number
  } | null>(null)

  async function handleCalculate() {
    if (!from || !to || from === to) return
    setCalculating(true)
    setResult(null)
    await new Promise((r) => setTimeout(r, 800))
    setResult(getDelayData(from, to))
    setCalculating(false)
  }

  function handleReset() {
    setFrom("")
    setTo("")
    setResult(null)
  }

  return (
    <section className="border-t border-border bg-muted/50 px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Hur mycket har du missat?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Skriv in din pendling så visar vi hur mycket du kunde ha krävt
              tillbaka senaste veckan.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            {!result ? (
              <div className="space-y-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Från
                  </span>
                  <select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
                  >
                    <option value="">Välj station</option>
                    {STATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Till
                  </span>
                  <select
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
                  >
                    <option value="">Välj station</option>
                    {STATIONS.filter((s) => s !== from).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <Button
                  onClick={handleCalculate}
                  disabled={!from || !to || from === to || calculating}
                  className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                  {calculating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Beräknar...
                    </>
                  ) : (
                    "Beräkna återkrävning"
                  )}
                </Button>
              </div>
            ) : (
              <div className="animate-scale-in text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Senaste 7 dagarna
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {from} → {to}
                </p>

                <div className="mt-6">
                  <p className="text-5xl font-semibold tabular-nums text-foreground">
                    {result.amount}
                    <span className="ml-1 text-xl font-medium text-muted-foreground">
                      kr
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    från {result.delays} ersättningsbara förseningar
                  </p>
                </div>

                <div className="mt-8 space-y-2">
                  <Button
                    onClick={onGetStarted}
                    className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
                  >
                    Börja kräva tillbaka
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                  <button
                    onClick={handleReset}
                    className="w-full py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Testa annan sträcka
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
