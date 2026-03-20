import { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, ChevronRight, X, Info } from "lucide-react"
import { api } from "@/lib/api"
import type { Delay } from "@/types"

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

function DeadlineBadge({
  days,
  urgent,
}: {
  days: number | null
  urgent: boolean
}) {
  if (urgent && days !== null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
        <AlertTriangle className="size-3" />
        {days} dagar kvar
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      <AlertTriangle className="size-3" />
      Kräv inom 30 dagar
    </span>
  )
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

  return (
    <div
      style={style}
      className="animate-fade-up rounded-xl border border-border bg-card text-left transition-all"
    >
      <div className="p-4">
        {/* Top row: Date + Deadline */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{delay.date}</span>
          <DeadlineBadge days={deadlineDays} urgent={urgent} />
        </div>

        {/* Route */}
        <p className="mt-1 text-sm font-medium text-foreground">
          <span className="tabular-nums">{delay.scheduledDeparture}</span>
          <span className="mx-1 text-muted-foreground">→</span>
          <span>{delay.toStation}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Från {delay.fromStation}
        </p>

        {/* Delay info box */}
        <div className="mt-3 rounded-lg bg-destructive/5 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-destructive">
                {delay.cancelled
                  ? "Tåget ställdes in"
                  : `${delay.delayMinutes} min försening`}
              </p>
              {!delay.cancelled && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Skulle avgått {delay.scheduledDeparture}
                </p>
              )}
            </div>
            <p className="shrink-0 text-lg font-semibold text-foreground tabular-nums">
              {delay.estimatedCompensation}
              <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                kr
              </span>
            </p>
          </div>
          {delay.likelyScheduledChange && (
            <div className="mt-2 flex items-center gap-1.5 border-t border-destructive/10 pt-2">
              <Info className="size-3 shrink-0 text-amber-600" />
              <span className="text-xs text-amber-700 dark:text-amber-400">
                Planerad ändring — SJ kan neka
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-3.5" />
            {dismissing ? "..." : "Dölj"}
          </button>
          <button
            onClick={onClick}
            className="flex items-center gap-0.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Kräv ersättning
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
