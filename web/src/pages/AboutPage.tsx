import { useState } from "react"
import { ArrowLeft, MessageSquare, Send, Check } from "lucide-react"
import { useNavigate } from "react-router"
import { Logo } from "@/components/Logo"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { SEO } from "@/components/SEO"
import { BreadcrumbSchema } from "@/components/StructuredData"

export function AboutPage() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      await api.submitFeedback({
        message: message.trim(),
        email: email.trim() || undefined,
        source: "about_page",
      })
      setSubmitted(true)
      setMessage("")
      setEmail("")
    } catch {
      setError("Kunde inte skicka. Försök igen.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <SEO
        title="Om oss"
        description="Tågstrul byggdes av en frustrerad Mälartåg-pendlare som tröttnade på att missa ersättningar för försenade tåg. Gratis tjänst för att kräva tillbaka pengar."
        canonical="/om"
      />
      <BreadcrumbSchema
        items={[
          { name: "Hem", url: "/" },
          { name: "Om oss", url: "/om" },
        ]}
      />

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
            <h2 className="text-sm font-semibold text-foreground">Feedback</h2>
            
            {submitted ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-money/20 bg-money-surface p-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-money/10">
                  <Check className="size-4 text-money" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Tack för din feedback!
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setShowForm(false)
                    }}
                    className="mt-0.5 text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Skicka mer
                  </button>
                </div>
              </div>
            ) : showForm ? (
              <div className="mt-3 rounded-xl border border-border bg-card p-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Meddelande
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Vad vill du berätta?"
                      rows={4}
                      className="mt-1 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      E-post <span className="text-muted-foreground/50">(valfritt)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Om du vill ha svar"
                      className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowForm(false)}
                      disabled={submitting}
                    >
                      Avbryt
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={!message.trim() || submitting}
                      className="gap-1.5"
                    >
                      {submitting ? (
                        <div className="size-3.5 animate-spin rounded-full border-2 border-background/20 border-t-background" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      Skicka
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-border bg-card p-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex w-full items-center gap-3 text-sm text-foreground transition-colors hover:text-muted-foreground"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <MessageSquare className="size-4" />
                  </div>
                  <span>Skicka feedback eller förslag</span>
                </button>
              </div>
            )}
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
