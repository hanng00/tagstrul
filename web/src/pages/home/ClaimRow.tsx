import { Link } from "react-router"
import type { Delay } from "@/types"
import { cn } from "@/lib/utils"
import { delaySummary, formatKr } from "./format"

/** One trip owed to the user, as a row in the inbox list. */
export function ClaimRow({ delay }: { delay: Delay }) {
  const summary = delaySummary(delay)

  return (
    <Link
      to={`/app/claim/${encodeURIComponent(delay.delayId)}`}
      className="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
    >
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
        <span
          className={cn(
            "truncate text-[13px]",
            summary.urgent ? "font-semibold text-destructive" : "text-muted-foreground"
          )}
        >
          {summary.text}
        </span>
      </span>
      <span className="text-base font-bold tabular-nums">
        {formatKr(delay.estimatedCompensation)}
      </span>
    </Link>
  )
}
