import { AlertTriangle, Check, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router"
import { useDelays, useClaims } from "@/lib/queries"
import type { Delay } from "@/types"

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

export function HomePage() {
  const { data: delays = [], isLoading: delaysLoading } = useDelays()
  const { data: claims = [], isLoading: claimsLoading } = useClaims()
  const navigate = useNavigate()

  const loading = delaysLoading || claimsLoading
  const totalRecovered = claims.reduce(
    (sum, claim) => sum + claim.estimatedCompensation,
    0,
  )

  const claimable = delays.filter((d) => d.claimable && !d.claimed)
  const claimed = delays.filter((d) => d.claimed)
  const notClaimable = delays.filter((d) => !d.claimable && !d.claimed)

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-6 pb-5">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Återkrävt totalt
        </p>
        <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-foreground">
          {totalRecovered}
          <span className="ml-1 text-lg font-medium text-muted-foreground">
            kr
          </span>
        </p>
      </header>

      <div className="flex-1 px-5 pb-6">
        {claimable.length > 0 && (
          <section className="animate-fade-up">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Att kräva
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {claimable.reduce((s, d) => s + d.estimatedCompensation, 0)} kr
              </span>
            </div>
            <div className="space-y-2">
              {claimable.map((delay, i) => (
                <ClaimableCard
                  key={delay.delayId}
                  delay={delay}
                  onClick={() => navigate(`/app/claim/${delay.delayId}`)}
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          </section>
        )}

        {claimable.length === 0 && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Check className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              Inga ersättningar just nu
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vi bevakar dina tåg och meddelar dig
            </p>
          </div>
        )}

        {claimed.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Skickade
            </h2>
            <div className="space-y-1.5">
              {claimed.map((delay) => (
                <ClaimedRow key={delay.delayId} delay={delay} />
              ))}
            </div>
          </section>
        )}

        {notClaimable.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-xs font-medium text-muted-foreground">
              Under 20 min — ej ersättningsbara
            </h2>
            <div className="space-y-1">
              {notClaimable.map((delay) => (
                <SmallDelayRow key={delay.delayId} delay={delay} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ClaimableCard({
  delay,
  onClick,
  style,
}: {
  delay: Delay
  onClick: () => void
  style?: React.CSSProperties
}) {
  const deadlineDays = delay.claimDeadline
    ? daysUntil(delay.claimDeadline)
    : null
  const urgent = deadlineDays !== null && deadlineDays <= 7

  return (
    <button
      onClick={onClick}
      style={style}
      className="animate-fade-up group flex w-full flex-col rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-foreground/15 hover:shadow-sm active:scale-[0.995]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <span className="truncate">{delay.fromStation}</span>
            <span className="shrink-0 text-muted-foreground">→</span>
            <span className="truncate">{delay.toStation}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(delay.date)} · {delay.scheduledDeparture}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold tabular-nums text-foreground">
            {delay.estimatedCompensation}
            <span className="ml-0.5 text-sm font-medium text-muted-foreground">
              kr
            </span>
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-destructive">
            {delay.cancelled ? "Inställt" : `+${delay.delayMinutes} min`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        {urgent ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="size-3.5" />
            <span>{deadlineDays} dagar kvar</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            Kräv inom 30 dagar
          </span>
        )}
        <span className="flex items-center gap-1 text-xs font-semibold text-foreground transition-colors group-hover:text-foreground/80">
          Kräv ersättning
          <ChevronRight className="size-3.5" />
        </span>
      </div>
    </button>
  )
}

function ClaimedRow({ delay }: { delay: Delay }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3.5 py-2.5">
      <div className="flex items-center gap-2 text-sm text-foreground">
        <span>{delay.fromStation}</span>
        <span className="text-muted-foreground">→</span>
        <span>{delay.toStation}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm tabular-nums text-muted-foreground">
          {delay.estimatedCompensation} kr
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Check className="size-3" />
          Skickad
        </span>
      </div>
    </div>
  )
}

function SmallDelayRow({ delay }: { delay: Delay }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span>{delay.fromStation}</span>
        <span>→</span>
        <span>{delay.toStation}</span>
      </div>
      <span className="tabular-nums">{delay.delayMinutes} min</span>
    </div>
  )
}
