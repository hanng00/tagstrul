import {
  AlertTriangle,
  Check,
  ChevronRight,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Calendar,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useDelays, useClaims } from "@/lib/queries"
import type { Delay } from "@/types"
import { cn } from "@/lib/utils"

function formatDateFull(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / 86_400_000,
  )

  if (diffDays === 0) return "Idag"
  if (diffDays === -1) return "Igår"
  if (diffDays === 1) return "Imorgon"

  return date.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function toDateKey(iso: string) {
  return iso.split("T")[0]
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

export function HomePage() {
  const {
    data: delays = [],
    isLoading: delaysLoading,
    isFetching: delaysFetching,
    refetch: refetchDelays,
  } = useDelays()
  const {
    data: claims = [],
    isLoading: claimsLoading,
    isFetching: claimsFetching,
    refetch: refetchClaims,
  } = useClaims()
  const navigate = useNavigate()
  const [showSmallDelays, setShowSmallDelays] = useState(false)

  const loading = delaysLoading || claimsLoading
  const refreshing = delaysFetching || claimsFetching

  const handleRefresh = () => {
    refetchDelays()
    refetchClaims()
  }

  // Get unique dates from delays, sorted descending (most recent first)
  const availableDates = useMemo(() => {
    const dateSet = new Set(delays.map((d) => toDateKey(d.date)))
    return Array.from(dateSet).sort((a, b) => b.localeCompare(a))
  }, [delays])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Default to most recent date if not selected
  const activeDate = selectedDate ?? availableDates[0] ?? null

  const currentDateIndex = activeDate
    ? availableDates.indexOf(activeDate)
    : -1

  const canGoNewer = currentDateIndex > 0
  const canGoOlder = currentDateIndex < availableDates.length - 1

  const goNewer = () => {
    if (canGoNewer) {
      setSelectedDate(availableDates[currentDateIndex - 1])
    }
  }

  const goOlder = () => {
    if (canGoOlder) {
      setSelectedDate(availableDates[currentDateIndex + 1])
    }
  }

  // Filter delays by selected date
  const delaysForDate = useMemo(() => {
    if (!activeDate) return delays
    return delays.filter((d) => toDateKey(d.date) === activeDate)
  }, [delays, activeDate])

  const claimable = delaysForDate.filter((d) => d.claimable && !d.claimed)
  const claimed = delaysForDate.filter((d) => d.claimed)
  const notClaimable = delaysForDate.filter((d) => !d.claimable && !d.claimed)

  const totalClaimed = claims.reduce(
    (sum, claim) => sum + claim.estimatedCompensation,
    0,
  )

  // All-time claimable (for hero when there are claimable items)
  const allClaimable = delays.filter((d) => d.claimable && !d.claimed)
  const allTotalClaimable = allClaimable.reduce(
    (s, d) => s + d.estimatedCompensation,
    0,
  )

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero section - what can you claim NOW */}
      {allClaimable.length > 0 ? (
        <header className="bg-linear-to-b from-emerald-50 to-background px-5 pt-6 pb-4 dark:from-emerald-950/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Du har pengar att hämta
              </p>
              <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-foreground">
                {allTotalClaimable}
                <span className="ml-1 text-lg font-medium text-muted-foreground">
                  kr
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {allClaimable.length}{" "}
                {allClaimable.length === 1 ? "resa" : "resor"} att kräva
                ersättning för
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground active:scale-95 disabled:opacity-50 dark:hover:bg-white/10"
              aria-label="Uppdatera"
            >
              <RefreshCw
                className={cn("size-4", refreshing && "animate-spin")}
              />
            </button>
          </div>
        </header>
      ) : (
        <header className="px-5 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Allt klart</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Vi bevakar dina resor och meddelar dig vid förseningar
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-50"
              aria-label="Uppdatera"
            >
              <RefreshCw
                className={cn("size-4", refreshing && "animate-spin")}
              />
            </button>
          </div>
        </header>
      )}

      {/* Date picker */}
      {availableDates.length > 0 && (
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <button
            onClick={goOlder}
            disabled={!canGoOlder}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            aria-label="Äldre"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {activeDate ? formatDateFull(new Date(activeDate)) : "—"}
            </span>
          </div>
          <button
            onClick={goNewer}
            disabled={!canGoNewer}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
            aria-label="Nyare"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      <div className="flex-1 px-5 py-4">
        {/* Claimable delays - primary action */}
        {claimable.length > 0 && (
          <section className="animate-fade-up">
            <div className="space-y-2">
              {claimable.map((delay, i) => (
                <ClaimableCard
                  key={delay.delayId}
                  delay={delay}
                  onClick={() =>
                    navigate(`/app/claim/${encodeURIComponent(delay.delayId)}`)
                  }
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state for this date */}
        {delays.length > 0 && delaysForDate.length === 0 && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Check className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              Inga förseningar denna dag
            </p>
          </div>
        )}

        {/* Empty state when no delays at all */}
        {delays.length === 0 && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Check className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              Inga ersättningar just nu
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dina bevakade resor visas här om de blir försenade
            </p>
          </div>
        )}

        {/* Claimed/submitted - secondary info */}
        {claimed.length > 0 && (
          <section className={cn(claimable.length > 0 && "mt-6")}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">
                Skickade krav
              </h2>
              {totalClaimed > 0 && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {totalClaimed} kr
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {claimed.map((delay) => (
                <ClaimedRow key={delay.delayId} delay={delay} />
              ))}
            </div>
          </section>
        )}

        {/* Small delays - collapsed by default, clearly explained */}
        {notClaimable.length > 0 && (
          <section className="mt-6">
            <button
              onClick={() => setShowSmallDelays(!showSmallDelays)}
              className="flex w-full items-center justify-between py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {notClaimable.length} mindre förseningar
                </span>
              </div>
              {showSmallDelays ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            {showSmallDelays && (
              <div className="mt-2 rounded-lg bg-muted/30 p-3">
                <p className="mb-3 text-xs text-muted-foreground">
                  Förseningar under 20 min ger inte rätt till ersättning enligt
                  SJ:s regler.
                </p>
                <div className="space-y-1">
                  {notClaimable.map((delay) => (
                    <SmallDelayRow key={delay.delayId} delay={delay} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newH = Math.floor(totalMinutes / 60) % 24
  const newM = totalMinutes % 60
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`
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

  const actualDeparture = addMinutesToTime(
    delay.scheduledDeparture,
    delay.delayMinutes,
  )

  return (
    <button
      onClick={onClick}
      style={style}
      className="animate-fade-up group flex w-full flex-col rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-foreground/15 hover:shadow-sm active:scale-[0.995]"
    >
      {/* Route */}
      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <span className="truncate">{delay.fromStation}</span>
        <span className="shrink-0 text-muted-foreground">→</span>
        <span className="truncate">{delay.toStation}</span>
      </div>

      {/* Reason for compensation - the key info */}
      <div className="mt-3 rounded-lg bg-destructive/5 px-3 py-2.5">
        {delay.cancelled ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-destructive">
                Tåget ställdes in
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Skulle avgått {delay.scheduledDeparture}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {delay.estimatedCompensation}
                <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                  kr
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-destructive">
                {delay.delayMinutes} min försenat
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                <span className="line-through">{delay.scheduledDeparture}</span>
                <span>→</span>
                <span className="font-medium text-foreground">
                  {actualDeparture}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {delay.estimatedCompensation}
                <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                  kr
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with deadline and CTA */}
      <div className="mt-3 flex items-center justify-between">
        {urgent ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="size-3.5" />
            <span>{deadlineDays} dagar kvar att kräva</span>
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
      <div className="flex items-center gap-2 tabular-nums">
        <span className="text-xs">{delay.scheduledDeparture}</span>
        <span className="text-destructive/70">+{delay.delayMinutes} min</span>
      </div>
    </div>
  )
}
