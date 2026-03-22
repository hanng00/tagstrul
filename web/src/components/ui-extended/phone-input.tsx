import * as React from "react"
import { Input } from "@/components/ui/input"
import { formatPhoneLive } from "./phone-utils"

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
