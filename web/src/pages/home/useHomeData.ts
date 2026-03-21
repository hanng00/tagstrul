import { useDelays, useClaims, useRoutes } from "@/lib/queries"
import { HomeState } from "./types"
import { useDateNavigation } from "./useDateNavigation"
import { useDelayFilters } from "./useDelayFilters"
import { useClaimsSummary } from "./useClaimsSummary"

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
  const refreshing = delaysFetching || claimsFetching

  const state: HomeState = loading
    ? HomeState.LOADING
    : routes.length === 0
      ? HomeState.NO_ROUTES
      : HomeState.ACTIVE

  const handleRefresh = () => {
    refetchDelays()
    refetchClaims()
  }

  const dateNav = useDateNavigation(delays)
  const delayFilters = useDelayFilters(delays, dateNav.activeDate)
  const claimsSummary = useClaimsSummary(claims)

  return {
    state,
    refreshing,
    handleRefresh,
    refetchDelays,
    refetchClaims,
    ...dateNav,
    ...delayFilters,
    ...claimsSummary,
  }
}

export { HomeState } from "./types"
