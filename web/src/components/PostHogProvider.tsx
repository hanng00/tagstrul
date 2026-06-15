import { useEffect } from "react"
import { useLocation } from "react-router"
import { initPostHog, trackPageView } from "@/lib/posthog"
import { trackGaPageView } from "@/lib/ga"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  return children
}

export function PostHogPageTracker() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname + location.search
    trackPageView(window.location.origin + path)
    trackGaPageView(path)
  }, [location.pathname, location.search])

  return null
}
