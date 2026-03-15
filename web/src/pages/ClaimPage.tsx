import { useNavigate, useParams } from "react-router"
import { ArrowLeft, ExternalLink, Copy, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useDelays } from "@/lib/queries"

const SJ_CLAIM_URL = "https://www.sj.se/sv/kundservice/forseningsersattning.html"

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  })
}

export function ClaimPage() {
  const { delayId } = useParams<{ delayId: string }>()
  const navigate = useNavigate()
  const { data: delays = [], isLoading: loading } = useDelays()
  const [copied, setCopied] = useState<string | null>(null)

  const delay = delays.find((d) => d.delayId === delayId) ?? null

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  function openSJClaim() {
    window.open(SJ_CLAIM_URL, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
      </div>
    )
  }

  if (!delay) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-20">
        <p className="text-sm text-muted-foreground">
          Förseningen hittades inte
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate("/app")}>
          Tillbaka
        </Button>
      </div>
    )
  }

  const details = [
    { label: "Datum", value: formatDate(delay.date) },
    { label: "Avgångstid", value: delay.scheduledDeparture },
    { label: "Från", value: delay.fromStation },
    { label: "Till", value: delay.toStation },
    {
      label: "Försening",
      value: delay.cancelled ? "Inställt" : `${delay.delayMinutes} min`,
    },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 pt-4 pb-2">
        <button
          onClick={() => navigate("/app")}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          Begär ersättning
        </h1>
      </header>

      <div className="flex flex-1 flex-col px-5 pb-6 pt-4">
        <div className="animate-fade-up rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-base font-medium text-foreground">
            <span>{delay.fromStation}</span>
            <span className="text-muted-foreground">→</span>
            <span>{delay.toStation}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(delay.date)} · avgång {delay.scheduledDeparture}
          </p>

          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-destructive">
              {delay.cancelled
                ? "Inställt tåg"
                : `${delay.delayMinutes} min försening`}
            </span>
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              ~{delay.estimatedCompensation}
              <span className="ml-0.5 text-sm font-medium text-muted-foreground">
                kr
              </span>
            </span>
          </div>
        </div>

        <div className="animate-fade-up stagger-1 mt-6">
          <h2 className="text-sm font-semibold text-foreground">
            Uppgifter att fylla i på SJ
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Tryck för att kopiera
          </p>

          <div className="mt-4 space-y-2">
            {details.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => copyToClipboard(value, label)}
                className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted active:scale-[0.99]"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {value}
                  </p>
                </div>
                {copied === label ? (
                  <Check className="size-4 text-foreground" />
                ) : (
                  <Copy className="size-4 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-up stagger-2 mt-auto pt-8">
          <Button
            className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
            onClick={openSJClaim}
          >
            <ExternalLink className="mr-2 size-4" />
            Öppna SJ:s ersättningsformulär
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Du fyller i och skickar ansökan direkt på sj.se
          </p>
        </div>
      </div>
    </div>
  )
}
