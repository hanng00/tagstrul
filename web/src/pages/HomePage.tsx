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
  MapPin,
} from "lucide-react"
import { api } from "@/lib/api"
import type { Delay } from "@/types"
import { cn } from "@/lib/utils"
import { TrainLoader } from "@/components/ui/train-loader"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageHeader } from "@/components/AppLayout"

import { useHomeData, HomeState } from "./home/useHomeData"
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
    state,
    refreshing,
    handleRefresh,
    refetchDelays,
    refetchClaims,
    availableDates,
    activeDate,
    canGoNewer,
    canGoOlder,
    goNewer,
    goOlder,
    claimable,
    notClaimable,
    dismissedForDate,
    pendingClaims,
    totalPending,
    totalReceived,
  } = useHomeData()

  if (state === HomeState.LOADING) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <TrainLoader size="md" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader sticky={false}>
        <div className="flex items-start justify-between">
          <h1 className="text-sm font-medium text-muted-foreground">
            Du har fått tillbaka
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="-mt-2 -mr-2 flex btn-icon-touch items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-50"
            aria-label="Uppdatera"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </button>
        </div>
        <p className="font-sign mt-1 text-7xl leading-none font-bold text-signal">
          {totalReceived}
          <span className="ml-2 text-3xl font-semibold">kr</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {pendingClaims.length > 0 ? (
            <>
              <span className="font-semibold text-foreground tabular-nums">
                ~{totalPending} kr
              </span>{" "}
              väntar på svar från SJ
            </>
          ) : totalReceived === 0 ? (
            "Kräv ersättning för en försenad resa så hamnar pengarna här."
          ) : (
            "Inga krav väntar på svar just nu."
          )}
        </p>
      </PageHeader>

      <div className="flex-1 app-padding pb-8">
        {pendingClaims.length > 0 && (
          <Collapsible open={showPending} onOpenChange={setShowPending} className="mb-6">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="size-4 text-muted-foreground" />
                Skickade krav ({pendingClaims.length})
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  showPending && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="mt-2 max-h-72">
                <div className="space-y-2">
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

        {state === HomeState.NO_ROUTES ? (
          <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
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
          </div>
        ) : (
          <>
            {/* Claimable Routes */}
            <section className="mt-6">
              <div className="mb-3 flex items-baseline justify-between border-b-2 border-foreground pb-2">
                <h2 className="font-sign text-2xl font-bold text-foreground">
                  Att kräva
                </h2>
                {claimable.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {claimable.length} {claimable.length === 1 ? "resa" : "resor"},{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {claimable.reduce((s, d) => s + d.estimatedCompensation, 0)} kr
                    </span>
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
                <div className="flex items-start gap-3 py-5">
                  <Check className="mt-0.5 size-5 shrink-0 text-kronor" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Inget att kräva den här dagen
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Vi bevakar dina resor och säger till när ett tåg blir 20 minuter sent.
                    </p>
                  </div>
                </div>
              )}
            </section>

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
            {dismissedForDate.length > 0 && (
              <section className="mt-6">
                <button
                  onClick={() => setShowDismissed(!showDismissed)}
                  className="flex w-full items-center justify-between py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <X className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {dismissedForDate.length} dolda resor
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
                    {dismissedForDate.map((delay) => (
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
              <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-card px-2 py-2">
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
                  <span className="text-sm font-semibold text-foreground">
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
          </>
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
        <span className="font-semibold text-late">+{delay.delayMinutes} min</span>
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
