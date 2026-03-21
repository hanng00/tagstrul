import * as React from "react"
import { Input } from "@/components/ui/input"
import {
  formatPersonnummerLive,
  formatPersonnummer,
  validatePersonnummer,
} from "@/lib/personnummer"

export { formatPersonnummer, validatePersonnummer }

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
