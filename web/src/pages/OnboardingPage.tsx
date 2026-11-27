import { useState } from "react"
import { useNavigate } from "react-router"
import { ArrowRight, Bell, Sparkles, Check, CreditCard, SkipForward, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StationInput } from "@/components/StationInput"
import { useAddRoute, useUpdateProfile, useAddMovingoCard } from "@/lib/queries"
import { MOVINGO_CARD_LABELS, type MovingoCardType, type MovingoCard, isValidMovingoId, getMovingoIdError } from "@/types"
import { Logo } from "@/components/Logo"
import { events } from "@/lib/posthog"

type Step = "welcome" | "name" | "route" | "movingo" | "done"

const CARD_TYPES: MovingoCardType[] = [
  "movingo-30",
  "movingo-90",
  "movingo-year",
  "movingo-5-30",
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("welcome")
  const [firstName, setFirstName] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [time, setTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const addRoute = useAddRoute()
  const updateProfile = useUpdateProfile()
  const addMovingoCard = useAddMovingoCard()

  async function handleSaveName() {
    if (!firstName.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await updateProfile.mutateAsync({ firstName: firstName.trim() })
      setStep("route")
    } catch (err) {
      console.error("Failed to save name:", err)
      setError("Kunde inte spara namn. Försök igen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddRoute() {
    if (!from || !to) return
    setIsSubmitting(true)
    setError(null)

    try {
      await addRoute.mutateAsync({
        fromStation: from,
        toStation: to,
        departureTime: time || undefined,
      })
      setStep("movingo")
    } catch (err) {
      console.error("Failed to add route:", err)
      setError("Kunde inte spara pendling. Kontrollera stationsnamnen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddMovingo(card: Omit<MovingoCard, "cardId">) {
    setIsSubmitting(true)
    setError(null)
    try {
      await addMovingoCard.mutateAsync(card)
      await updateProfile.mutateAsync({ onboardingComplete: true })
      setStep("done")
    } catch (err) {
      console.error("Failed to add Movingo card:", err)
      setError("Kunde inte spara Movingo-kort. Försök igen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSkipOnboarding() {
    setIsSubmitting(true)
    setError(null)
    try {
      await updateProfile.mutateAsync({ onboardingComplete: true })
      events.onboardingCompleted()
      navigate("/app", { replace: true })
    } catch (err) {
      console.error("Failed to skip onboarding:", err)
      setError("Något gick fel. Försök igen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleFinish() {
    events.onboardingCompleted()
    navigate("/app", { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background safe-bottom">
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 sm:px-5">
        <div className="w-full max-w-sm">
          {step === "welcome" && (
            <WelcomeStep onNext={() => setStep("name")} />
          )}

          {step === "name" && (
            <NameStep
              firstName={firstName}
              onChange={setFirstName}
              onSubmit={handleSaveName}
              isSubmitting={isSubmitting}
            />
          )}

          {step === "route" && (
            <RouteStep
              firstName={firstName}
              from={from}
              to={to}
              time={time}
              onFromChange={setFrom}
              onToChange={setTo}
              onTimeChange={setTime}
              onSubmit={handleAddRoute}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}

          {step === "movingo" && (
            <MovingoStep
              onAdd={handleAddMovingo}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}

          {step === "done" && (
            <DoneStep firstName={firstName} onFinish={handleFinish} />
          )}
        </div>
      </div>

      <StepIndicator current={step} />

      {step !== "welcome" && step !== "done" && (
        <div className="pb-6 text-center">
          <button
            onClick={step === "route" ? () => setShowSkipWarning(true) : handleSkipOnboarding}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <SkipForward className="size-3.5" />
            Hoppa över
          </button>
        </div>
      )}

      {showSkipWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">
              Hoppa över pendling?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Utan en pendling kan vi inte bevaka förseningar eller hitta ersättningar åt dig.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setShowSkipWarning(false)}
                variant="outline"
                className="flex-1 h-11 rounded-xl"
              >
                Avbryt
              </Button>
              <Button
                onClick={() => {
                  setShowSkipWarning(false)
                  handleSkipOnboarding()
                }}
                className="flex-1 h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90"
              >
                Hoppa över ändå
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="animate-fade-up text-center">
      <div className="mx-auto mb-6 flex justify-center">
        <Logo size="large" />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Välkommen
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Vi bevakar dina tågresor och hjälper dig kräva ersättning när tågen är
        försenade.
      </p>

      <div className="mt-8 space-y-4">
        <Feature
          icon={<Bell className="size-4" />}
          title="Automatisk bevakning"
          description="Vi kollar dina tåg varje dag"
        />
        <Feature
          icon={<Sparkles className="size-4" />}
          title="Enkel ersättning"
          description="Få all info du behöver för att kräva pengar"
        />
      </div>

      <Button
        onClick={onNext}
        className="mt-10 h-12 w-full rounded-xl bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
      >
        Kom igång
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  )
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function NameStep({
  firstName,
  onChange,
  onSubmit,
  isSubmitting,
}: {
  firstName: string
  onChange: (v: string) => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  return (
    <div className="animate-fade-up">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <User className="size-6 text-foreground" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Vad heter du?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vi behöver ditt namn för ersättningsansökningar
        </p>
      </div>

      <div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Förnamn
          </span>
          <input
            value={firstName}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Anna"
            autoFocus
            autoComplete="given-name"
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && firstName.trim()) {
                onSubmit()
              }
            }}
          />
        </label>
      </div>

      <Button
        onClick={onSubmit}
        disabled={!firstName.trim() || isSubmitting}
        className="mt-8 h-12 w-full rounded-xl bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="size-5 animate-spin rounded-full border-2 border-background/20 border-t-background" />
        ) : (
          <>
            Fortsätt
            <ArrowRight className="ml-2 size-4" />
          </>
        )}
      </Button>
    </div>
  )
}

function RouteStep({
  firstName,
  from,
  to,
  time,
  onFromChange,
  onToChange,
  onTimeChange,
  onSubmit,
  isSubmitting,
  error,
}: {
  firstName: string
  from: string
  to: string
  time: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
  onTimeChange: (v: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  error: string | null
}) {
  return (
    <div className="animate-fade-up">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hej {firstName}! 👋
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vilken sträcka pendlar du oftast?
        </p>
      </div>

      <div className="space-y-4">
        <StationInput
          value={from}
          onChange={onFromChange}
          placeholder="Stockholm C"
          label="Från station"
          autoFocus
        />

        <StationInput
          value={to}
          onChange={onToChange}
          placeholder="Uppsala C"
          label="Till station"
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Vanlig avgångstid{" "}
            <span className="text-muted-foreground/50">(valfritt)</span>
          </span>
          <input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition-colors focus:border-foreground"
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}

      <Button
        onClick={onSubmit}
        disabled={!from || !to || isSubmitting}
        className="mt-8 h-12 w-full rounded-xl bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="size-5 animate-spin rounded-full border-2 border-background/20 border-t-background" />
        ) : (
          <>
            Spara och fortsätt
            <ArrowRight className="ml-2 size-4" />
          </>
        )}
      </Button>
    </div>
  )
}

function DoneStep({ firstName, onFinish }: { firstName: string; onFinish: () => void }) {
  return (
    <div className="animate-fade-up text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-success-surface">
        <Check className="size-8 text-success" />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Tack {firstName}!
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Vi börjar bevaka dina tåg direkt. Du får en notis när det finns
        ersättning att kräva.
      </p>

      <Button
        onClick={onFinish}
        className="mt-10 h-12 w-full rounded-xl bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
      >
        Gå till appen
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  )
}

function MovingoStep({
  onAdd,
  isSubmitting,
  error,
}: {
  onAdd: (card: Omit<MovingoCard, "cardId">) => void
  isSubmitting: boolean
  error: string | null
}) {
  const [movingoId, setMovingoId] = useState("")
  const [cardType, setCardType] = useState<MovingoCardType>("movingo-30")
  const [price, setPrice] = useState("3600")
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [showHelp, setShowHelp] = useState(false)
  const [touched, setTouched] = useState(false)

  const movingoIdError = touched && movingoId.length > 0 ? getMovingoIdError(movingoId) : null
  const isValid = isValidMovingoId(movingoId) && price

  function expiryFromType(type: MovingoCardType, start: string): string {
    const d = new Date(start)
    if (type === "movingo-year") d.setFullYear(d.getFullYear() + 1)
    else if (type === "movingo-90") d.setDate(d.getDate() + 90)
    else d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  }

  function handleSubmit() {
    setTouched(true)
    if (!isValidMovingoId(movingoId)) return
    onAdd({
      movingoId: movingoId.trim().toUpperCase(),
      cardType,
      price: parseInt(price, 10),
      purchaseDate,
      expiryDate: expiryFromType(cardType, purchaseDate),
    })
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <CreditCard className="size-6 text-foreground" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Lägg till Movingo-kort
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vi stödjer Movingo i Mälardalstrafiks app på SJ-tåg
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Movingo-nummer <span className="text-muted-foreground/50">(9–10 tecken)</span>
            </span>
            <input
              type="text"
              value={movingoId}
              onChange={(e) => setMovingoId(e.target.value.toUpperCase())}
              onBlur={() => setTouched(true)}
              placeholder="BWTF8E962"
              maxLength={10}
              autoFocus
              className={`h-12 rounded-xl border bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground ${
                movingoIdError ? "border-destructive" : "border-input"
              }`}
            />
          </label>
          {movingoIdError && (
            <p className="mt-1.5 text-xs text-destructive">{movingoIdError}</p>
          )}
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="mt-1.5 py-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Var hittar jag mitt nummer?
          </button>
          {showHelp && (
            <div className="mt-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Hitta ditt Movingo-nummer:</p>
              <ul className="mt-1.5 list-inside list-disc space-y-1">
                <li>I Mälardalstrafiks app → Mina biljetter → fältet "Biljettnr."</li>
                <li>På kvittot från köpet (9–10 tecken)</li>
                <li>På framsidan av ditt fysiska kort</li>
              </ul>
            </div>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Korttyp
          </span>
          <select
            value={cardType}
            onChange={(e) => setCardType(e.target.value as MovingoCardType)}
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition-colors focus:border-foreground"
          >
            {CARD_TYPES.map((t) => (
              <option key={t} value={t}>
                {MOVINGO_CARD_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Pris (kr)
          </span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition-colors focus:border-foreground"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Köpdatum
          </span>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition-colors focus:border-foreground"
          />
        </label>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Endast Movingo i Mälardalstrafiks app på SJ-sträckor.{" "}
        <a href="/om?request=other-routes" className="underline underline-offset-2 hover:no-underline" target="_blank">
          Önska fler  
        </a>
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className="mt-8 h-12 w-full rounded-xl bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
      >
        {isSubmitting ? (
          <div className="size-5 animate-spin rounded-full border-2 border-background/20 border-t-background" />
        ) : (
          <>
            Spara och fortsätt
            <ArrowRight className="ml-2 size-4" />
          </>
        )}
      </Button>
    </div>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ["welcome", "name", "route", "movingo", "done"]
  const currentIndex = steps.indexOf(current)

  return (
    <div className="flex justify-center gap-2 pb-8">
      {steps.map((step, i) => (
        <div
          key={step}
          className={`h-1.5 w-6 rounded-full transition-colors ${
            i <= currentIndex ? "bg-foreground" : "bg-muted"
          }`}
        />
      ))}
    </div>
  )
}
