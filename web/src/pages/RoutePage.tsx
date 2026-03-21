import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { ChevronRight, Clock, TrendingUp, AlertTriangle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { TrainLoader } from "@/components/ui/train-loader"
import { api, type EstimateResult } from "@/lib/api"
import { useAuth } from "@/lib/queries"
import { SEO } from "@/components/SEO"
import { BreadcrumbSchema, FAQSchema } from "@/components/StructuredData"

const stationSlugMap: Record<string, string> = {
  "stockholm-c": "Stockholm C",
  "uppsala-c": "Uppsala C",
  "vasteras-c": "Västerås C",
  "eskilstuna-c": "Eskilstuna C",
  "orebro-c": "Örebro C",
  "arlanda-c": "Arlanda C",
  "sala": "Sala",
  "knivsta": "Knivsta",
  "marsta": "Märsta",
  "koping": "Köping",
  "hallsberg": "Hallsberg",
  "strangnas": "Strängnäs",
  "balsta": "Bålsta",
  "enkoping": "Enköping",
  "storvreta": "Storvreta",
  "tierp": "Tierp",
}

function slugToStation(slug: string): string {
  return stationSlugMap[slug] || slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function stationToSlug(station: string): string {
  return station
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9-]/g, "")
}

const routeFaqItems = [
  {
    question: "Hur mycket ersättning får jag med Movingo?",
    answer:
      "50 kr vid 20–39 min försening, 75 kr vid 40–59 min, och 100% av dagsvärdet vid 60+ min eller inställd avgång.",
  },
  {
    question: "Hur lång tid tar det att få pengarna?",
    answer:
      "Normalt 2–4 veckor från att du skickar in kravet. Tågstrul hjälper dig följa upp statusen.",
  },
  {
    question: "Behöver jag spara kvitto?",
    answer:
      "Nej, med Movingo-kort räcker kortnumret. Du behöver inget kvitto eller biljett.",
  },
  {
    question: "Är tjänsten gratis?",
    answer:
      "Ja, Tågstrul är helt gratis att använda. Du betalar aldrig något i förskott.",
  },
]

export function RoutePage() {
  const { route } = useParams<{ route: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<EstimateResult | null>(null)

  const parts = route?.split("-till-") ?? []
  const fromSlug = parts[0] ?? ""
  const toSlug = parts[1] ?? ""
  const fromStation = slugToStation(fromSlug)
  const toStation = slugToStation(toSlug)

  useEffect(() => {
    if (!fromSlug || !toSlug) {
      setError("Ogiltig sträcka")
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const result = await api.estimateCompensation(fromStation, toStation)
        setData(result)
      } catch {
        setError("Kunde inte hämta data för denna sträcka")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fromStation, toStation, fromSlug, toSlug])

  const handleAuthAction = () => {
    navigate(isAuthenticated ? "/app" : "/login")
  }

  const pageTitle = `Förseningar ${fromStation} → ${toStation}`
  const pageDescription = `Se förseningsstatistik och kräv ersättning för tågresor mellan ${fromStation} och ${toStation}. Movingo-kort ger pengar tillbaka redan vid 20 min försening.`
  const canonicalPath = `/stracka/${stationToSlug(fromStation)}-till-${stationToSlug(toStation)}`

  if (loading) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <SEO title={pageTitle} description={pageDescription} canonical={canonicalPath} />
        <header className="flex items-center justify-between section-padding py-4">
          <Logo size="small" />
        </header>
        <div className="flex flex-1 items-center justify-center">
          <TrainLoader size="md" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <SEO title="Sträcka hittades inte" noindex />
        <header className="flex items-center justify-between section-padding py-4">
          <Logo size="small" />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <AlertTriangle className="size-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Kunde inte hitta sträckan
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Vi kunde inte hitta data för {fromStation} → {toStation}. 
            Prova att söka efter din sträcka på startsidan.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => navigate("/")} variant="default">
              Till startsidan
            </Button>
            <Button onClick={() => navigate("/stracka")} variant="outline">
              Se alla sträckor
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const delayRate = data ? Math.round((data.totalDelays / (7 * 2)) * 100) : 0

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SEO title={pageTitle} description={pageDescription} canonical={canonicalPath} />
      <BreadcrumbSchema
        items={[
          { name: "Hem", url: "/" },
          { name: "Sträckor", url: "/stracka" },
          { name: `${fromStation} → ${toStation}`, url: canonicalPath },
        ]}
      />
      <FAQSchema items={routeFaqItems} />

      <header className="flex items-center justify-between section-padding py-4">
        <Logo size="small" />
        <nav className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAuthAction}
            className="h-10 px-4 text-sm sm:h-9"
          >
            {authLoading ? "" : isAuthenticated ? "Till appen" : "Logga in"}
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="section-padding py-8 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={() => navigate("/stracka")}
              className="mb-6 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Alla sträckor
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{fromStation}</span>
              <span>→</span>
              <span>{toStation}</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Förseningar och ersättning
            </h1>
            <p className="mt-3 text-muted-foreground">
              Statistik för tågresor mellan {fromStation} och {toStation} de senaste 7 dagarna.
              Har du Movingo-kort kan du kräva ersättning redan vid 20 minuters försening.
            </p>
          </div>
        </section>

        {/* Stats Grid - Static/Crawlable Content */}
        <section className="border-t border-border bg-muted/30 section-padding py-8 sm:py-10">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Förseningar
                  </span>
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                  {data?.totalDelays ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  senaste 7 dagarna
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Ersättningsbara
                  </span>
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                  {data?.claimableDelays ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ≥20 min försening
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Uppskattad ersättning
                  </span>
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
                  {data?.estimatedCompensation ?? 0}
                  <span className="ml-1 text-lg font-medium text-muted-foreground">kr</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  med Movingo-kort
                </p>
              </div>
            </div>

            {/* Additional context for SEO */}
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">
                Om sträckan {fromStation} – {toStation}
              </h2>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>
                  Under de senaste 7 dagarna har det registrerats{" "}
                  <strong className="text-foreground">{data?.totalDelays ?? 0} förseningar</strong>{" "}
                  på sträckan mellan {fromStation} och {toStation} (båda riktningar).
                </p>
                {(data?.claimableDelays ?? 0) > 0 ? (
                  <p>
                    Av dessa var{" "}
                    <strong className="text-foreground">{data?.claimableDelays} förseningar</strong>{" "}
                    på minst 20 minuter, vilket ger rätt till ersättning med Movingo-kort.
                    Den uppskattade totala ersättningen är{" "}
                    <strong className="text-foreground">{data?.estimatedCompensation} kr</strong>.
                  </p>
                ) : (
                  <p>
                    Inga förseningar på 20 minuter eller mer har registrerats, vilket betyder att
                    det inte finns några ersättningsbara resor just nu.
                  </p>
                )}
                {delayRate > 0 && (
                  <p>
                    Förseningsfrekvensen ligger på cirka{" "}
                    <strong className="text-foreground">{delayRate}%</strong> av avgångarna.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding py-8 sm:py-10">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">
                Pendlar du {fromStation} – {toStation}?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Lägg in din pendling så bevakar vi dina resor automatiskt och meddelar dig
                när du kan kräva ersättning.
              </p>
              <Button
                onClick={handleAuthAction}
                className="mt-6 h-12 w-full rounded-lg bg-foreground px-6 text-[15px] font-semibold text-background transition-transform hover:bg-foreground/90 active:scale-[0.98] sm:w-auto"
              >
                {isAuthenticated ? "Till appen" : "Kom igång gratis"}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-border bg-muted/30 section-padding py-8 sm:py-10">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-lg font-semibold text-foreground">
              Vanliga frågor om tågersättning
            </h2>
            <dl className="mt-6 divide-y divide-border">
              {routeFaqItems.map((item, index) => (
                <div key={index} className="py-4">
                  <dt className="text-[15px] font-medium text-foreground">
                    {item.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-border section-padding py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
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
          </div>
        </div>
      </footer>
    </div>
  )
}
