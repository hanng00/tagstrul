import { useMutation } from "@tanstack/react-query"
import { request, ApiError } from "@/lib/api-client"

export interface SubmitBankRequest {
  claimToken: string
  personalNumber: string
  swishPhone: string
}

export interface SubmitBankResponse {
  claimToken: string
  barId: string
  step: "confirm"
}

async function submitBank(data: SubmitBankRequest): Promise<SubmitBankResponse> {
  return request<SubmitBankResponse>("/claims/bank", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function useSubmitBank() {
  return useMutation<SubmitBankResponse, ApiError, SubmitBankRequest>({
    mutationFn: submitBank,
    retry: (failureCount, error) => failureCount < 2 && error.retryable,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
  })
}
