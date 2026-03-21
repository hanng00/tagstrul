import { useMemo } from "react"
import type { Claim } from "@/types"

export function useClaimsSummary(claims: Claim[]) {
  const pendingClaims = useMemo(
    () => claims.filter((c) => c.status === "submitted"),
    [claims]
  )

  const totalPending = useMemo(
    () => pendingClaims.reduce((s, c) => s + c.estimatedCompensation, 0),
    [pendingClaims]
  )

  const totalReceived = useMemo(
    () =>
      claims
        .filter((c) => c.status === "approved")
        .reduce((s, c) => s + (c.actualCompensation ?? c.estimatedCompensation), 0),
    [claims]
  )

  return { pendingClaims, totalPending, totalReceived }
}
