import { useMemo } from "react"
import type { Delay } from "@/types"
import { toDateKey, hasDeparturePassed } from "@/lib/date-utils"

export function useDelayFilters(delays: Delay[], activeDate: string | null) {
  const delaysForDate = useMemo(() => {
    const filtered = delays.filter((d) => !d.dismissed)
    const forDate = activeDate
      ? filtered.filter((d) => toDateKey(d.date) === activeDate)
      : filtered
    return forDate.sort((a, b) =>
      (a.scheduledDeparture ?? "").localeCompare(b.scheduledDeparture ?? "")
    )
  }, [delays, activeDate])

  const claimable = useMemo(
    () =>
      delaysForDate.filter(
        (d) => d.claimable && !d.claimed && hasDeparturePassed(d.date, d.scheduledDeparture)
      ),
    [delaysForDate]
  )

  const notClaimable = useMemo(
    () => delaysForDate.filter((d) => !d.claimable && !d.claimed),
    [delaysForDate]
  )

  const dismissedForDate = useMemo(() => {
    const dismissed = delays.filter((d) => d.dismissed)
    if (!activeDate) return dismissed
    return dismissed.filter((d) => toDateKey(d.date) === activeDate)
  }, [delays, activeDate])

  return { claimable, notClaimable, dismissedForDate }
}
