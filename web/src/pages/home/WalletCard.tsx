import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { Claim, MovingoCard } from "@/types"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PendingClaimCard } from "./PendingClaimCard"
import { formatKr } from "./format"

/**
 * Money already won back, measured against what the user's Movingo card cost.
 * Progress toward "the card paid for itself" is the motivation to claim the next trip.
 */
export function WalletCard({
  totalReceived,
  totalPending,
  pendingClaims,
  activeCard,
  onClaimResolved,
}: {
  totalReceived: number
  totalPending: number
  pendingClaims: Claim[]
  activeCard: MovingoCard | null
  onClaimResolved: () => void
}) {
  const [showPending, setShowPending] = useState(false)
  const share = activeCard && activeCard.price > 0 ? totalReceived / activeCard.price : null
  const percent = share === null ? null : Math.round(share * 100)

  return (
    <section aria-label="Tillbaka från SJ" className="rounded-2xl bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] text-muted-foreground">Tillbaka från SJ</h2>
        <p className="text-2xl font-extrabold tabular-nums tracking-tight">
          {formatKr(totalReceived)}
        </p>
      </div>

      {percent !== null && activeCard && (
        <>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(percent, 100)}
            aria-label="Andel av ditt Movingo-kort"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {percent >= 100
              ? `Ditt Movingo-kort på ${formatKr(activeCard.price)} har betalat sig självt`
              : `${percent} % av ditt Movingo-kort på ${formatKr(activeCard.price)}`}
          </p>
        </>
      )}

      {pendingClaims.length > 0 && (
        <Collapsible
          open={showPending}
          onOpenChange={setShowPending}
          className="mt-4 border-t border-border pt-3"
        >
          <CollapsibleTrigger className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-lg px-2 py-2 text-left text-[15px] hover:bg-muted/50">
            <span>
              {pendingClaims.length === 1
                ? "1 krav väntar på svar"
                : `${pendingClaims.length} krav väntar på svar`}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground tabular-nums">
              ~{formatKr(totalPending)}
              <ChevronDown
                className={cn("size-4 transition-transform", showPending && "rotate-180")}
              />
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {pendingClaims.map((claim) => (
                <PendingClaimCard
                  key={claim.claimId}
                  claim={claim}
                  onResolved={onClaimResolved}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  )
}
