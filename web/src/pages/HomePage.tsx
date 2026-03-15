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
  Banknote,
  X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useDelays, useClaims } from "@/lib/queries"
import { api } from "@/lib/api"
import type { Delay, Claim } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

function toDateKey(iso: string | undefined) {
  if (!iso) return ""
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
  const [showPending, setShowPending] = useState(false)

  const loading = delaysLoading || claimsLoading
  const refreshing = delaysFetching || claimsFetching

  const handleRefresh = () => {
    refetchDelays()
    refetchClaims()
  }

  // Get unique dates from delays, sorted descending (most recent first)
  const availableDates = useMemo(() => {
    const dateSet = new Set(
      delays.filter((d) => d.date).map((d) => toDateKey(d.date))
    )
    return Array.from(dateSet).filter(Boolean).sort((a, b) => b.localeCompare(a))
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

  // Filter delays by selected date (exclude dismissed)
  const delaysForDate = useMemo(() => {
    const filtered = delays.filter((d) => !d.dismissed)
    if (!activeDate) return filtered
    return filtered.filter((d) => toDateKey(d.date) === activeDate)
  }, [delays, activeDate])

  const claimable = delaysForDate.filter((d) => d.claimable && !d.claimed)
  const notClaimable = delaysForDate.filter((d) => !d.claimable && !d.claimed)

  // All-time claimable - exclude dismissed
  const allClaimable = delays.filter((d) => d.claimable && !d.claimed && !d.dismissed)
  const allTotalClaimable = allClaimable.reduce(
    (s, d) => s + d.estimatedCompensation,
    0,
  )

  // Claims summary
  const pendingClaims = claims.filter((c) => c.status === "submitted")
  const approvedClaims = claims.filter((c) => c.status === "approved")
  const totalPending = pendingClaims.reduce(
    (s, c) => s + c.estimatedCompensation,
    0,
  )
  const totalReceived = approvedClaims.reduce(
    (s, c) => s + (c.actualCompensation ?? c.estimatedCompensation),
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
      {/* Header - same style as Pendlingar */}
      <header className="flex items-start justify-between px-5 pt-6 pb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Hem</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Översikt över dina ersättningar
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
      </header>

      <div className="flex-1 px-5 pb-6">
        {/* Hero: Total Received */}
        <div className="rounded-xl bg-emerald-50 p-5 dark:bg-emerald-950/20">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Fått tillbaka totalt
          </p>
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-foreground">
            {totalReceived}
            <span className="ml-1 text-lg font-medium text-muted-foreground">
              kr
            </span>
          </p>
          {totalReceived === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Kräv ersättning för försenade resor så visas summan här
            </p>
          )}
        </div>

        {/* Pending Claims - collapsible */}
        {pendingClaims.length > 0 && (
          <section className="mt-4 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
            <button
              onClick={() => setShowPending(!showPending)}
              className="flex w-full flex-col px-4 py-3 text-left"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Väntar på svar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pendingClaims.length} {pendingClaims.length === 1 ? "krav" : "krav"} skickade
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    ~{totalPending} kr
                  </span>
                  {showPending ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              
              {/* Route preview when collapsed */}
              {!showPending && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-11">
                  {pendingClaims.slice(0, 3).map((claim) => (
                    <span
                      key={claim.claimId}
                      className="rounded-full bg-amber-100/80 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                    >
                      {claim.fromStation} → {claim.toStation}
                    </span>
                  ))}
                  {pendingClaims.length > 3 && (
                    <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      +{pendingClaims.length - 3} till
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* Expanded claims - inside the amber container */}
            {showPending && (
              <div className="max-h-64 overflow-y-auto border-t border-amber-200 bg-white/50 px-4 py-3 dark:border-amber-900/50 dark:bg-black/10">
                <div className="space-y-2">
                  {pendingClaims.map((claim) => (
                    <PendingClaimCard
                      key={claim.claimId}
                      claim={claim}
                      onResolved={() => refetchClaims()}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Claimable Routes */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Att kräva ersättning
            </h2>
            {allTotalClaimable > 0 && (
              <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {allTotalClaimable} kr
              </span>
            )}
          </div>
          
          {claimable.length > 0 ? (
            <div className="space-y-2">
              {claimable.map((delay, i) => (
                <ClaimableCard
                  key={delay.delayId}
                  delay={delay}
                  onClick={() =>
                    navigate(`/app/claim/${encodeURIComponent(delay.delayId)}`)
                  }
                  onDismiss={() => refetchDelays()}
                  style={{ animationDelay: `${i * 50}ms` }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Check className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                Inga förseningar att kräva
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Vi bevakar dina resor och meddelar dig vid förseningar
              </p>
            </div>
          )}
        </section>

        {/* Empty state when completely new user */}
        {allClaimable.length === 0 && pendingClaims.length === 0 && totalReceived === 0 && delays.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
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

        {/* Small delays - collapsed by default */}
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

        {/* Date picker - at the bottom */}
        {availableDates.length > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
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
      </div>
    </div>
  )
}

function addMinutesToTime(time: string | undefined, minutes: number): string {
  if (!time) return "--:--"
  const [h, m] = time.split(":").map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newH = Math.floor(totalMinutes / 60) % 24
  const newM = totalMinutes % 60
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`
}

function ClaimableCard({
  delay,
  onClick,
  onDismiss,
  style,
}: {
  delay: Delay
  onClick: () => void
  onDismiss: () => void
  style?: React.CSSProperties
}) {
  const [dismissing, setDismissing] = useState(false)
  const deadlineDays = delay.claimDeadline
    ? daysUntil(delay.claimDeadline)
    : null
  const urgent = deadlineDays !== null && deadlineDays <= 7

  const actualDeparture = addMinutesToTime(
    delay.scheduledDeparture,
    delay.delayMinutes,
  )

  async function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation()
    setDismissing(true)
    try {
      await api.dismissDelay(delay.delayId)
      onDismiss()
    } catch (err) {
      console.error(err)
    } finally {
      setDismissing(false)
    }
  }

  return (
    <div
      style={style}
      className="animate-fade-up rounded-xl border border-border bg-card text-left transition-all"
    >
      <button
        onClick={onClick}
        className="group flex w-full flex-col p-4 transition-all hover:bg-muted/30 active:scale-[0.995]"
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

      {/* Dismiss button */}
      <div className="border-t border-border px-4 py-2">
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="flex w-full items-center justify-center gap-1.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <X className="size-3" />
          {dismissing ? "Döljer..." : "Åkte inte denna resa"}
        </button>
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

function PendingClaimCard({
  claim,
  onResolved,
}: {
  claim: Claim
  onResolved: () => void
}) {
  const [showActions, setShowActions] = useState(false)
  const [showAmountInput, setShowAmountInput] = useState(false)
  const [amount, setAmount] = useState(claim.estimatedCompensation.toString())
  const [loading, setLoading] = useState(false)

  const daysSinceSubmit = Math.floor(
    (Date.now() - new Date(claim.submittedAt).getTime()) / 86_400_000,
  )

  async function handleApproved() {
    setLoading(true)
    try {
      const actualAmount = parseInt(amount, 10) || claim.estimatedCompensation
      await api.updateClaimStatus(claim.claimId, "approved", actualAmount)
      onResolved()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setShowActions(false)
      setShowAmountInput(false)
    }
  }

  async function handleRejected() {
    setLoading(true)
    try {
      await api.updateClaimStatus(claim.claimId, "rejected")
      onResolved()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setShowActions(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <span>{claim.fromStation}</span>
            <span className="text-muted-foreground">→</span>
            <span>{claim.toStation}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(claim.date).toLocaleDateString("sv-SE", {
              day: "numeric",
              month: "short",
            })}{" "}
            · {claim.delayMinutes} min försening
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            ~{claim.estimatedCompensation} kr
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {daysSinceSubmit === 0
              ? "Skickad idag"
              : daysSinceSubmit === 1
                ? "Skickad igår"
                : `${daysSinceSubmit} dagar sedan`}
          </p>
        </div>
      </div>

      {!showActions ? (
        <button
          onClick={() => setShowActions(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Banknote className="size-3.5" />
          Har du fått svar?
        </button>
      ) : showAmountInput ? (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">
              Hur mycket fick du?
            </label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9"
                placeholder={claim.estimatedCompensation.toString()}
              />
              <span className="text-sm text-muted-foreground">kr</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowAmountInput(false)}
              disabled={loading}
            >
              Tillbaka
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleApproved}
              disabled={loading}
            >
              {loading ? "Sparar..." : "Spara"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleRejected}
            disabled={loading}
          >
            <X className="size-3.5" />
            Avslaget
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setShowAmountInput(true)}
            disabled={loading}
          >
            <Check className="size-3.5" />
            Fick pengar
          </Button>
        </div>
      )}
    </div>
  )
}
