import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, ArrowLeft, Check, Loader2 } from "lucide-react"
import type { Delay } from "@/types"
import { cn } from "@/lib/utils"
import { useClaims, useDelays, useMovingoCards, useProfile, queryKeys } from "@/lib/queries"
import { claimOneDelay, type BatchClaimOutcome } from "@/features/claims"
import { events } from "@/lib/posthog"
import { formatPhone } from "@/components/ui-extended/phone-utils"
import { TrainLoader } from "@/components/ui/train-loader"
import { useActiveCard, useInbox } from "./home/useInbox"
import { useClaimsSummary } from "./home/useClaimsSummary"
import { WalletCard } from "./home/WalletCard"
import { countWord, delaySummary, formatKr } from "./home/format"

type Status = "waiting" | "sending" | BatchClaimOutcome

function maskPersonnummer(pnr?: string) {
  const digits = (pnr ?? "").replace(/\D/g, "")
  if (digits.length < 8) return "Saknas"
  return `${digits.slice(0, 8)}-••••`
}

/**
 * Claims every open trip in one go. The user reviews the details we send
 * to SJ once, approves, and we file each claim in turn.
 */
export function ClaimAllPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: delays = [], isLoading } = useDelays()
  const { data: profile } = useProfile()
  const { toClaim } = useInbox(delays)
  const { data: claims = [], refetch: refetchClaims } = useClaims()
  const { data: cards = [] } = useMovingoCards()
  const activeCard = useActiveCard(cards)
  const { totalReceived, totalPending, pendingClaims } = useClaimsSummary(claims)

  // Freeze the list once sending starts, so rows don't vanish as claims land.
  const [batch, setBatch] = useState<Delay[] | null>(null)
  const [statuses, setStatuses] = useState<Record<string, Status>>({})
  const [phase, setPhase] = useState<"review" | "sending" | "done">("review")

  const trips = batch ?? toClaim
  const total = trips.reduce((s, d) => s + d.estimatedCompensation, 0)

  async function handleSend() {
    const list = [...toClaim]
    setBatch(list)
    setPhase("sending")
    setStatuses(Object.fromEntries(list.map((d) => [d.delayId, "waiting" as Status])))

    for (const delay of list) {
      setStatuses((s) => ({ ...s, [delay.delayId]: "sending" }))
      events.claimStarted({
        delayId: delay.delayId,
        delayMinutes: delay.delayMinutes,
        cancelled: delay.cancelled,
        estimatedCompensation: delay.estimatedCompensation,
      })
      const outcome = await claimOneDelay(delay.delayId)
      if (outcome.ok) {
        events.claimSubmitted({
          delayId: delay.delayId,
          confirmationId: outcome.result.confirmationId,
          delayMinutes: delay.delayMinutes,
          cancelled: delay.cancelled,
          estimatedCompensation: delay.estimatedCompensation,
        })
      } else {
        events.claimError({ delayId: delay.delayId, step: "confirm" })
      }
      setStatuses((s) => ({ ...s, [delay.delayId]: outcome }))
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.delays }),
      queryClient.invalidateQueries({ queryKey: queryKeys.claims }),
    ])
    setPhase("done")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <TrainLoader size="md" />
      </div>
    )
  }

  if (phase === "review" && toClaim.length === 0) {
    return (
      <div className="app-padding flex flex-1 flex-col items-start gap-4 pt-16">
        <h1 className="text-[28px] font-extrabold tracking-tight">Inget att kräva</h1>
        <p className="text-[17px] text-muted-foreground">Alla dina resor är redan krävda.</p>
        <Link to="/app" className="text-[15px] font-semibold text-primary">
          Till startsidan
        </Link>
      </div>
    )
  }

  const outcomes = trips.map((d) => statuses[d.delayId])
  const sent = outcomes.filter((o) => typeof o === "object" && o.ok).length
  const sentTotal = trips
    .filter((d) => {
      const o = statuses[d.delayId]
      return typeof o === "object" && o.ok
    })
    .reduce((s, d) => s + d.estimatedCompensation, 0)

  return (
    <div className="flex flex-1 flex-col">
      <header className="app-padding flex items-center pt-5">
        {phase === "review" && (
          <button
            onClick={() => navigate("/app")}
            aria-label="Tillbaka"
            className="-ml-2 flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
      </header>

      <div className="app-padding flex flex-1 flex-col pt-3 pb-6">
        {phase === "done" ? (
          <div className="flex flex-col items-start gap-4 pb-6">
            <span
              className={cn(
                "animate-scale-in flex size-16 items-center justify-center rounded-full",
                sent === trips.length
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {sent === trips.length ? (
                <Check className="size-8" strokeWidth={2.75} />
              ) : (
                <AlertCircle className="size-8" />
              )}
            </span>
            <h1 className="text-[40px] leading-[1.05] font-extrabold tracking-tight">
              {sent === trips.length ? "Allt krävt." : `${sent} av ${trips.length} krav skickade`}
            </h1>
            <p className="max-w-[20rem] text-[17px] leading-snug text-muted-foreground">
              {sent === 0
                ? "Inget krav kom fram. Försök igen med en resa i taget nedan."
                : `${sent === 1 ? "Ett krav" : `${countWord(sent).replace(/^./, (c) => c.toUpperCase())} krav`} på ${formatKr(sentTotal)} ligger nu hos SJ. Markera på startsidan när pengarna kommit.`}
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-[34px] leading-[1.1] font-extrabold tracking-tight">
              {phase === "sending" ? "Skickar till SJ…" : `Kräv ${countWord(trips.length)} resor`}
            </h1>
            <p className="mt-2 text-[17px] text-muted-foreground">
              Sammanlagt{" "}
              <span className="font-bold text-primary tabular-nums">{formatKr(total)}</span>
            </p>
          </>
        )}

        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl bg-card">
          {trips.map((delay) => (
            <TripRow key={delay.delayId} delay={delay} status={statuses[delay.delayId]} />
          ))}
        </ul>

        {phase === "review" && (
          <section aria-labelledby="details-heading" className="mt-6 rounded-2xl bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 id="details-heading" className="text-[15px] font-semibold">
                Det här skickar vi till SJ
              </h2>
              <Link to="/app/profile" className="text-[13px] font-semibold text-primary">
                Ändra
              </Link>
            </div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
              <dt className="text-muted-foreground">Namn</dt>
              <dd className="truncate text-right">
                {[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Saknas"}
              </dd>
              <dt className="text-muted-foreground">E-post</dt>
              <dd className="truncate text-right">{profile?.email || "Saknas"}</dd>
              <dt className="text-muted-foreground">Personnummer</dt>
              <dd className="text-right tabular-nums">{maskPersonnummer(profile?.personalNumber)}</dd>
              <dt className="text-muted-foreground">Utbetalning</dt>
              <dd className="text-right tabular-nums">
                {profile?.swishPhone ? `Swish ${formatPhone(profile.swishPhone)}` : "Saknas"}
              </dd>
            </dl>
          </section>
        )}

        <div className="flex-1" />

        {phase === "review" && (
          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 mt-6 bg-gradient-to-t from-background from-70% to-transparent px-4 pt-6 pb-3 sm:-mx-5 sm:px-5">
            <button
              onClick={handleSend}
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.99]"
            >
              Skicka {countWord(trips.length)} krav
            </button>
            <p className="mt-2 text-center text-[13px] leading-snug text-muted-foreground">
              Du bekräftar att uppgifterna stämmer och att du vill ansöka om ersättning från SJ för
              resorna ovan.
            </p>
          </div>
        )}

        {phase === "done" && (
          <div className="mt-6">
            <WalletCard
              totalReceived={totalReceived}
              totalPending={totalPending}
              pendingClaims={pendingClaims}
              activeCard={activeCard}
              onClaimResolved={() => refetchClaims()}
            />
          </div>
        )}

        {phase === "done" && (
          <Link
            to="/app"
            className="mt-6 flex h-14 items-center justify-center rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Till startsidan
          </Link>
        )}
      </div>
    </div>
  )
}

function TripRow({ delay, status }: { delay: Delay; status?: Status }) {
  const summary = delaySummary(delay)
  const failed = typeof status === "object" && !status.ok ? status : null

  return (
    <li className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-4">
      <span
        className={cn(
          "text-base font-bold tabular-nums",
          delay.cancelled && "text-muted-foreground line-through"
        )}
      >
        {delay.scheduledDeparture}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-base font-semibold">{delay.toStation}</span>
        {failed ? (
          <span className="text-[13px] text-destructive">
            {failed.message}.{" "}
            <Link
              to={`/app/claim/${encodeURIComponent(delay.delayId)}`}
              className="font-semibold underline underline-offset-2"
            >
              Kräv den här separat
            </Link>
          </span>
        ) : (
          <span
            className={cn(
              "truncate text-[13px]",
              summary.urgent ? "font-semibold text-destructive" : "text-muted-foreground"
            )}
          >
            {summary.text}
          </span>
        )}
      </span>
      <span className="flex items-center gap-2 text-base font-bold tabular-nums">
        {formatKr(delay.estimatedCompensation)}
        <StatusIcon status={status} />
      </span>
    </li>
  )
}

function StatusIcon({ status }: { status?: Status }) {
  if (!status) return null
  if (status === "waiting")
    return <span className="size-5 rounded-full border-2 border-border" aria-label="Väntar" />
  if (status === "sending")
    return <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Skickar" />
  if (status.ok)
    return (
      <span
        className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
        aria-label="Skickat"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    )
  return <AlertCircle className="size-5 text-destructive" aria-label="Misslyckades" />
}
