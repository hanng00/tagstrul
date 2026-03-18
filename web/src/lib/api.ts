import type { Delay, Route, Claim, Profile, MovingoCard } from "@/types"
import { request, publicRequest } from "@/lib/api-client"

export { ApiError } from "@/lib/api-client"

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

  async undismissDelay(delayId: string): Promise<void> {
    await request(`/delays/${delayId}/undismiss`, {
      method: "POST",
    })
  },

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
