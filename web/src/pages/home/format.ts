import type { Delay } from "@/types"
import { daysUntil } from "@/lib/date-utils"

export function formatDay(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return "idag"
  if (diff === -1) return "igår"
  return d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })
}

export function formatKr(amount: number) {
  return `${amount.toLocaleString("sv-SE")} kr`
}

/** Days left to claim, or null when SJ gave no deadline. */
export function daysLeft(delay: Delay) {
  return delay.claimDeadline ? Math.max(0, daysUntil(delay.claimDeadline)) : null
}

export const URGENT_DAYS = 7

/** One line that says what happened and, when it matters, how long is left. */
export function delaySummary(delay: Delay) {
  const what = delay.cancelled ? "Inställt" : `${delay.delayMinutes} min sent`
  const left = daysLeft(delay)
  if (left !== null && left <= URGENT_DAYS) {
    return {
      text: `${what}, ${left === 1 ? "1 dag" : `${left} dagar`} kvar att kräva`,
      urgent: true,
    }
  }
  return { text: `${what}, ${formatDay(delay.date)}`, urgent: false }
}

const NUMBER_WORDS = ["noll", "en", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio"]

/** "tre" for 3, digits from 11 and up. */
export function countWord(n: number) {
  return NUMBER_WORDS[n] ?? String(n)
}
