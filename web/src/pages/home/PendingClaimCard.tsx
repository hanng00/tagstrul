import { useState } from "react"
import { Check, X, Banknote } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Claim } from "@/types"

export function PendingClaimCard({
  claim,
  onResolved,
}: {
  claim: Claim
  onResolved: () => void
}) {
  const [showActions, setShowActions] = useState(false)
  const [showAmountInput, setShowAmountInput] = useState(false)
  const [amount, setAmount] = useState(claim.estimatedCompensation.toString())
  const [loading, setLoading] = useState(false)

  const daysSinceSubmit = Math.floor(
    (Date.now() - new Date(claim.submittedAt).getTime()) / 86_400_000,
  )

  async function handleApproved() {
    setLoading(true)
    try {
      const actualAmount = parseInt(amount, 10) || claim.estimatedCompensation
      await api.updateClaimStatus(claim.claimId, "approved", actualAmount)
      onResolved()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setShowActions(false)
      setShowAmountInput(false)
    }
  }

  async function handleRejected() {
    setLoading(true)
    try {
      await api.updateClaimStatus(claim.claimId, "rejected")
      onResolved()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setShowActions(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <span>{claim.fromStation}</span>
            <span className="text-muted-foreground">→</span>
            <span>{claim.toStation}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(claim.date).toLocaleDateString("sv-SE", {
              day: "numeric",
              month: "short",
            })}{" "}
            · {claim.delayMinutes} min försening
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            ~{claim.estimatedCompensation} kr
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {daysSinceSubmit === 0
              ? "Skickad idag"
              : daysSinceSubmit === 1
                ? "Skickad igår"
                : `${daysSinceSubmit} dagar sedan`}
          </p>
        </div>
      </div>

      {!showActions ? (
        <button
          onClick={() => setShowActions(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Banknote className="size-3.5" />
          Har du fått svar?
        </button>
      ) : showAmountInput ? (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">
              Hur mycket fick du?
            </label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9"
                placeholder={claim.estimatedCompensation.toString()}
              />
              <span className="text-sm text-muted-foreground">kr</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowAmountInput(false)}
              disabled={loading}
            >
              Tillbaka
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleApproved}
              disabled={loading}
            >
              {loading ? "Sparar..." : "Spara"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleRejected}
            disabled={loading}
          >
            <X className="size-3.5" />
            Avslaget
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setShowAmountInput(true)}
            disabled={loading}
          >
            <Check className="size-3.5" />
            Fick pengar
          </Button>
        </div>
      )}
    </div>
  )
}
