import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"
import { Check, ChevronDown, MapPin, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import type { Delay } from "@/types"
import { cn } from "@/lib/utils"
import { TrainLoader } from "@/components/ui/train-loader"

import { useHomeData, HomeState } from "./home/useHomeData"
import { ClaimRow } from "./home/ClaimRow"
import { WalletCard } from "./home/WalletCard"
import { countWord, formatDay, formatKr } from "./home/format"

function todayLabel() {
  const s = new Date().toLocaleDateString("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Home is an inbox of money owed to the user. It answers one question,
 * "what do I need to do?", and offers one main action: claim everything.
 */
export function HomePage() {
  const navigate = useNavigate()
  const {
    state,
    refreshing,
    handleRefresh,
    refetchDelays,
    refetchClaims,
    toClaim,
    dismissed,
    totalToClaim,
    pendingClaims,
    totalPending,
    totalReceived,
    activeCard,
  } = useHomeData()

  if (state === HomeState.LOADING) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <TrainLoader size="md" />
      </div>
    )
  }

  const count = toClaim.length
  const hasWork = state === HomeState.ACTIVE && count > 0

  const wallet = (
    <WalletCard
      totalReceived={totalReceived}
      totalPending={totalPending}
      pendingClaims={pendingClaims}
      activeCard={activeCard}
      onClaimResolved={() => refetchClaims()}
    />
  )

  return (
    <div className="flex flex-1 flex-col">
      <header className="app-padding flex items-start justify-between gap-3 pt-8">
        <p className="text-[15px] text-muted-foreground">{todayLabel()}</p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="-mt-3 -mr-2 flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Uppdatera"
        >
          <RefreshCw className={cn("size-[18px]", refreshing && "animate-spin")} />
        </button>
      </header>

      {state === HomeState.NO_ROUTES ? (
        <div className="app-padding flex flex-1 flex-col pt-2 pb-8">
          <h1 className="text-[34px] leading-[1.1] font-extrabold tracking-tight">
            Vilket tåg tar du?
          </h1>
          <p className="mt-2 text-[17px] text-muted-foreground">
            Lägg till din pendling så letar vi upp förseningar du kan få pengar för.
          </p>
          <button
            onClick={() => navigate("/app/routes")}
            className="mt-6 flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <MapPin className="size-5" />
            Lägg till pendling
          </button>
        </div>
      ) : hasWork ? (
        <>
          <div className="app-padding flex flex-1 flex-col pt-2 pb-6">
            <h1 className="text-[34px] leading-[1.1] font-extrabold tracking-tight">
              {count === 1 ? "1 resa att kräva" : `${count} resor att kräva`}
            </h1>
            <p className="mt-2 text-[17px] text-muted-foreground">
              Sammanlagt{" "}
              <span className="font-bold text-primary tabular-nums">{formatKr(totalToClaim)}</span>{" "}
              att hämta
            </p>

            <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl bg-card">
              {toClaim.map((delay) => (
                <ClaimRow key={delay.delayId} delay={delay} />
              ))}
            </div>
            <p className="mt-2.5 px-1 text-[13px] text-muted-foreground">
              Tryck på en resa för att se detaljer eller dölja den.
            </p>

            <div className="mt-6">{wallet}</div>

            <DismissedSection delays={dismissed} onRestore={() => refetchDelays()} />
          </div>

          {/* The one main action, in the thumb zone, above the tab bar. */}
          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 bg-gradient-to-t from-background from-70% to-transparent app-padding pt-6 pb-3">
            <Link
              to={count === 1 ? `/app/claim/${encodeURIComponent(toClaim[0].delayId)}` : "/app/claim-all"}
              className="flex h-14 items-center justify-center rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.99]"
            >
              {count === 1
                ? `Kräv ${formatKr(totalToClaim)}`
                : `Kräv alla ${countWord(count)}, ${formatKr(totalToClaim)}`}
            </Link>
            <p className="mt-2 text-center text-[13px] text-muted-foreground">
              Vi fyller i allt. Du godkänner en gång.
            </p>
          </div>
        </>
      ) : (
        <div className="app-padding flex flex-1 flex-col pt-2 pb-8">
          <div className="flex flex-col items-start gap-4 pt-6 pb-8">
            <span className="animate-scale-in flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Check className="size-8" strokeWidth={2.75} />
            </span>
            <h1 className="text-[40px] leading-[1.05] font-extrabold tracking-tight">
              Allt krävt.
            </h1>
            <p className="max-w-[20rem] text-[17px] leading-snug text-muted-foreground">
              {pendingClaims.length > 0
                ? "Dina krav ligger hos tågbolaget. Vi säger till när ett nytt tåg blir minst 20 minuter sent."
                : "Inga sena tåg att kräva just nu. Vi bevakar dina avgångar och säger till när ett tåg blir minst 20 minuter sent."}
            </p>
          </div>
          {wallet}
          <DismissedSection delays={dismissed} onRestore={() => refetchDelays()} />
        </div>
      )}
    </div>
  )
}

function DismissedSection({
  delays,
  onRestore,
}: {
  delays: Delay[]
  onRestore: () => void
}) {
  const [open, setOpen] = useState(false)
  if (delays.length === 0) return null

  return (
    <section className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-left text-[15px] text-muted-foreground hover:text-foreground"
      >
        {delays.length === 1 ? "1 dold resa" : `${delays.length} dolda resor`}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 divide-y divide-border overflow-hidden rounded-2xl bg-card">
          {delays.map((delay) => (
            <DismissedDelayRow key={delay.delayId} delay={delay} onRestore={onRestore} />
          ))}
        </div>
      )}
    </section>
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
      toast.success("Resan är tillbaka i listan")
    } catch (err) {
      console.error(err)
      toast.error("Kunde inte återställa resan. Försök igen.")
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] font-medium">
          {delay.scheduledDeparture} till {delay.toStation}
        </span>
        <span className="text-[13px] text-muted-foreground">{formatDay(delay.date)}</span>
      </div>
      <button
        onClick={handleRestore}
        disabled={restoring}
        className="h-10 shrink-0 rounded-lg px-3 text-[13px] font-semibold text-primary transition-colors hover:bg-muted disabled:opacity-50"
      >
        {restoring ? "Återställer…" : "Återställ"}
      </button>
    </div>
  )
}
