import { useNavigate } from "react-router"
import { ArrowLeft, Calendar, Clock, ChevronRight } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/queries"
import { SEO } from "@/components/SEO"
import { BreadcrumbSchema } from "@/components/StructuredData"

export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: "movingo-ersattning-guide",
    title: "Movingo-ersättning: Komplett guide för pendlare",
    description:
      "Allt du behöver veta om ersättning vid förseningar med Movingo-kort. Regler, belopp och hur du kräver tillbaka pengar.",
    date: "2026-03-20",
    readTime: "5 min",
  },
  {
    slug: "hur-mycket-ersattning-forsening",
    title: "Hur mycket ersättning får jag vid tågförsening?",
    description:
      "Ersättningsnivåer för Movingo-kort: 50 kr vid 20 min, 75 kr vid 40 min, 100% vid 60+ min. Se exakt vad du har rätt till.",
    date: "2026-03-18",
    readTime: "4 min",
  },
  {
    slug: "vanligaste-forseningarna-malardalen",
    title: "Vanligaste förseningarna i Mälardalen 2026",
    description:
      "Statistik över vilka sträckor som drabbas mest av förseningar. Stockholm-Uppsala toppar listan.",
    date: "2026-03-15",
    readTime: "3 min",
  },
]

export function BlogIndexPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  const handleAuthAction = () => {
    navigate(isAuthenticated ? "/app" : "/login")
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SEO
        title="Blogg"
        description="Guider och tips om tågersättning för Movingo-pendlare. Lär dig hur du får tillbaka pengar vid förseningar."
        canonical="/blogg"
      />
      <BreadcrumbSchema
        items={[
          { name: "Hem", url: "/" },
          { name: "Blogg", url: "/blogg" },
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
              Blogg
            </h1>
            <p className="mt-3 text-muted-foreground">
              Guider och tips för dig som pendlar med Movingo-kort och vill få ersättning vid förseningar.
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 section-padding py-8 sm:py-10">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-4">
              {blogPosts.map((post) => (
                <a
                  key={post.slug}
                  href={`/blogg/${post.slug}`}
                  className="group block rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {new Date(post.date).toLocaleDateString("sv-SE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-foreground group-hover:text-foreground/80">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {post.description}
                  </p>
                  <span className="mt-3 inline-flex items-center text-sm font-medium text-foreground">
                    Läs mer
                    <ChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section-padding py-8 sm:py-10">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">
                Pendlar du med Movingo?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Lägg in ditt kort så bevakar vi dina resor och meddelar dig när du kan kräva ersättning.
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
