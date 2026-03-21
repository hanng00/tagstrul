import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Route } from "@/types"
import { queryKeys } from "./query-keys"

export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes,
    queryFn: api.getRoutes,
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
