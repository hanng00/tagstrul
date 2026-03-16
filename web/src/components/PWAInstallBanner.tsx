import { useState } from "react"
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { X, Download, Share } from "lucide-react"

export function PWAInstallBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall()
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("pwa-banner-dismissed") === "true"
  })

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem("pwa-banner-dismissed", "true")
  }

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      handleDismiss()
    }
  }

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null

  // iOS needs special instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 p-4 safe-area-pb">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-zinc-500 hover:text-zinc-300"
          aria-label="Stäng"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <div className="shrink-0 w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
            <img src="/favicon.svg" alt="" className="w-6 h-6" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">Installera Tågstrul</p>
            <p className="text-zinc-400 text-xs mt-0.5">
              Tryck på <Share className="w-3.5 h-3.5 inline -mt-0.5" /> och sedan{" "}
              <span className="text-white">"Lägg till på hemskärmen"</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Android/Desktop - show install button
  if (!canInstall) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 p-4 safe-area-pb">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-zinc-500 hover:text-zinc-300"
        aria-label="Stäng"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3 pr-8">
        <div className="shrink-0 w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
          <img src="/favicon.svg" alt="" className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">Installera Tågstrul</p>
          <p className="text-zinc-400 text-xs mt-0.5">Snabbare åtkomst från hemskärmen</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 flex items-center gap-1.5 bg-white text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          <Download className="w-4 h-4" />
          Installera
        </button>
      </div>
    </div>
  )
}
