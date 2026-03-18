import { useMutation, useQueryClient } from "@tanstack/react-query"
import { request, ApiError } from "@/lib/api-client"
import { queryKeys } from "@/lib/queries"

export interface ConfirmClaimRequest {
  claimToken: string
  barId: string
  delayId: string
}

export interface ConfirmClaimResponse {
  claimId: string
  confirmationId: string
  status: "submitted"
  submittedAt: string
}

async function confirmClaim(data: ConfirmClaimRequest): Promise<ConfirmClaimResponse> {
  return request<ConfirmClaimResponse>("/claims/confirm", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function useConfirmClaim() {
  const queryClient = useQueryClient()
  
  return useMutation<ConfirmClaimResponse, ApiError, ConfirmClaimRequest>({
    mutationFn: confirmClaim,
    retry: (failureCount, error) => failureCount < 2 && error.retryable,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.delays })
      queryClient.invalidateQueries({ queryKey: queryKeys.claims })
    },
  })
}
