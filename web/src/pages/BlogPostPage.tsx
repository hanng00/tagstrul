import { useParams, useNavigate } from "react-router"
import { ArrowLeft, Calendar, Clock, ChevronRight } from "lucide-react"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/queries"
import { SEO } from "@/components/SEO"
import { BreadcrumbSchema } from "@/components/StructuredData"
import { blogPosts } from "@/data/blog-posts"

interface BlogContent {
  title: string
  description: string
  date: string
  readTime: string
  content: React.ReactNode
}

const blogContent: Record<string, BlogContent> = {
  "movingo-ersattning-guide": {
    title: "Movingo-ersättning: Komplett guide för pendlare",
    description:
      "Allt du behöver veta om ersättning vid förseningar med Movingo-kort. Regler, belopp och hur du kräver tillbaka pengar.",
    date: "2026-03-20",
    readTime: "5 min",
    content: (
      <>
        <p>
          Pendlar du med Movingo-kort i Mälardalen? Då har du rätt till ersättning när tågen är
          försenade — men de flesta missar att kräva tillbaka pengarna. I den här guiden går vi
          igenom allt du behöver veta.
        </p>

        <h2>Vad är Movingo?</h2>
        <p>
          Movingo är ett periodkort för kollektivtrafik i Mälardalen. Kortet gäller på Mälartåg,
          SL, UL och flera andra trafikbolag. Du köper kortet för en månad, 90 dagar eller ett år.
        </p>

        <h2>När har jag rätt till ersättning?</h2>
        <p>
          Med Movingo-kort har du rätt till ersättning redan vid <strong>20 minuters försening</strong>.
          Det är betydligt bättre än vanliga tågbiljetter där gränsen ofta är 60 minuter.
        </p>
        <p>Ersättningen gäller för:</p>
        <ul>
          <li>Förseningar på 20 minuter eller mer</li>
          <li>Inställda avgångar</li>
          <li>Missade anslutningar på grund av försening</li>
        </ul>

        <h2>Hur mycket får jag?</h2>
        <p>Ersättningen baseras på ditt korts dagspris och förseningens längd:</p>
        <ul>
          <li><strong>20–39 min:</strong> 50 kr</li>
          <li><strong>40–59 min:</strong> 75 kr</li>
          <li><strong>60+ min eller inställt:</strong> 100% av dagens resevärde</li>
        </ul>
        <p>
          Dagspriset beräknas genom att dela kortets totalpris med antalet giltiga dagar.
          Ett årskort på 27 900 kr ger ett dagspris på cirka 76 kr.
        </p>

        <h2>Hur kräver jag ersättning?</h2>
        <p>
          Traditionellt behöver du fylla i ett formulär hos Mälartåg eller SJ och ange datum,
          avgångstid, sträcka och ditt kortnummer. Det tar tid och de flesta glömmer bort det.
        </p>
        <p>
          Med <strong>Tågstrul</strong> slipper du det. Vi bevakar dina resor automatiskt och
          meddelar dig när du har rätt till ersättning. Du trycker på en knapp så skickas kravet in.
        </p>

        <h2>Tips för att maximera ersättningen</h2>
        <ul>
          <li>Registrera ditt Movingo-kort i Tågstrul direkt</li>
          <li>Lägg in alla sträckor du pendlar regelbundet</li>
          <li>Kräv ersättning inom 60 dagar från resan</li>
          <li>Spara ditt kortnummer — det är allt du behöver</li>
        </ul>
      </>
    ),
  },
  "hur-mycket-ersattning-forsening": {
    title: "Hur mycket ersättning får jag vid tågförsening?",
    description:
      "Ersättningsnivåer för Movingo-kort: 50 kr vid 20 min, 75 kr vid 40 min, 100% vid 60+ min. Se exakt vad du har rätt till.",
    date: "2026-03-18",
    readTime: "4 min",
    content: (
      <>
        <p>
          En av de vanligaste frågorna vi får är "hur mycket pengar får jag tillbaka?". Svaret
          beror på hur långt tåget var försenat och vilken typ av kort du har.
        </p>

        <h2>Ersättningsnivåer för Movingo-kort</h2>
        <p>
          Movingo har ett av de bästa ersättningssystemen för pendlare. Du får ersättning redan
          vid 20 minuters försening:
        </p>

        <table>
          <thead>
            <tr>
              <th>Försening</th>
              <th>Ersättning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>20–39 minuter</td>
              <td>50 kr</td>
            </tr>
            <tr>
              <td>40–59 minuter</td>
              <td>75 kr</td>
            </tr>
            <tr>
              <td>60+ minuter</td>
              <td>100% av dagsvärdet</td>
            </tr>
            <tr>
              <td>Inställd avgång</td>
              <td>100% av dagsvärdet</td>
            </tr>
          </tbody>
        </table>

        <h2>Vad är dagsvärdet?</h2>
        <p>
          Dagsvärdet beräknas genom att dela kortets pris med antalet giltiga dagar.
        </p>
        <ul>
          <li><strong>Månadskort (2 790 kr / 30 dagar):</strong> ~93 kr/dag</li>
          <li><strong>90-dagarskort (7 470 kr / 90 dagar):</strong> ~83 kr/dag</li>
          <li><strong>Årskort (27 900 kr / 365 dagar):</strong> ~76 kr/dag</li>
        </ul>

        <h2>Räkneexempel</h2>
        <p>
          Du har ett årskort och tåget är 45 minuter försenat. Då får du 75 kr i ersättning.
          Om samma tåg hade varit 65 minuter försenat hade du fått hela dagsvärdet, cirka 76 kr.
        </p>
        <p>
          Pendlar du varje dag och drabbas av en 20-minutersförsening per vecka blir det
          50 kr × 52 veckor = <strong>2 600 kr per år</strong> som du kan kräva tillbaka.
        </p>

        <h2>Varför missar folk ersättning?</h2>
        <p>
          De flesta vet inte att de har rätt till ersättning, eller tycker det är för krångligt
          att fylla i formulär. Med Tågstrul löser vi det — vi bevakar dina resor och gör det
          enkelt att kräva tillbaka pengarna.
        </p>
      </>
    ),
  },
  "vanligaste-forseningarna-malardalen": {
    title: "Vanligaste förseningarna i Mälardalen 2026",
    description:
      "Statistik över vilka sträckor som drabbas mest av förseningar. Stockholm-Uppsala toppar listan.",
    date: "2026-03-15",
    readTime: "3 min",
    content: (
      <>
        <p>
          Vi har analyserat förseningsdata för Mälartåg under 2026 och sammanställt vilka
          sträckor som drabbas mest. Resultatet är kanske inte förvånande för dig som pendlar.
        </p>

        <h2>Topp 5 mest försenade sträckor</h2>
        <ol>
          <li>
            <strong>Stockholm C – Uppsala C</strong>
            <br />
            Den mest trafikerade sträckan är också den mest försenade. Hög belastning och
            många tåg på samma spår leder till kedjereaktioner vid minsta störning.
          </li>
          <li>
            <strong>Stockholm C – Västerås C</strong>
            <br />
            Långa sträckor med få alternativa spår gör att förseningar sprider sig snabbt.
          </li>
          <li>
            <strong>Uppsala C – Arlanda C</strong>
            <br />
            Flygplatsresenärer drabbas hårt — en försening här kan betyda missat flyg.
          </li>
          <li>
            <strong>Stockholm C – Eskilstuna C</strong>
            <br />
            Populär pendlarsträcka med regelbundna förseningar, särskilt under rusningstid.
          </li>
          <li>
            <strong>Västerås C – Eskilstuna C</strong>
            <br />
            Kortare sträcka men drabbas ofta av förseningar från Stockholm-trafiken.
          </li>
        </ol>

        <h2>När är det värst?</h2>
        <p>
          Förseningarna är vanligast under:
        </p>
        <ul>
          <li><strong>Morgonrusning (07:00–09:00):</strong> Flest tåg, högst belastning</li>
          <li><strong>Eftermiddagsrusning (16:00–18:00):</strong> Samma problem</li>
          <li><strong>Vintermånaderna:</strong> Snö, is och kyla orsakar tekniska problem</li>
          <li><strong>Måndagar:</strong> Uppstartsproblem efter helgen</li>
        </ul>

        <h2>Vad kan du göra?</h2>
        <p>
          Du kan inte förhindra förseningarna, men du kan se till att få ersättning för dem.
          Med Movingo-kort har du rätt till pengar tillbaka redan vid 20 minuters försening.
        </p>
        <p>
          Registrera dig på Tågstrul så bevakar vi dina resor och meddelar dig automatiskt
          när du kan kräva ersättning.
        </p>
      </>
    ),
  },
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  const post = slug ? blogContent[slug] : null
  const postMeta = blogPosts.find((p) => p.slug === slug)

  const handleAuthAction = () => {
    navigate(isAuthenticated ? "/app" : "/login")
  }

  if (!post || !postMeta) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <SEO title="Artikel hittades inte" noindex />
        <header className="flex items-center justify-between section-padding py-4">
          <Logo size="small" />
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Artikeln hittades inte
          </h1>
          <Button onClick={() => navigate("/blogg")} className="mt-6">
            Till bloggen
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SEO
        title={post.title}
        description={post.description}
        canonical={`/blogg/${slug}`}
        ogType="article"
      />
      <BreadcrumbSchema
        items={[
          { name: "Hem", url: "/" },
          { name: "Blogg", url: "/blogg" },
          { name: post.title, url: `/blogg/${slug}` },
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
        <article className="section-padding py-8 sm:py-12">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => navigate("/blogg")}
              className="mb-6 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Blogg
            </button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {new Date(post.date).toLocaleDateString("sv-SE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {post.readTime}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {post.title}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {post.description}
            </p>

            <div className="prose-custom mt-8">{post.content}</div>
          </div>
        </article>

        <section className="border-t border-border bg-muted/30 section-padding py-8 sm:py-10">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
              <h2 className="text-lg font-semibold text-foreground">
                Få ersättning automatiskt
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Registrera ditt Movingo-kort så bevakar vi dina resor och hjälper dig kräva
                tillbaka pengar vid förseningar.
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
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
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
