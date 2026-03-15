import { useState } from "react"
import { Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DonationModal } from "./DonationModal"

interface DonationButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function DonationButton({
  variant = "outline",
  size = "default",
  className,
}: DonationButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Coffee className="size-4" />
        Bjud på en fika
      </Button>
      <DonationModal open={open} onOpenChange={setOpen} />
    </>
  )
}
