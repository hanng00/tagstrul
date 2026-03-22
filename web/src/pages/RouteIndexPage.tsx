import { useNavigate } from "react-router"
import { ArrowLeft, Train, ChevronRight } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/queries"
import { SEO } from "@/components/SEO"
import { BreadcrumbSchema } from "@/components/StructuredData"
import { popularRoutes, stationToSlug } from "@/data/popular-routes"

export function RouteIndexPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  const handleAuthAction = () => {
    navigate(isAuthenticated ? "/app" : "/login")
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SEO
        title="Populära tågsträckor"
        description="Se förseningsstatistik och ersättningsmöjligheter för populära pendlarsträckor i Mälardalen. Stockholm, Uppsala, Västerås, Örebro och fler."
        canonical="/stracka"
      />
      <BreadcrumbSchema
        items={[
          { name: "Hem", url: "/" },
          { name: "Sträckor", url: "/stracka" },
        ]}
      />

      <header className="flex items-center justify-between section-padding py-4">
        <Logo size="small" />
        <nav className="flex items-center gap-2">
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

      <main className="flex-1">
        <section className="section-padding py-8 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={() => navigate("/")}
              className="mb-6 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Tillbaka
            </button>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Populära tågsträckor
            </h1>
            <p className="mt-3 text-muted-foreground">
              Se förseningsstatistik och ersättningsmöjligheter för de vanligaste
              pendlarsträckorna i Mälardalen.
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 section-padding py-8 sm:py-10">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-3 sm:grid-cols-2">
              {popularRoutes.map((route) => {
                const slug = `${stationToSlug(route.from)}-till-${stationToSlug(route.to)}`
                return (
                  <a
                    key={slug}
                    href={`/stracka/${slug}`}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Train className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {route.from} → {route.to}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Se förseningar och ersättning
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <section className="section-padding py-8 sm:py-10">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">
                Hittar du inte din sträcka?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Skapa ett konto och lägg in din pendling så bevakar vi dina resor
                automatiskt — oavsett vilken sträcka du åker.
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
