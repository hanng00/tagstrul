import { useState, useEffect, useCallback, useSyncExternalStore } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function getIsIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

const subscribeToDisplayMode = (callback: () => void) => {
  const mq = window.matchMedia("(display-mode: standalone)")
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const isStandalone = useSyncExternalStore(subscribeToDisplayMode, getIsStandalone, () => false)
  const isIOS = getIsIOS()
  const [wasInstalled, setWasInstalled] = useState(false)

  const isInstalled = isStandalone || wasInstalled

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }

    const installedHandler = () => {
      setWasInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", installedHandler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === "accepted") {
      setInstallPrompt(null)
      return true
    }
    return false
  }, [installPrompt])

  return {
    canInstall: !!installPrompt,
    isInstalled,
    isIOS,
    promptInstall,
  }
}
