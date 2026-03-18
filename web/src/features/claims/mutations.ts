import { useMutation } from "@tanstack/react-query"
import {
  api,
  ApiError,
  type StartClaimResponse,
  type SubmitContactRequest,
  type SubmitContactResponse,
  type SubmitBankRequest,
  type SubmitBankResponse,
  type ConfirmClaimRequest,
  type ConfirmClaimResponse,
} from "@/lib/api"

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (error instanceof ApiError) {
    return error.retryable
  }
  return false
}

function getRetryDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 10000)
}

export function useStartClaim() {
  return useMutation<StartClaimResponse, ApiError, string>({
    mutationFn: (delayId: string) => api.startClaim(delayId),
    retry: shouldRetry,
    retryDelay: getRetryDelay,
  })
}

export function useSubmitContact() {
  return useMutation<SubmitContactResponse, ApiError, SubmitContactRequest>({
    mutationFn: (data) => api.submitClaimContact(data),
    retry: shouldRetry,
    retryDelay: getRetryDelay,
  })
}

export function useSubmitBank() {
  return useMutation<SubmitBankResponse, ApiError, SubmitBankRequest>({
    mutationFn: (data) => api.submitClaimBank(data),
    retry: shouldRetry,
    retryDelay: getRetryDelay,
  })
}

export function useConfirmClaim() {
  return useMutation<ConfirmClaimResponse, ApiError, ConfirmClaimRequest>({
    mutationFn: (data) => api.confirmClaim(data),
    retry: shouldRetry,
    retryDelay: getRetryDelay,
  })
}
