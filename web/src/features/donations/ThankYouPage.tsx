import { useNavigate } from "react-router"
import { Heart, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"

export function ThankYouPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center px-5 py-4 sm:px-8 lg:px-12">
        <Logo size="small" />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-20">
        <div className="animate-scale-in text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-foreground/5">
            <Heart className="size-10 text-foreground" fill="currentColor" />
          </div>

          <h1 className="mt-6 text-2xl font-semibold text-foreground">
            Tack för fikan!
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
            Din donation hjälper oss att fortsätta bygga Ersättningsverket och göra
            det enklare för pendlare att få tillbaka sina pengar.
          </p>

          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="mt-8"
          >
            <ArrowLeft className="size-4" />
            Tillbaka till startsidan
          </Button>
        </div>
      </main>
    </div>
  )
}
