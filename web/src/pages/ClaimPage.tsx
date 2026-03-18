import { useNavigate, useParams } from "react-router"
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Info,
  ChevronDown,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDelay, useProfile } from "@/lib/queries"
import {
  api,
  type StartClaimResponse,
  type SubmitContactResponse,
  type SubmitBankResponse,
  type ConfirmClaimResponse,
} from "@/lib/api"
import { events } from "@/lib/posthog"

function formatPersonnummer(input: string): string {
  const digits = input.replace(/\D/g, "")
  if (digits.length === 12) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`
  }
  return input
}

type Step =
  | "loading"
  | "travel"
  | "contact"
  | "bank"
  | "confirm"
  | "success"
  | "error"

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  })
}

export function ClaimPage() {
  const { delayId } = useParams<{ delayId: string }>()
  const navigate = useNavigate()
  const { delay, isLoading: delayLoading } = useDelay(delayId)
  useProfile()

  const [step, setStep] = useState<Step>("travel")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [claimToken, setClaimToken] = useState("")
  const [barId, setBarId] = useState("")

  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  const [bank, setBank] = useState({
    personalNumber: "",
    swishPhone: "",
  })

  const [result, setResult] = useState<ConfirmClaimResponse | null>(null)

  async function handleStartClaim() {
    if (!delayId) return
    setLoading(true)
    setError(null)

    events.claimStarted({
      delayId,
      delayMinutes: delay?.delayMinutes,
      cancelled: delay?.cancelled,
      estimatedCompensation: delay?.estimatedCompensation,
    })

    try {
      const res: StartClaimResponse = await api.startClaim(delayId)
      setClaimToken(res.claimToken)
      setContact({
        firstName: res.contact.firstName,
        lastName: res.contact.lastName,
        email: res.contact.email,
        phone: res.contact.phone,
      })
      setStep("contact")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel")
      setStep("error")
      events.claimError({ delayId, step: "start" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitContact() {
    setLoading(true)
    setError(null)

    try {
      const res: SubmitContactResponse = await api.submitClaimContact({
        claimToken,
        ...contact,
      })
      setClaimToken(res.claimToken)
      setBank({
        personalNumber: res.bank.personalNumber,
        swishPhone: res.bank.swishPhone,
      })
      setStep("bank")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel")
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitBank() {
    setLoading(true)
    setError(null)

    try {
      const res: SubmitBankResponse = await api.submitClaimBank({
        claimToken,
        personalNumber: formatPersonnummer(bank.personalNumber),
        swishPhone: bank.swishPhone,
      })
      setClaimToken(res.claimToken)
      setBarId(res.barId)
      setStep("confirm")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel")
      setStep("error")
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!delayId) return
    setLoading(true)
    setError(null)

    try {
      const res: ConfirmClaimResponse = await api.confirmClaim({
        claimToken,
        barId,
        delayId,
      })
      setResult(res)
      setStep("success")
      events.claimSubmitted({
        delayId,
        confirmationId: res.confirmationId,
        delayMinutes: delay?.delayMinutes,
        cancelled: delay?.cancelled,
        estimatedCompensation: delay?.estimatedCompensation,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel")
      setStep("error")
      events.claimError({ delayId, step: "confirm" })
    } finally {
      setLoading(false)
    }
  }

  if (delayLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
      </div>
    )
  }

  if (!delay) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-20">
        <p className="text-sm text-muted-foreground">
          Förseningen hittades inte
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate("/app")}>
          Tillbaka
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 pt-4 pb-2">
        <button
          onClick={() => navigate("/app")}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          Begär ersättning
        </h1>
      </header>

      <StepIndicator currentStep={step} />

      <div className="flex flex-1 flex-col px-5 pt-4 pb-6">
        {step === "travel" && (
          <TravelStep
            delay={delay}
            loading={loading}
            onContinue={handleStartClaim}
          />
        )}

        {step === "contact" && (
          <ContactStep
            contact={contact}
            setContact={setContact}
            loading={loading}
            onContinue={handleSubmitContact}
            onBack={() => setStep("travel")}
          />
        )}

        {step === "bank" && (
          <BankStep
            bank={bank}
            setBank={setBank}
            loading={loading}
            onContinue={handleSubmitBank}
            onBack={() => setStep("contact")}
          />
        )}

        {step === "confirm" && (
          <ConfirmStep
            delay={delay}
            contact={contact}
            bank={bank}
            loading={loading}
            onConfirm={handleConfirm}
            onBack={() => setStep("bank")}
          />
        )}

        {step === "success" && result && (
          <SuccessStep
            result={result}
            delay={delay}
            onDone={() => navigate("/app")}
          />
        )}

        {step === "error" && (
          <ErrorStep
            error={error}
            onRetry={() => setStep("travel")}
            onBack={() => navigate("/app")}
          />
        )}
      </div>
    </div>
  )
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = ["travel", "contact", "bank", "confirm"]
  const currentIndex = steps.indexOf(currentStep)

  if (
    currentStep === "success" ||
    currentStep === "error" ||
    currentStep === "loading"
  ) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-2 px-5 py-3">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i <= currentIndex ? "bg-foreground" : "bg-muted"
          }`}
        />
      ))}
    </div>
  )
}

function ScheduledChangeWarning({
  disruptionReason,
}: {
  disruptionReason?: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="animate-fade-up mb-4 w-full rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2.5 text-left transition-colors hover:bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
    >
      <div className="flex items-center gap-2">
        <Info className="size-4 shrink-0 text-amber-600/80 dark:text-amber-400/80" />
        <span className="flex-1 text-sm text-amber-800/90 dark:text-amber-200/90">
          Troligen planerad ändring
        </span>
        <ChevronDown
          className={`size-4 text-amber-600/60 transition-transform dark:text-amber-400/60 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="mt-2 space-y-2 pl-6 text-xs text-amber-700/80 dark:text-amber-300/80">
          <p>
            {disruptionReason ? `"${disruptionReason}" — ` : ""}
            Denna ändring meddelades mer än 72 timmar i förväg, vilket enligt
            SJ:s regler räknas som en tidtabellsändring snarare än en akut
            försening.
          </p>
          <p>
            Du kan fortfarande skicka in ansökan — SJ avgör slutgiltigt. Vid
            avslag har du rätt till återbetalning av biljetten.
          </p>
        </div>
      )}
    </button>
  )
}

function TravelStep({
  delay,
  loading,
  onContinue,
}: {
  delay: NonNullable<ReturnType<typeof useDelay>["delay"]>
  loading: boolean
  onContinue: () => void
}) {
  return (
    <>
      {/* Warning for likely scheduled changes */}
      {delay.likelyScheduledChange && (
        <ScheduledChangeWarning disruptionReason={delay.disruptionReason} />
      )}

      <div className="animate-fade-up rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Steg 1: Bekräfta reseuppgifter
        </h2>

        <div className="mt-4 flex items-center gap-2 text-base font-medium text-foreground">
          <span>{delay.fromStation}</span>
          <span className="text-muted-foreground">→</span>
          <span>{delay.toStation}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatDate(delay.date)} · avgång {delay.scheduledDeparture}
        </p>

        <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm text-destructive">
            {delay.cancelled
              ? "Inställt tåg"
              : `${delay.delayMinutes} min försening`}
          </span>
          <span className="text-2xl font-semibold text-foreground tabular-nums">
            ~{delay.estimatedCompensation}
            <span className="ml-0.5 text-sm font-medium text-muted-foreground">
              kr
            </span>
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Genom att fortsätta bekräftar du att uppgifterna ovan stämmer och att du
        vill ansöka om ersättning från SJ.
      </p>

      <div className="mt-auto pt-8">
        <Button
          className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
          onClick={onContinue}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Check className="mr-2 size-4" />
          )}
          Bekräfta och fortsätt
        </Button>
      </div>
    </>
  )
}

function ContactStep({
  contact,
  setContact,
  loading,
  onContinue,
  onBack,
}: {
  contact: { firstName: string; lastName: string; email: string; phone: string }
  setContact: (c: typeof contact) => void
  loading: boolean
  onContinue: () => void
  onBack: () => void
}) {
  const isValid =
    contact.firstName.length > 0 &&
    contact.lastName.length > 0 &&
    contact.email.includes("@") &&
    contact.phone.length >= 10

  return (
    <>
      <div className="animate-fade-up rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Steg 2: Kontaktuppgifter
        </h2>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Förnamn</label>
              <Input
                value={contact.firstName}
                onChange={(e) =>
                  setContact({ ...contact, firstName: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Efternamn</label>
              <Input
                value={contact.lastName}
                onChange={(e) =>
                  setContact({ ...contact, lastName: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">E-post</label>
            <Input
              type="email"
              value={contact.email}
              onChange={(e) =>
                setContact({ ...contact, email: e.target.value })
              }
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Telefon</label>
            <Input
              type="tel"
              value={contact.phone}
              onChange={(e) =>
                setContact({ ...contact, phone: e.target.value })
              }
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Dessa uppgifter skickas till SJ för att de ska kunna kontakta dig
        angående din ersättning.
      </p>

      <div className="mt-auto flex gap-3 pt-8">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-lg"
          onClick={onBack}
          disabled={loading}
        >
          Tillbaka
        </Button>
        <Button
          className="h-12 flex-1 rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
          onClick={onContinue}
          disabled={loading || !isValid}
        >
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Fortsätt
        </Button>
      </div>
    </>
  )
}

function BankStep({
  bank,
  setBank,
  loading,
  onContinue,
  onBack,
}: {
  bank: { personalNumber: string; swishPhone: string }
  setBank: (b: typeof bank) => void
  loading: boolean
  onContinue: () => void
  onBack: () => void
}) {
  const isValid =
    bank.personalNumber.length >= 10 && bank.swishPhone.length >= 10

  return (
    <>
      <div className="animate-fade-up rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Steg 3: Utbetalningsuppgifter
        </h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">
              Personnummer
            </label>
            <Input
              value={bank.personalNumber}
              onChange={(e) =>
                setBank({ ...bank, personalNumber: e.target.value })
              }
              placeholder="ÅÅÅÅMMDD-XXXX"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">
              Swish-nummer (för utbetalning)
            </label>
            <Input
              type="tel"
              value={bank.swishPhone}
              onChange={(e) => setBank({ ...bank, swishPhone: e.target.value })}
              placeholder="07XXXXXXXX"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Ersättningen betalas ut via Swish till det angivna numret.
      </p>

      <div className="mt-auto flex gap-3 pt-8">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-lg"
          onClick={onBack}
          disabled={loading}
        >
          Tillbaka
        </Button>
        <Button
          className="h-12 flex-1 rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
          onClick={onContinue}
          disabled={loading || !isValid}
        >
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Fortsätt
        </Button>
      </div>
    </>
  )
}

function ConfirmStep({
  delay,
  contact,
  bank,
  loading,
  onConfirm,
  onBack,
}: {
  delay: NonNullable<ReturnType<typeof useDelay>["delay"]>
  contact: { firstName: string; lastName: string; email: string; phone: string }
  bank: { personalNumber: string; swishPhone: string }
  loading: boolean
  onConfirm: () => void
  onBack: () => void
}) {
  const [accepted, setAccepted] = useState(false)

  return (
    <>
      <div className="animate-fade-up rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Steg 4: Granska och skicka
        </h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resa</span>
            <span className="font-medium">
              {delay.fromStation} → {delay.toStation}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Datum</span>
            <span className="font-medium">{formatDate(delay.date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Försening</span>
            <span className="font-medium text-destructive">
              {delay.cancelled ? "Inställt" : `${delay.delayMinutes} min`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Namn</span>
            <span className="font-medium">
              {contact.firstName} {contact.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-post</span>
            <span className="font-medium">{contact.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Swish</span>
            <span className="font-medium">{bank.swishPhone}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <span className="text-muted-foreground">Uppskattad ersättning</span>
            <span className="text-lg font-semibold">
              ~{delay.estimatedCompensation} kr
            </span>
          </div>
        </div>
      </div>

      <label className="mt-4 flex items-start gap-3 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 size-4 rounded border-border"
        />
        <span>
          Jag bekräftar att uppgifterna stämmer och godkänner att ansökan
          skickas till SJ enligt deras{" "}
          <a
            href="https://www.sj.se/om-sj/regler-och-villkor/rattigheter-vid-forsening#Ers%C3%A4ttning_vid_f%C3%B6rsening"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            villkor
          </a>
          .
        </span>
      </label>

      <div className="mt-auto flex gap-3 pt-8">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-lg"
          onClick={onBack}
          disabled={loading}
        >
          Tillbaka
        </Button>
        <Button
          className="h-12 flex-1 rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
          onClick={onConfirm}
          disabled={loading || !accepted}
        >
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Check className="mr-2 size-4" />
          )}
          Skicka ansökan
        </Button>
      </div>
    </>
  )
}

function SuccessStep({
  result,
  delay,
  onDone,
}: {
  result: ConfirmClaimResponse
  delay: NonNullable<ReturnType<typeof useDelay>["delay"]>
  onDone: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <Check className="size-8 text-green-600 dark:text-green-400" />
      </div>

      <h2 className="mt-6 text-xl font-semibold text-foreground">
        Ansökan skickad!
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Din ersättningsansökan har skickats till SJ.
      </p>

      <div className="mt-6 w-full rounded-xl border border-border bg-card p-4 text-left">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bekräftelse-ID</span>
            <span className="font-mono text-xs">{result.confirmationId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uppskattad ersättning</span>
            <span className="font-semibold">
              ~{delay.estimatedCompensation} kr
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        SJ behandlar vanligtvis ansökningar inom 2-4 veckor. Ersättningen
        betalas ut via Swish.
      </p>

      <Button
        className="mt-8 h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
        onClick={onDone}
      >
        Klar
      </Button>
    </div>
  )
}

function ErrorStep({
  error,
  onRetry,
  onBack,
}: {
  error: string | null
  onRetry: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>

      <h2 className="mt-6 text-xl font-semibold text-foreground">
        Något gick fel
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        {error || "Ett oväntat fel uppstod. Försök igen."}
      </p>

      <div className="mt-8 flex w-full gap-3">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-lg"
          onClick={onBack}
        >
          Avbryt
        </Button>
        <Button
          className="h-12 flex-1 rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90"
          onClick={onRetry}
        >
          Försök igen
        </Button>
      </div>
    </div>
  )
}
