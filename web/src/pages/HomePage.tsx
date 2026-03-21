import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import {
  Check,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Info,
  MapPin,
} from "lucide-react"
import { api } from "@/lib/api"
import type { Delay } from "@/types"
import { cn } from "@/lib/utils"
import { TrainLoader } from "@/components/ui/train-loader"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/AppLayout"

import { useHomeData } from "./home/useHomeData"
import { ClaimableCard } from "./home/ClaimableCard"
import { PendingClaimCard } from "./home/PendingClaimCard"

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

function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function HomePage() {
  const navigate = useNavigate()
  const [showSmallDelays, setShowSmallDelays] = useState(false)
  const [showPending, setShowPending] = useState(false)
  const [showDismissed, setShowDismissed] = useState(false)

  const {
    loading,
    refreshing,
    handleRefresh,
    refetchDelays,
    refetchClaims,
    hasRoutes,
    availableDates,
    activeDate,
    canGoNewer,
    canGoOlder,
    goNewer,
    goOlder,
    delays,
    claimable,
    notClaimable,
    allClaimable,
    dismissedDelaysForDate,
    pendingClaims,
    totalPending,
    totalReceived,
  } = useHomeData()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <TrainLoader size="md" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Hem</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Översikt över dina ersättningar
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex btn-icon-touch items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-50"
            aria-label="Uppdatera"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </PageHeader>

      <div className="flex-1 app-padding pb-8">
        {/* Hero: Total Received with Pending */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Fått tillbaka totalt
            </p>
            {totalReceived === 0 && pendingClaims.length === 0 && (
              <button
                className="group relative"
                onClick={(e) => {
                  const tooltip = e.currentTarget.querySelector('[data-tooltip]')
                  tooltip?.classList.toggle('hidden')
                }}
              >
                <Info className="size-4 text-muted-foreground/60 hover:text-muted-foreground" />
                <div
                  data-tooltip
                  className="absolute right-0 top-6 z-10 hidden w-56 rounded-lg border border-border bg-popover p-3 text-left text-xs text-muted-foreground shadow-lg"
                >
                  Kräv ersättning för försenade resor så visas summan här
                </div>
              </button>
            )}
          </div>
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-foreground">
            {totalReceived}
            <span className="ml-1 text-lg font-medium text-muted-foreground">kr</span>
          </p>

          {/* Pending claims row */}
          {pendingClaims.length > 0 && (
            <Collapsible
              open={showPending}
              onOpenChange={setShowPending}
              className="mt-4 border-t border-border pt-4"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Väntar på svar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    ~{totalPending} kr
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      showPending && "rotate-180"
                    )}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <ScrollArea className="mt-3 max-h-48">
                  <div className="space-y-2 pr-3">
                    {pendingClaims.map((claim) => (
                      <PendingClaimCard
                        key={claim.claimId}
                        claim={claim}
                        onResolved={() => refetchClaims()}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Claimable Routes */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Ersättningar att kräva{claimable.length > 0 && ` (${claimable.length})`}
            </h2>
            {claimable.length > 0 && (
              <span className="text-sm font-semibold tabular-nums text-money">
                {claimable.reduce((s, d) => s + d.estimatedCompensation, 0)} kr
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
        {allClaimable.length === 0 &&
          pendingClaims.length === 0 &&
          totalReceived === 0 &&
          delays.length === 0 && (
            <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
              {!hasRoutes ? (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <MapPin className="size-5 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Du bevakar inga resor ännu
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lägg till din pendling så hittar vi ersättningar åt dig automatiskt
                  </p>
                  <button
                    onClick={() => navigate("/app/routes")}
                    className="mt-4 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
                  >
                    Lägg till pendling
                  </button>
                </>
              ) : (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <Check className="size-5 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Inga ersättningar just nu
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dina bevakade resor visas här om de blir försenade
                  </p>
                </>
              )}
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
                  Förseningar under 20 min ger inte rätt till ersättning enligt SJ:s
                  regler.
                </p>
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {notClaimable.map((delay) => (
                    <SmallDelayRow key={delay.delayId} delay={delay} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Dismissed delays */}
        {dismissedDelaysForDate.length > 0 && (
          <section className="mt-6">
            <button
              onClick={() => setShowDismissed(!showDismissed)}
              className="flex w-full items-center justify-between py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <X className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {dismissedDelaysForDate.length} dolda resor
                </span>
              </div>
              {showDismissed ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            {showDismissed && (
              <div className="mt-2 space-y-2">
                {dismissedDelaysForDate.map((delay) => (
                  <DismissedDelayRow
                    key={delay.delayId}
                    delay={delay}
                    onRestore={() => refetchDelays()}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Date picker */}
        {availableDates.length > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/30 px-3 py-3 sm:px-4">
            <button
              onClick={goOlder}
              disabled={!canGoOlder}
              className="flex btn-icon-touch items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              aria-label="Äldre"
            >
              <ChevronLeft className="size-5 sm:size-4" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {activeDate ? formatDateFull(parseDateLocal(activeDate)) : "—"}
              </span>
            </div>
            <button
              onClick={goNewer}
              disabled={!canGoNewer}
              className="flex btn-icon-touch items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              aria-label="Nyare"
            >
              <ChevronRight className="size-5 sm:size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SmallDelayRow({ delay }: { delay: Delay }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm text-muted-foreground sm:py-2">
      <div className="flex items-center gap-1.5 truncate pr-2">
        <span className="truncate">{delay.fromStation}</span>
        <span className="shrink-0">→</span>
        <span className="truncate">{delay.toStation}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 tabular-nums">
        <span className="text-xs">{delay.scheduledDeparture}</span>
        <span className="text-destructive/70">+{delay.delayMinutes} min</span>
      </div>
    </div>
  )
}

function DismissedDelayRow({
  delay,
  onRestore,
}: {
  delay: Delay
  onRestore: () => void
}) {
  const [restoring, setRestoring] = useState(false)

  async function handleRestore() {
    setRestoring(true)
    try {
      await api.undismissDelay(delay.delayId)
      onRestore()
      toast.success("Resan återställd")
    } catch (err) {
      console.error(err)
      toast.error("Kunde inte återställa resan")
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-3 sm:py-2">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
          <span className="truncate">{delay.fromStation}</span>
          <span className="shrink-0">→</span>
          <span className="truncate">{delay.toStation}</span>
        </div>
        <span className="text-xs text-muted-foreground/70">
          {delay.date} · {delay.scheduledDeparture}
        </span>
      </div>
      <button
        onClick={handleRestore}
        disabled={restoring}
        className="shrink-0 rounded-md px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 sm:px-2.5 sm:py-1"
      >
        {restoring ? "..." : "Återställ"}
      </button>
    </div>
  )
}
