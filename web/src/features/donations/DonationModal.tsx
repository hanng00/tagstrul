import { useState, useCallback } from "react"
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js"
import { Coffee, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { stripePromise } from "./stripe"

const API_BASE = import.meta.env.VITE_API_URL || ""

const FIKA_OPTIONS = [
  { amount: 49, label: "En fika", emoji: "☕" },
  { amount: 89, label: "En stor fika", emoji: "☕🥐" },
  { amount: 129, label: "En lyxfika", emoji: "☕🥐🍰" },
] as const

interface DonationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DonationModal({ open, onOpenChange }: DonationModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [showCheckout, setShowCheckout] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = (amount: number) => {
    if (!stripePromise) {
      setError("Betalning är inte konfigurerad ännu.")
      return
    }
    if (amount < 10) {
      setError("Minsta belopp är 10 kr.")
      return
    }
    if (amount > 10000) {
      setError("Maxbelopp är 10 000 kr.")
      return
    }
    setError(null)
    setSelectedAmount(amount)
    setShowCheckout(true)
  }

  const handleCustomSubmit = () => {
    const amount = parseInt(customAmount, 10)
    if (isNaN(amount) || amount < 1) {
      setError("Ange ett giltigt belopp.")
      return
    }
    handleSelect(amount)
  }

  const handleBack = () => {
    setShowCheckout(false)
    setSelectedAmount(null)
    setError(null)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setShowCheckout(false)
      setSelectedAmount(null)
      setCustomAmount("")
      setError(null)
    }
    onOpenChange(isOpen)
  }

  const fetchClientSecret = useCallback(async () => {
    if (!selectedAmount) throw new Error("No amount selected")

    const response = await fetch(`${API_BASE}/public/donations/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: selectedAmount }),
    })

    if (!response.ok) {
      throw new Error("Failed to create checkout session")
    }

    const { clientSecret } = await response.json()
    return clientSecret
  }, [selectedAmount])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "transition-all duration-200",
          showCheckout ? "sm:max-w-lg" : "sm:max-w-sm"
        )}
        showCloseButton={!showCheckout}
      >
        {!showCheckout ? (
          <>
            <DialogHeader className="text-center sm:text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Coffee className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="mt-2 text-lg">
                Bjud på en fika
              </DialogTitle>
              <DialogDescription>
                Tågstrul är gratis att använda. Om du vill stötta
                utvecklingen kan du bjuda på en fika!
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              {FIKA_OPTIONS.map((option) => (
                <button
                  key={option.amount}
                  onClick={() => handleSelect(option.amount)}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{option.emoji}</span>
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {option.amount} kr
                  </span>
                </button>
              ))}

              <div className="mt-2 flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    placeholder="Annat belopp"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 pr-10 text-sm outline-none transition-colors focus:border-foreground"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    kr
                  </span>
                </div>
                <Button
                  onClick={handleCustomSubmit}
                  disabled={!customAmount}
                  className="h-11 px-4"
                >
                  Donera
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleBack}
                className="-ml-2"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {FIKA_OPTIONS.find((o) => o.amount === selectedAmount)?.emoji ??
                  "☕"}{" "}
                {selectedAmount} kr
              </span>
            </div>

            <div className="min-h-[400px]">
              {stripePromise && (
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={{ fetchClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
