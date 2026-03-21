import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Profile } from "@/types"
import { queryKeys } from "./query-keys"

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: api.getProfile,
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
