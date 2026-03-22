import { useState, useSyncExternalStore } from "react"
import { Link } from "react-router"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

const COOKIE_CONSENT_KEY = "cookie-consent"

type ConsentStatus = "pending" | "accepted" | "rejected"

function getStoredConsent(): ConsentStatus {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (stored === "accepted" || stored === "rejected") {
      return stored
    }
  } catch {
    // localStorage not available
  }
  return "pending"
}

function setStoredConsent(status: "accepted" | "rejected") {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, status)
  } catch {
    // localStorage not available
  }
}

const subscribeToStorage = (callback: () => void) => {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

const getServerSnapshot = (): ConsentStatus => "accepted"

export function CookieConsentBanner() {
  const storedStatus = useSyncExternalStore(subscribeToStorage, getStoredConsent, getServerSnapshot)
  const [status, setStatus] = useState<ConsentStatus>(storedStatus)

  function handleAccept() {
    setStoredConsent("accepted")
    setStatus("accepted")
  }

  function handleReject() {
    setStoredConsent("rejected")
    setStatus("rejected")
  }

  // Don't render if consent already given
  if (status !== "pending" && storedStatus !== "pending") {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-lg animate-fade-up rounded-xl border border-border bg-card p-4 shadow-lg sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Vi använder cookies
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Vi använder cookies för att förbättra din upplevelse och analysera
              hur tjänsten används.{" "}
              <Link
                to="/cookies"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Läs mer
              </Link>
            </p>
          </div>
          <button
            onClick={handleReject}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Stäng"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleReject}
            className="flex-1"
          >
            Endast nödvändiga
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1"
          >
            Acceptera alla
          </Button>
        </div>
      </div>
    </div>
  )
}

