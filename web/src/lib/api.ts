import type { Delay, Route, Claim, Profile, MovingoCard } from "@/types"
import { getIdToken } from "@/lib/auth"

const API_BASE = import.meta.env.VITE_API_URL || ""

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
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export const api = {
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
}
