import { useMemo } from "react"
import type { Delay, MovingoCard } from "@/types"
import { hasDeparturePassed } from "@/lib/date-utils"

function deadlineTime(d: Delay) {
  return d.claimDeadline ? new Date(d.claimDeadline).getTime() : Number.POSITIVE_INFINITY
}

/**
 * Everything the user can claim right now, across all days,
 * with the closest deadline first.
 */
export function useInbox(delays: Delay[]) {
  const toClaim = useMemo(
    () =>
      delays
        .filter(
          (d) =>
            !d.dismissed &&
            d.claimable &&
            !d.claimed &&
            hasDeparturePassed(d.date, d.scheduledDeparture)
        )
        .sort(
          (a, b) =>
            deadlineTime(a) - deadlineTime(b) ||
            b.date.localeCompare(a.date) ||
            (b.scheduledDeparture ?? "").localeCompare(a.scheduledDeparture ?? "")
        ),
    [delays]
  )

  const dismissed = useMemo(
    () =>
      delays
        .filter((d) => d.dismissed && !d.claimed)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [delays]
  )

  const totalToClaim = useMemo(
    () => toClaim.reduce((s, d) => s + d.estimatedCompensation, 0),
    [toClaim]
  )

  return { toClaim, dismissed, totalToClaim }
}

/** The Movingo card the user is travelling on today, if any. */
export function activeCardOf(cards: MovingoCard[], now = Date.now()) {
  return (
    cards
      .filter((c) => new Date(c.expiryDate).getTime() >= now)
      .sort((a, b) => b.expiryDate.localeCompare(a.expiryDate))[0] ?? null
  )
}

export function useActiveCard(cards: MovingoCard[]) {
  return useMemo(() => activeCardOf(cards), [cards])
}
