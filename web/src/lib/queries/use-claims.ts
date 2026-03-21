import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Delay } from "@/types"
import { queryKeys } from "./query-keys"

export function useClaims() {
  return useQuery({
    queryKey: queryKeys.claims,
    queryFn: api.getClaims,
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
