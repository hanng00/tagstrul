import { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, ChevronRight, X, Info } from "lucide-react"
import { api } from "@/lib/api"
import type { Delay } from "@/types"

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

function DeadlineNote({
  days,
  urgent,
}: {
  days: number | null
  urgent: boolean
}) {
  if (urgent && days !== null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-late">
        <AlertTriangle className="size-3.5" />
        {days === 1 ? "1 dag kvar att kräva" : `${days} dagar kvar att kräva`}
      </span>
    )
  }
  return (
    <span className="text-xs text-muted-foreground">
      {days !== null ? `${days} dagar kvar att kräva` : "Kräv inom 30 dagar"}
    </span>
  )
}

function addMinutes(hhmm: string, minutes: number) {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm)
  if (!m) return null
  const total = (Number(m[1]) * 60 + Number(m[2]) + minutes) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

function formatDay(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })
}

export function ClaimableCard({
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

  async function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation()
    setDismissing(true)
    try {
      await api.dismissDelay(delay.delayId)
      onDismiss()
      toast(`${delay.fromStation} → ${delay.toStation} dold`, {
        action: {
          label: "Ångra",
          onClick: async () => {
            try {
              await api.undismissDelay(delay.delayId)
              onDismiss()
            } catch (err) {
              console.error(err)
              toast.error("Kunde inte ångra")
            }
          },
        },
        duration: 5000,
      })
    } catch (err) {
      console.error(err)
      toast.error("Kunde inte dölja resan")
    } finally {
      setDismissing(false)
    }
  }

  const newTime = delay.cancelled
    ? null
    : addMinutes(delay.scheduledDeparture, delay.delayMinutes)

  return (
    <div
      style={style}
      className="animate-fade-up overflow-hidden rounded-lg border border-border bg-card text-left"
    >
      {/* Departure-board row: time | destination | amount */}
      <button
        onClick={onClick}
        className="grid w-full grid-cols-[4.25rem_1fr_auto] items-start gap-3 p-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <div className="font-sign leading-none">
          <span
            className={
              delay.cancelled
                ? "text-2xl font-bold text-muted-foreground line-through decoration-late decoration-2"
                : "text-2xl font-bold text-foreground"
            }
          >
            {delay.scheduledDeparture}
          </span>
          <span className="mt-1.5 block text-lg font-bold text-late">
            {delay.cancelled ? "Inställt" : newTime ?? `+${delay.delayMinutes}`}
          </span>
        </div>

        <div className="min-w-0">
          <p className="font-sign truncate text-2xl leading-none font-bold text-foreground">
            {delay.toStation}
          </p>
          <p className="mt-1.5 truncate text-sm text-muted-foreground">
            från {delay.fromStation}, {formatDay(delay.date)}
          </p>
          <p className="mt-1 text-sm font-medium text-late">
            {delay.cancelled ? "Tåget ställdes in" : `${delay.delayMinutes} min sent`}
          </p>
        </div>

        <span className="font-sign rounded-sm bg-signal px-2 py-1 text-xl leading-none font-bold whitespace-nowrap text-signal-foreground">
          {delay.estimatedCompensation} kr
        </span>
      </button>

      {delay.likelyScheduledChange && (
        <div className="mx-4 mb-3 flex items-start gap-1.5 rounded-sm bg-warn-surface px-2.5 py-2 text-xs text-foreground">
          <Info className="mt-px size-3.5 shrink-0" />
          Ändringen annonserades i förväg, så SJ kan neka kravet.
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
        <DeadlineNote days={deadlineDays} urgent={urgent} />
        <div className="flex items-center gap-1">
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-3.5" />
            {dismissing ? "Döljer…" : "Dölj"}
          </button>
          <button
            onClick={onClick}
            className="flex items-center gap-0.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kräv ersättning
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
