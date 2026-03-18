import { useMutation } from "@tanstack/react-query"
import { request, ApiError } from "@/lib/api-client"

export interface SubmitContactRequest {
  claimToken: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface SubmitContactResponse {
  claimToken: string
  step: "bank"
  bank: {
    personalNumber: string
    swishPhone: string
  }
}

async function submitContact(data: SubmitContactRequest): Promise<SubmitContactResponse> {
  return request<SubmitContactResponse>("/claims/contact", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export function useSubmitContact() {
  return useMutation<SubmitContactResponse, ApiError, SubmitContactRequest>({
    mutationFn: submitContact,
    retry: (failureCount, error) => failureCount < 2 && error.retryable,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
  })
}
