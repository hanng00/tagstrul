const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || "G-9LLE8S8X4K"

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["consent", "default" | "update", Record<string, string>]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
  }
}

function gtag(...args: GtagArgs) {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag(...args)
}

/** Grant or revoke analytics storage based on cookie consent. */
export function setGaConsent(granted: boolean) {
  gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  })
}

/** Track a SPA page view (gtag config is set with send_page_view: false). */
export function trackGaPageView(path?: string) {
  gtag("event", "page_view", {
    page_path: path ?? window.location.pathname + window.location.search,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export { GA_MEASUREMENT_ID }
