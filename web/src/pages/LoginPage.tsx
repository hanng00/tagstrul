import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import type { AuthSession } from "@/lib/auth"

type Step = "email" | "otp"

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, verifyOtp } = useAuth()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const authSession = await signIn(email.trim().toLowerCase())
      setSession(authSession)
      setStep("otp")
    } catch (err) {
      setError("Kunde inte skicka kod. Försök igen.")
      console.error("Sign in error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!otp.trim() || !session) return

    setIsLoading(true)
    setError(null)

    try {
      await verifyOtp(session, otp.trim())
      navigate("/app", { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : ""
      if (message.includes("Konto bekräftat")) {
        setError("Konto bekräftat! Vi skickade en ny kod till din e-post.")
        setOtp("")
        const newSession = await signIn(session.email)
        setSession(newSession)
      } else {
        setError("Fel kod. Försök igen.")
        console.error("OTP verification error:", err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleBack() {
    setStep("email")
    setOtp("")
    setSession(null)
    setError(null)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center px-5 py-4 sm:px-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tillbaka
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-20">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <Mail className="size-6 text-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {step === "email"
                ? "Logga in"
                : session?.type === "confirm_signup"
                  ? "Bekräfta e-post"
                  : "Logga in"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === "email"
                ? "Vi skickar en engångskod till din e-post"
                : session?.type === "confirm_signup"
                  ? `Ange 6-siffrig bekräftelsekod skickad till ${email}`
                  : `Ange 8-siffrig inloggningskod skickad till ${email}`}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  E-postadress
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="namn@exempel.se"
                  autoComplete="email"
                  autoFocus
                  className="h-12 rounded-lg border border-input bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground"
                />
              </label>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                disabled={!email.trim() || isLoading}
                className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Skickar kod...
                  </>
                ) : (
                  "Skicka kod"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Engångskod
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder={session?.type === "confirm_signup" ? "123456" : "12345678"}
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={session?.type === "confirm_signup" ? 6 : 8}
                  className="h-12 rounded-lg border border-input bg-background px-4 text-center text-2xl font-semibold tracking-[0.3em] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:text-base focus:border-foreground"
                />
              </label>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                disabled={(session?.type === "confirm_signup" ? otp.length < 6 : otp.length < 8) || isLoading}
                className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Verifierar...
                  </>
                ) : (
                  "Verifiera"
                )}
              </Button>

              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Använd annan e-post
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
