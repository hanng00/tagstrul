import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import type { AuthSession } from "@/lib/auth"
import { Logo } from "@/components/Logo"

type Step = "email" | "otp"

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, verifyOtp, confirmAccount } = useAuth()

  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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
    setNotice(null)

    if (session.type === "confirm_signup") {
      try {
        const otpSession = await confirmAccount(session, otp.trim())
        setSession(otpSession)
        setOtp("")
        setNotice("Konto bekräftat! Vi skickade en inloggningskod till din e-post.")
      } catch (err) {
        setError("Fel kod. Försök igen.")
        console.error("Account confirmation error:", err)
      } finally {
        setIsLoading(false)
      }
      return
    }

    try {
      await verifyOtp(session, otp.trim())
      navigate("/app", { replace: true })
    } catch (err) {
      setError("Fel kod. Försök igen.")
      console.error("OTP verification error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  function handleBack() {
    setStep("email")
    setOtp("")
    setSession(null)
    setError(null)
    setNotice(null)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="board-scope safe-top">
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => navigate("/")}
            className="-ml-2 flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Tillbaka
          </button>
          <Logo size="small" />
        </div>
        <div className="platform-edge" aria-hidden />
      </header>

      <main className="flex flex-1 flex-col items-center px-5 pt-14 pb-20 sm:justify-center sm:pt-0">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-sign text-4xl leading-none font-bold text-foreground">
              {step === "email"
                ? "Logga in"
                : session?.type === "confirm_signup"
                  ? "Bekräfta e-post"
                  : "Logga in"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
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
                  className="h-12 rounded-lg border border-input bg-card px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground"
                />
              </label>

              {error && (
                <p className="text-sm font-medium text-late">{error}</p>
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
                  className="h-12 rounded-lg border border-input bg-card px-4 text-center text-2xl font-semibold tracking-[0.3em] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:text-base focus:border-foreground"
                />
              </label>

              {notice && (
                <p className="text-sm font-medium text-kronor">{notice}</p>
              )}

              {error && (
                <p className="text-sm font-medium text-late">{error}</p>
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
