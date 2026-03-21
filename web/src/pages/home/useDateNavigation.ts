import { useState, useMemo } from "react"
import type { Delay } from "@/types"
import { toDateKey } from "@/lib/date-utils"

export function useDateNavigation(delays: Delay[]) {
  const availableDates = useMemo(() => {
    const dateSet = new Set(
      delays.filter((d) => d.date).map((d) => toDateKey(d.date))
    )
    return Array.from(dateSet).filter(Boolean).sort((a, b) => b.localeCompare(a))
  }, [delays])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const activeDate = selectedDate ?? availableDates[0] ?? null

  const currentDateIndex = activeDate ? availableDates.indexOf(activeDate) : -1
  const canGoNewer = currentDateIndex > 0
  const canGoOlder = currentDateIndex < availableDates.length - 1

  const goNewer = () => {
    if (canGoNewer) setSelectedDate(availableDates[currentDateIndex - 1])
  }

  const goOlder = () => {
    if (canGoOlder) setSelectedDate(availableDates[currentDateIndex + 1])
  }

  return {
    availableDates,
    activeDate,
    canGoNewer,
    canGoOlder,
    goNewer,
    goOlder,
  }
}
