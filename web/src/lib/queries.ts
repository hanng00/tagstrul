import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import type { Delay, Route, Profile, MovingoCard } from "@/types"

export const queryKeys = {
  delays: ["delays"] as const,
  claims: ["claims"] as const,
  routes: ["routes"] as const,
  profile: ["profile"] as const,
  movingoCards: ["movingoCards"] as const,
}

export function useDelays() {
  return useQuery({
    queryKey: queryKeys.delays,
    queryFn: api.getDelays,
  })
}

export function useDelay(delayId: string | undefined) {
  const { data: delays = [], isLoading } = useDelays()
  const delay = delayId ? delays.find((d) => d.delayId === delayId) : undefined
  return { delay, isLoading }
}

export function useClaims() {
  return useQuery({
    queryKey: queryKeys.claims,
    queryFn: api.getClaims,
  })
}

export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes,
    queryFn: api.getRoutes,
  })
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: api.getProfile,
  })
}

export function useMovingoCards() {
  return useQuery({
    queryKey: queryKeys.movingoCards,
    queryFn: api.getMovingoCards,
  })
}

export function useSubmitClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (delay: Delay) => api.submitClaim(delay),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.claims })
      queryClient.invalidateQueries({ queryKey: queryKeys.delays })
    },
  })
}

export function useAddRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (route: Omit<Route, "routeId">) => api.addRoute(route),
    onSuccess: (newRoute) => {
      queryClient.setQueryData<Route[]>(queryKeys.routes, (old) =>
        old ? [...old, newRoute] : [newRoute],
      )
    },
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (routeId: string) => api.deleteRoute(routeId),
    onSuccess: (_, routeId) => {
      queryClient.setQueryData<Route[]>(queryKeys.routes, (old) =>
        old?.filter((r) => r.routeId !== routeId),
      )
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Profile>) => api.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.profile, updated)
    },
  })
}

export function useAddMovingoCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (card: Omit<MovingoCard, "cardId">) => api.addMovingoCard(card),
    onSuccess: (newCard) => {
      queryClient.setQueryData<MovingoCard[]>(queryKeys.movingoCards, (old) =>
        old ? [...old, newCard] : [newCard],
      )
    },
  })
}

export function useDeleteMovingoCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => api.deleteMovingoCard(cardId),
    onSuccess: (_, cardId) => {
      queryClient.setQueryData<MovingoCard[]>(queryKeys.movingoCards, (old) =>
        old?.filter((c) => c.cardId !== cardId),
      )
    },
  })
}
