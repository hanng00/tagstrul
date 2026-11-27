import { useDelays, useClaims, useRoutes, useMovingoCards } from "@/lib/queries"
import { HomeState } from "./types"
import { useInbox, useActiveCard } from "./useInbox"
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
  const { data: cards = [] } = useMovingoCards()

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

  return {
    state,
    refreshing,
    handleRefresh,
    refetchDelays,
    refetchClaims,
    activeCard: useActiveCard(cards),
    ...useInbox(delays),
    ...useClaimsSummary(claims),
  }
}

export { HomeState } from "./types"
