import { cn } from "@/lib/utils"

interface TrainLoaderProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: { container: "w-12 h-6", train: "w-6 h-4" },
  md: { container: "w-16 h-8", train: "w-8 h-5" },
  lg: { container: "w-20 h-10", train: "w-10 h-6" },
}

export function TrainLoader({ size = "md", className }: TrainLoaderProps) {
  const sizes = sizeMap[size]

  return (
    <div className={cn("relative overflow-hidden", sizes.container, className)} role="status" aria-label="Loading">
      {/* Scrolling ground */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 overflow-hidden">
        <div className="animate-ground-scroll flex w-[200%]">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="flex items-end gap-1 px-1">
              <div className="w-2 h-1 bg-muted-foreground/20 rounded-sm" />
              <div className="w-0.5 h-0.5 bg-muted-foreground/10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Train (stationary but trembling) */}
      <div className={cn("absolute bottom-1.5 left-1/2 -translate-x-1/2 animate-train-tremble", sizes.train)}>
        <svg viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Train body */}
          <rect x="2" y="4" width="28" height="12" rx="3" className="fill-foreground" />
          
          {/* Windows */}
          <rect x="5" y="6" width="4" height="4" rx="1" className="fill-background" />
          <rect x="11" y="6" width="4" height="4" rx="1" className="fill-background" />
          <rect x="17" y="6" width="4" height="4" rx="1" className="fill-background" />
          <rect x="23" y="6" width="4" height="4" rx="1" className="fill-background" />
          
          {/* Front detail */}
          <rect x="26" y="12" width="4" height="2" rx="0.5" className="fill-muted-foreground" />
          
          {/* Wheels */}
          <circle cx="8" cy="18" r="2" className="fill-foreground animate-wheel-spin" style={{ transformOrigin: "8px 18px" }} />
          <circle cx="24" cy="18" r="2" className="fill-foreground animate-wheel-spin" style={{ transformOrigin: "24px 18px" }} />
          
          {/* Wheel details */}
          <circle cx="8" cy="18" r="0.75" className="fill-background" />
          <circle cx="24" cy="18" r="0.75" className="fill-background" />
        </svg>
      </div>
    </div>
  )
}
