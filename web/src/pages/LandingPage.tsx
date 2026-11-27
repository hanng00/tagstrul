import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown, ChevronUp, Loader2, Train } from "lucide-react"
import { api } from "@/lib/api"
import { searchStations } from "@/lib/stations"
import { Logo } from "@/components/Logo"
import { TrainCrashImage } from "@/components/TrainCrashImage"
import { useAuth } from "@/lib/queries"
import { SEO } from "@/components/SEO"
import {
  OrganizationSchema,
  WebSiteSchema,
  FAQSchema,
  SoftwareApplicationSchema,
  HowToSchema,
} from "@/components/StructuredData"

export function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  const handleAuthAction = () => {
    navigate(isAuthenticated ? "/app" : "/login")
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SEO canonical="/" />
      <OrganizationSchema />
      <WebSiteSchema />
      <SoftwareApplicationSchema />
      <HowToSchema />
      <FAQSchema items={faqItems} />

      <header className="flex items-center justify-between section-padding py-4">
        <Logo size="small" />
        <nav aria-label="Huvudnavigering" className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/blogg")}
            className="h-10 px-3 text-sm sm:h-9"
          >
            Blogg
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/om")}
            className="h-10 px-3 text-sm sm:h-9"
          >
            Om oss
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAuthAction}
            className="h-10 px-4 text-sm sm:h-9"
          >
            {isLoading ? "" : isAuthenticated ? "Till appen" : "Logga in"}
          </Button>
        </nav>
      </header>

      <main>
        <section aria-labelledby="hero-heading" className="flex flex-1 flex-col section-padding pb-10 pt-6 sm:pb-12 sm:pt-12">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div className="animate-fade-up">
              <h1 id="hero-heading" className="text-[clamp(1.75rem,5vw,3rem)] font-semibold leading-[1.1] tracking-tight text-foreground">
                Tåget var sent.
                <br />
                Du har pengar att hämta.
              </h1>

              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground sm:mt-5">
                Pendlar du med Movingo på SJ:s Mälartåg? Vi bevakar dina resor och visar när du kan kräva ersättning — redan vid 20 min försening.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
                <Button
                  onClick={handleAuthAction}
                  className="h-12 w-full rounded-lg bg-foreground px-6 text-[15px] font-semibold text-background transition-transform hover:bg-foreground/90 active:scale-[0.98] sm:w-auto"
                >
                  {isAuthenticated ? "Till appen" : "Kom igång gratis"}
                  <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            </div>

            <div className="animate-fade-up stagger-1 relative mt-2 lg:mt-0">
              <TrainCrashImage className="aspect-4/3" />
              <div className="absolute -bottom-2 left-2 rounded-xl border border-border bg-card px-3 py-2 shadow-lg sm:-bottom-6 sm:-left-6 sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                  Senaste veckan
                </p>
                <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground sm:text-xl">
                  312{" "}
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                    förseningar
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CalculatorSection onGetStarted={handleAuthAction} isAuthenticated={isAuthenticated} />

      <section aria-labelledby="how-it-works-heading" className="border-t border-border bg-card section-padding py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <h2 id="how-it-works-heading" className="text-lg font-semibold text-foreground">
            Så funkar det
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            För dig med Movingo i Mälardalstrafiks app på SJ:s Mälartåg.
          </p>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3" role="list">
            <li>
              <h3 className="text-base font-medium text-foreground">
                Registrera ditt Movingo-kort
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Lägg in kortnummer och vilka SJ-sträckor du pendlar. Tar tio sekunder.
              </p>
            </li>
            <li>
              <h3 className="text-base font-medium text-foreground">
                Vi hittar förseningar
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Varje dag kollar vi SJ:s Mälartåg-data mot dina resor. Du behöver
                inte göra något.
              </p>
            </li>
            <li>
              <h3 className="text-base font-medium text-foreground">
                Kräv ersättning direkt
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Vi fyller i ansökan med ditt kortnummer. Du trycker skicka. Klart.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <FAQSection />

      <PopularRoutesSection />
      </main>

      <footer className="border-t border-border section-padding py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Logo size="small" />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a
              href="/om"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Om oss
            </a>
            <a
              href="/integritet"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Integritet
            </a>
            <a
              href="/villkor"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Villkor
            </a>
            <a
              href="/cookies"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookies
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function CalculatorSection({ onGetStarted, isAuthenticated }: { onGetStarted: () => void; isAuthenticated: boolean }) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([])
  const [toSuggestions, setToSuggestions] = useState<string[]>([])
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    delays: number
    amount: number
  } | null>(null)

  function handleFromChange(value: string) {
    setFrom(value)
    if (value.length >= 2) {
      setFromSuggestions(searchStations(value, 5).map((s) => s.name))
    } else {
      setFromSuggestions([])
    }
  }

  function handleToChange(value: string) {
    setTo(value)
    if (value.length >= 2) {
      setToSuggestions(searchStations(value, 5).map((s) => s.name))
    } else {
      setToSuggestions([])
    }
  }

  async function handleCalculate() {
    if (!from || !to || from === to) return
    setCalculating(true)
    setResult(null)
    setError(null)

    try {
      const data = await api.estimateCompensation(from, to)
      setResult({
        delays: data.claimableDelays,
        amount: data.estimatedCompensation,
      })
    } catch {
      setError("Kunde inte hämta data. Försök igen.")
    } finally {
      setCalculating(false)
    }
  }

  function handleReset() {
    setFrom("")
    setTo("")
    setResult(null)
    setError(null)
  }

  const isZeroResult = result && result.amount === 0

  return (
    <section className="border-t border-border bg-muted/50 section-padding py-10 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Hur mycket har du missat?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Skriv in din pendling så visar vi hur mycket du kunde ha krävt
              tillbaka med Movingo-kort senaste veckan.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            {!result ? (
              <div className="space-y-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Från
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={from}
                      onChange={(e) => handleFromChange(e.target.value)}
                      onBlur={() =>
                        setTimeout(() => setFromSuggestions([]), 150)
                      }
                      placeholder="T.ex. Stockholm Central"
                      className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors focus:border-foreground sm:h-11 sm:text-sm"
                    />
                    {fromSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                        {fromSuggestions.map((s) => (
                          <li
                            key={s}
                            onMouseDown={() => {
                              setFrom(s)
                              setFromSuggestions([])
                            }}
                            className="cursor-pointer px-3 py-3 text-sm hover:bg-muted active:bg-muted/80 sm:py-2"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Till
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={to}
                      onChange={(e) => handleToChange(e.target.value)}
                      onBlur={() =>
                        setTimeout(() => setToSuggestions([]), 150)
                      }
                      placeholder="T.ex. Uppsala C"
                      className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors focus:border-foreground sm:h-11 sm:text-sm"
                    />
                    {toSuggestions.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                        {toSuggestions.map((s) => (
                          <li
                            key={s}
                            onMouseDown={() => {
                              setTo(s)
                              setToSuggestions([])
                            }}
                            className="cursor-pointer px-3 py-3 text-sm hover:bg-muted active:bg-muted/80 sm:py-2"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </label>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  onClick={handleCalculate}
                  disabled={!from || !to || from === to || calculating}
                  className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                  {calculating ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Hämtar data...
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
                    {result.delays > 0
                      ? `från ${result.delays} ersättningsbara ${result.delays === 1 ? "försening" : "förseningar"}`
                      : "Inga ersättningsbara förseningar"}
                  </p>
                </div>

                {isZeroResult && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left dark:border-amber-900/50 dark:bg-amber-950/30">
                    <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                      <strong>0 kr?</strong> Det kan bero på att sträckan inte trafikeras av SJ:s Mälartåg, 
                      eller att det inte var några förseningar ≥20 min.
                      Vi stödjer endast Movingo på SJ-opererade avgångar.{" "}
                      <a href="/om?request=other-routes" className="underline underline-offset-2 hover:no-underline" target="_blank">
                        Önska fler operatörer
                      </a>
                    </p>
                  </div>
                )}

                <div className="mt-8 space-y-2">
                  <Button
                    onClick={onGetStarted}
                    className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
                  >
                    {isAuthenticated ? "Till appen" : "Börja kräva tillbaka"}
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

const faqItems = [
  {
    question: "Vilka biljetter och sträckor stöds?",
    answer:
      "Just nu stödjer vi endast Movingo-kort köpta i Mälardalstrafiks app, på SJ-opererade Mälartåg-avgångar (t.ex. Stockholm–Uppsala, Stockholm–Västerås, Stockholm–Eskilstuna). Andra operatörer som Västtrafik, SJ Regional, Tåg i Bergslagen eller lokaltrafik stöds inte ännu.",
  },
  {
    question: "Hur mycket ersättning får jag?",
    answer:
      "Med Movingo-kort får du 50% vid 20–39 min försening, 75% vid 40–59 min, och 100% av dagsvärdet vid 60+ min eller inställd avgång.",
  },
  {
    question: "Hur lång tid tar det att få pengarna?",
    answer:
      "Normalt 2–4 veckor från att du skickar in kravet. Vi hjälper dig följa upp statusen.",
  },
  {
    question: "Behöver jag spara kvitto?",
    answer:
      "Nej, med Movingo-kort räcker kortnumret. Du behöver inget kvitto eller biljett.",
  },
  {
    question: "Är tjänsten gratis?",
    answer:
      "Ja, just nu är Tågstrul helt gratis. I framtiden kan vi ta en liten avgift på utbetalda ersättningar, men du betalar aldrig i förskott.",
  },
  {
    question: "Är mina uppgifter säkra?",
    answer:
      "Vi lagrar endast det som krävs för att skicka in krav. Vi säljer aldrig din data och du kan radera ditt konto när som helst.",
  },
  {
    question: "Vad händer om kravet avslås?",
    answer:
      "Du förlorar ingenting. Tjänsten är gratis och du kan alltid överklaga själv om du vill.",
  },
]

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section aria-labelledby="faq-heading" className="border-t border-border bg-background section-padding py-10 sm:py-12">
      <div className="mx-auto max-w-xl">
        <h2 id="faq-heading" className="text-lg font-semibold text-foreground">Vanliga frågor</h2>
        <dl className="mt-6 divide-y divide-border">
          {faqItems.map((item, index) => (
            <div key={index} className="py-4">
              <dt>
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                  className="flex w-full items-center justify-between gap-4 py-1 text-left"
                >
                  <span className="text-[15px] font-medium text-foreground">
                    {item.question}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>
              </dt>
              {openIndex === index && (
                <dd id={`faq-answer-${index}`} className="pt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const popularRoutes = [
  { from: "Stockholm C", to: "Uppsala C", slug: "stockholm-c-till-uppsala-c" },
  { from: "Stockholm C", to: "Västerås C", slug: "stockholm-c-till-vasteras-c" },
  { from: "Stockholm C", to: "Eskilstuna C", slug: "stockholm-c-till-eskilstuna-c" },
  { from: "Uppsala C", to: "Arlanda C", slug: "uppsala-c-till-arlanda-c" },
  { from: "Västerås C", to: "Eskilstuna C", slug: "vasteras-c-till-eskilstuna-c" },
  { from: "Stockholm C", to: "Örebro C", slug: "stockholm-c-till-orebro-c" },
]

function PopularRoutesSection() {
  return (
    <section aria-labelledby="routes-heading" className="border-t border-border bg-muted/30 section-padding py-10 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h2 id="routes-heading" className="text-lg font-semibold text-foreground">
            Populära pendlarsträckor
          </h2>
          <a
            href="/stracka"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Visa alla →
          </a>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Se förseningsstatistik och ersättningsmöjligheter för SJ:s Mälartåg-sträckor.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularRoutes.map((route) => (
            <a
              key={route.slug}
              href={`/stracka/${route.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Train className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {route.from} → {route.to}
                </p>
                <p className="text-xs text-muted-foreground">
                  Förseningar & ersättning
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
