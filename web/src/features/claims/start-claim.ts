import { useMutation } from "@tanstack/react-query"
import { request, ApiError } from "@/lib/api-client"

export interface StartClaimResponse {
  claimToken: string
  step: "contact"
  delay: {
    delayId: string
    fromStation: string
    toStation: string
    date: string
    scheduledDeparture: string
    delayMinutes: number
    cancelled: boolean
    estimatedCompensation: number
  }
  contact: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

async function startClaim(delayId: string): Promise<StartClaimResponse> {
  return request<StartClaimResponse>("/claims/start", {
    method: "POST",
    body: JSON.stringify({ delayId }),
  })
}

export function useStartClaim() {
  return useMutation<StartClaimResponse, ApiError, string>({
    mutationFn: startClaim,
    retry: (failureCount, error) => failureCount < 2 && error.retryable,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
  })
}
