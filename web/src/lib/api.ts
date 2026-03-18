import type { Delay, Route, Claim, Profile, MovingoCard } from "@/types"
import { getIdToken } from "@/lib/auth"

const API_BASE = import.meta.env.VITE_API_URL || ""

export interface StructuredError {
  code: string
  message: string
  field?: string
  retryable: boolean
}

export class ApiError extends Error {
  public readonly code: string
  public readonly field?: string
  public readonly retryable: boolean
  public readonly statusCode: number

  constructor(
    message: string,
    code: string,
    retryable: boolean,
    statusCode: number,
    field?: string
  ) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.retryable = retryable
    this.statusCode = statusCode
    this.field = field
  }
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const body = await response.json()
    if (body.error && typeof body.error === "object") {
      const err = body.error as StructuredError
      return new ApiError(
        err.message || `API error: ${response.status}`,
        err.code || "UNKNOWN",
        err.retryable ?? false,
        response.status,
        err.field
      )
    }
    if (body.error && typeof body.error === "string") {
      return new ApiError(body.error, "UNKNOWN", false, response.status)
    }
  } catch {
    // Failed to parse JSON
  }
  return new ApiError(`API error: ${response.status}`, "UNKNOWN", false, response.status)
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getIdToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = token
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  return response.json()
}

async function publicRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  return response.json()
}

export interface EstimateResult {
  fromStation: string
  toStation: string
  days: number
  totalDelays: number
  claimableDelays: number
  estimatedCompensation: number
}

export const api = {
  async estimateCompensation(
    fromStation: string,
    toStation: string,
  ): Promise<EstimateResult> {
    return publicRequest<EstimateResult>("/public/estimate", {
      method: "POST",
      body: JSON.stringify({ fromStation, toStation }),
    })
  },

  async submitFeedback(data: {
    message: string
    email?: string
    source?: string
  }): Promise<{ success: boolean; feedbackId: string }> {
    return publicRequest("/public/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async getDelays(): Promise<Delay[]> {
    return request<Delay[]>("/delays")
  },

  async getRoutes(): Promise<Route[]> {
    return request<Route[]>("/routes")
  },

  async addRoute(route: Omit<Route, "routeId">): Promise<Route> {
    return request<Route>("/routes", {
      method: "POST",
      body: JSON.stringify(route),
    })
  },

  async deleteRoute(routeId: string): Promise<void> {
    await request(`/routes/${routeId}`, { method: "DELETE" })
  },

  async getClaims(): Promise<Claim[]> {
    return request<Claim[]>("/claims")
  },

  async submitClaim(delay: Delay): Promise<Claim> {
    return request<Claim>("/claims", {
      method: "POST",
      body: JSON.stringify({
        delayId: delay.delayId,
        fromStation: delay.fromStation,
        toStation: delay.toStation,
        date: delay.date,
        scheduledDeparture: delay.scheduledDeparture,
        delayMinutes: delay.delayMinutes,
        estimatedCompensation: delay.estimatedCompensation,
      }),
    })
  },

  async getProfile(): Promise<Profile | null> {
    try {
      return await request<Profile>("/profile")
    } catch {
      return null
    }
  },

  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    return request<Profile>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async getMovingoCards(): Promise<MovingoCard[]> {
    return request<MovingoCard[]>("/movingo-cards")
  },

  async addMovingoCard(
    card: Omit<MovingoCard, "cardId">,
  ): Promise<MovingoCard> {
    return request<MovingoCard>("/movingo-cards", {
      method: "POST",
      body: JSON.stringify(card),
    })
  },

  async deleteMovingoCard(cardId: string): Promise<void> {
    await request(`/movingo-cards/${cardId}`, { method: "DELETE" })
  },

  // Claim wizard API
  async startClaim(delayId: string): Promise<StartClaimResponse> {
    return request<StartClaimResponse>("/claims/start", {
      method: "POST",
      body: JSON.stringify({ delayId }),
    })
  },

  async submitClaimContact(data: SubmitContactRequest): Promise<SubmitContactResponse> {
    return request<SubmitContactResponse>("/claims/contact", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async submitClaimBank(data: SubmitBankRequest): Promise<SubmitBankResponse> {
    return request<SubmitBankResponse>("/claims/bank", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async confirmClaim(data: ConfirmClaimRequest): Promise<ConfirmClaimResponse> {
    return request<ConfirmClaimResponse>("/claims/confirm", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async updateClaimStatus(
    claimId: string,
    status: "approved" | "rejected",
    actualCompensation?: number,
  ): Promise<void> {
    await request(`/claims/${claimId}/status`, {
      method: "PUT",
      body: JSON.stringify({ claimId, status, actualCompensation }),
    })
  },

  async dismissDelay(delayId: string): Promise<void> {
    await request(`/delays/${delayId}/dismiss`, {
      method: "POST",
    })
  },

  // Push notifications
  async getVapidKey(): Promise<{ publicKey: string }> {
    return request<{ publicKey: string }>("/push/vapid-key")
  },

  async subscribePush(subscription: PushSubscriptionJSON): Promise<void> {
    await request("/push/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
    })
  },

  async unsubscribePush(endpoint: string): Promise<void> {
    await request("/push/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ endpoint }),
    })
  },
}

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
