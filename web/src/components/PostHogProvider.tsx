import { useEffect } from "react"
import { useLocation } from "react-router"
import { initPostHog, trackPageView } from "@/lib/posthog"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  return children
}

export function PostHogPageTracker() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(window.location.origin + location.pathname + location.search)
  }, [location.pathname, location.search])

  return null
}
