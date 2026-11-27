import { ApiError } from "@/lib/api-client"
import { formatPersonnummer, validatePersonnummer } from "@/lib/personnummer"
import { getPhoneDigits, formatPhone } from "@/components/ui-extended/phone-utils"
import { startClaim } from "./start-claim"
import { submitContact } from "./submit-contact"
import { submitBank } from "./submit-bank"
import { confirmClaim, type ConfirmClaimResponse } from "./confirm-claim"

export type BatchClaimOutcome =
  | { ok: true; result: ConfirmClaimResponse }
  | { ok: false; reason: "missing-details" | "failed"; message: string }

/**
 * Runs the same four steps as the one-trip claim flow, without stopping
 * for review, using the contact and payout details the server already
 * has for the user. The user reviews and approves those details once,
 * for every trip, before this runs.
 *
 * When a detail is missing, the trip is left for the one-trip flow,
 * where the user can fill it in.
 */
export async function claimOneDelay(delayId: string): Promise<BatchClaimOutcome> {
  try {
    const started = await startClaim(delayId)
    const { contact } = started
    if (!contact.firstName || !contact.lastName || !contact.email) {
      return {
        ok: false,
        reason: "missing-details",
        message: "Namn eller e-post saknas",
      }
    }

    const withContact = await submitContact({
      claimToken: started.claimToken,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: getPhoneDigits(formatPhone(contact.phone)),
    })

    const { bank } = withContact
    if (!bank.personalNumber || !validatePersonnummer(bank.personalNumber).valid || !bank.swishPhone) {
      return {
        ok: false,
        reason: "missing-details",
        message: "Personnummer eller Swish-nummer saknas",
      }
    }

    const withBank = await submitBank({
      claimToken: withContact.claimToken,
      personalNumber: formatPersonnummer(bank.personalNumber),
      swishPhone: getPhoneDigits(formatPhone(bank.swishPhone)),
    })

    const result = await confirmClaim({
      claimToken: withBank.claimToken,
      barId: withBank.barId,
      delayId,
    })
    return { ok: true, result }
  } catch (err) {
    return {
      ok: false,
      reason: "failed",
      message: err instanceof ApiError ? err.message : "Något gick fel när kravet skickades",
    }
  }
}
