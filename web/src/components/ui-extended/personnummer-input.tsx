import * as React from "react"
import { Input } from "@/components/ui/input"

function formatPersonnummerLive(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 12)
  if (digits.length > 8) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`
  }
  return digits
}

export function formatPersonnummer(input: string): string {
  const digits = input.replace(/\D/g, "")
  if (digits.length === 12) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`
  }
  return input
}

function luhnChecksum(digits: string): boolean {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = parseInt(digits[i], 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export function validatePersonnummer(input: string): { valid: boolean; error?: string } {
  const digits = input.replace(/\D/g, "")
  
  if (digits.length === 0) {
    return { valid: false }
  }
  
  if (digits.length < 10) {
    return { valid: false, error: "Personnumret är för kort" }
  }
  
  if (digits.length !== 10 && digits.length !== 12) {
    return { valid: false, error: "Personnumret måste vara 10 eller 12 siffror" }
  }
  
  // For Luhn, we use the last 10 digits (YYMMDD-XXXX)
  const luhnDigits = digits.length === 12 ? digits.slice(2) : digits
  
  if (!luhnChecksum(luhnDigits)) {
    return { valid: false, error: "Personnumret är ogiltigt (felaktig kontrollsiffra)" }
  }
  
  return { valid: true }
}

interface PersonnummerInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  value: string
  onChange: (value: string) => void
}

function PersonnummerInput({
  value,
  onChange,
  ...props
}: PersonnummerInputProps) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(formatPersonnummerLive(e.target.value))}
      placeholder="ÅÅÅÅMMDD-XXXX"
      {...props}
    />
  )
}

export { PersonnummerInput }
