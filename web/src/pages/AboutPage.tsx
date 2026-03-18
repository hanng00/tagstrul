import { ArrowLeft, Mail } from "lucide-react"
import { useNavigate } from "react-router"
import { Logo } from "@/components/Logo"

export function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tillbaka
        </button>
        <Logo size="small" />
      </header>

      <main className="flex-1 px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Bakom appen
          </h1>

          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              Tågstrul byggdes av en frustrerad Mälartåg-pendlare som tröttnade 
              på att missa ersättningar för försenade tåg.
            </p>

            <p>
              Reglerna säger att du har rätt till pengar tillbaka vid förseningar 
              — men vem orkar hålla koll på varje resa och fylla i formulär? 
              Det gör vi åt dig.
            </p>

            <p>
              Appen är gratis att använda. Vi tar inte någon del av din ersättning.
            </p>
          </div>

          <section className="mt-10">
            <h2 className="text-sm font-semibold text-foreground">Kontakt</h2>
            <div className="mt-3 rounded-xl border border-border bg-card p-4">
              <a
                href="mailto:hej@tagstrul.se"
                className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-muted-foreground"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Mail className="size-4" />
                </div>
                <span>hej@tagstrul.se</span>
              </a>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <Logo size="small" />
          <span className="text-xs text-muted-foreground">
            Byggt för Movingo-pendlare
          </span>
        </div>
      </footer>
    </div>
  )
}
