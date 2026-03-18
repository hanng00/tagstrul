import posthog from "posthog-js"

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com"

export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.warn("PostHog key not configured")
    return
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    persistence: "localStorage+cookie",
  })
}

export function identifyUser(userId: string, properties?: { email?: string }) {
  if (!POSTHOG_KEY) return
  posthog.identify(userId, properties)
}

export function resetUser() {
  if (!POSTHOG_KEY) return
  posthog.reset()
}

export function trackPageView(path?: string) {
  if (!POSTHOG_KEY) return
  posthog.capture("$pageview", {
    $current_url: path || window.location.href,
  })
}

function track<T extends Record<string, unknown>>(
  event: string,
  properties?: T,
) {
  if (!POSTHOG_KEY) return
  posthog.capture(event, properties)
}

export const events = {
  claimStarted: (props: {
    delayId: string
    delayMinutes?: number
    cancelled?: boolean
    estimatedCompensation?: number
  }) => track("claim_started", props),

  claimSubmitted: (props: {
    delayId: string
    confirmationId: string
    delayMinutes?: number
    cancelled?: boolean
    estimatedCompensation?: number
  }) => track("claim_submitted", props),

  claimError: (props: { delayId: string; step: "start" | "confirm" }) =>
    track("claim_error", props),

  routeAdded: (props: {
    fromStation: string
    toStation: string
    hasDepartureTime: boolean
  }) => track("route_added", props),

  routeDeleted: (props: { routeId: string }) => track("route_deleted", props),

  onboardingCompleted: () => track("onboarding_completed"),
}

export { posthog }
