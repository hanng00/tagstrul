import { useMemo, useState } from "react"
import { useDelays, useClaims, useRoutes } from "@/lib/queries"
import { toDateKey, hasDeparturePassed } from "@/lib/date-utils"

export function useHomeData() {
  const {
    data: delays = [],
    isLoading: delaysLoading,
    isFetching: delaysFetching,
    refetch: refetchDelays,
  } = useDelays()
  const {
    data: claims = [],
    isLoading: claimsLoading,
    isFetching: claimsFetching,
    refetch: refetchClaims,
  } = useClaims()
  const { data: routes = [], isLoading: routesLoading } = useRoutes()

  const loading = delaysLoading || claimsLoading || routesLoading
  const hasRoutes = routes.length > 0
  const refreshing = delaysFetching || claimsFetching

  const handleRefresh = () => {
    refetchDelays()
    refetchClaims()
  }

  // Get unique dates from delays, sorted descending (most recent first)
  const availableDates = useMemo(() => {
    const dateSet = new Set(
      delays.filter((d) => d.date).map((d) => toDateKey(d.date))
    )
    return Array.from(dateSet).filter(Boolean).sort((a, b) => b.localeCompare(a))
  }, [delays])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Default to most recent date if not selected
  const activeDate = selectedDate ?? availableDates[0] ?? null

  const currentDateIndex = activeDate
    ? availableDates.indexOf(activeDate)
    : -1

  const canGoNewer = currentDateIndex > 0
  const canGoOlder = currentDateIndex < availableDates.length - 1

  const goNewer = () => {
    if (canGoNewer) {
      setSelectedDate(availableDates[currentDateIndex - 1])
    }
  }

  const goOlder = () => {
    if (canGoOlder) {
      setSelectedDate(availableDates[currentDateIndex + 1])
    }
  }

  // Filter delays by selected date (exclude dismissed), sorted by departure time
  const delaysForDate = useMemo(() => {
    const filtered = delays.filter((d) => !d.dismissed)
    const forDate = activeDate
      ? filtered.filter((d) => toDateKey(d.date) === activeDate)
      : filtered
    return forDate.sort((a, b) =>
      (a.scheduledDeparture ?? "").localeCompare(b.scheduledDeparture ?? "")
    )
  }, [delays, activeDate])

  // Only show claimable delays where the departure has already passed
  const claimable = delaysForDate.filter(
    (d) => d.claimable && !d.claimed && hasDeparturePassed(d.date, d.scheduledDeparture)
  )
  const notClaimable = delaysForDate.filter((d) => !d.claimable && !d.claimed)

  // All-time claimable - exclude dismissed and future departures
  const allClaimable = useMemo(() => {
    return delays
      .filter((d) => 
        d.claimable && 
        !d.claimed && 
        !d.dismissed && 
        hasDeparturePassed(d.date, d.scheduledDeparture)
      )
      .sort((a, b) => {
        const dateCompare = (b.date ?? "").localeCompare(a.date ?? "")
        if (dateCompare !== 0) return dateCompare
        return (a.scheduledDeparture ?? "").localeCompare(b.scheduledDeparture ?? "")
      })
  }, [delays])

  const allTotalClaimable = allClaimable.reduce(
    (s, d) => s + d.estimatedCompensation,
    0,
  )

  // Dismissed delays for the selected date
  const dismissedDelaysForDate = useMemo(() => {
    const dismissed = delays.filter((d) => d.dismissed)
    if (!activeDate) return dismissed
    return dismissed.filter((d) => toDateKey(d.date) === activeDate)
  }, [delays, activeDate])

  // Claims summary
  const pendingClaims = claims.filter((c) => c.status === "submitted")
  const approvedClaims = claims.filter((c) => c.status === "approved")
  const totalPending = pendingClaims.reduce(
    (s, c) => s + c.estimatedCompensation,
    0,
  )
  const totalReceived = approvedClaims.reduce(
    (s, c) => s + (c.actualCompensation ?? c.estimatedCompensation),
    0,
  )

  return {
    // Loading states
    loading,
    refreshing,
    handleRefresh,
    refetchDelays,
    refetchClaims,

    // Routes
    hasRoutes,

    // Date navigation
    availableDates,
    activeDate,
    canGoNewer,
    canGoOlder,
    goNewer,
    goOlder,

    // Delays
    delays,
    claimable,
    notClaimable,
    allClaimable,
    allTotalClaimable,
    dismissedDelaysForDate,

    // Claims
    pendingClaims,
    totalPending,
    totalReceived,
  }
}
