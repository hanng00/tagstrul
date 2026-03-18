import * as React from "react"
import { Input } from "@/components/ui/input"

function formatPhoneLive(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) {
    return digits
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
}

export function formatPhone(input: string): string {
  return formatPhoneLive(input)
}

export function getPhoneDigits(formatted: string): string {
  return formatted.replace(/\D/g, "")
}

interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  value: string
  onChange: (value: string) => void
}

function PhoneInput({ value, onChange, ...props }: PhoneInputProps) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      value={value}
      onChange={(e) => onChange(formatPhoneLive(e.target.value))}
      placeholder="07X-XXX XX XX"
      {...props}
    />
  )
}

export { PhoneInput }
