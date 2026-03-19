import { useNavigate, useParams } from "react-router"
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Info,
  ChevronDown,
  ExternalLink,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PersonnummerInput, formatPersonnummer, validatePersonnummer } from "@/components/ui-extended/personnummer-input"
import { PhoneInput, getPhoneDigits, formatPhone } from "@/components/ui-extended/phone-input"
import { TrainLoader } from "@/components/ui/train-loader"
import { useDelay, useProfile } from "@/lib/queries"
import { ApiError } from "@/lib/api-client"
import {
  useStartClaim,
  useSubmitContact,
  useSubmitBank,
  useConfirmClaim,
  type ConfirmClaimResponse,
} from "@/features/claims"
import { events } from "@/lib/posthog"

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
  const [claimToken, setClaimToken] = useState("")
  const [barId, setBarId] = useState("")
  const [failedStep, setFailedStep] = useState<Step | null>(null)

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

  const startClaim = useStartClaim()
  const submitContact = useSubmitContact()
  const submitBank = useSubmitBank()
  const confirmClaim = useConfirmClaim()

  const currentError =
    startClaim.error || submitContact.error || submitBank.error || confirmClaim.error
  const isLoading =
    startClaim.isPending || submitContact.isPending || submitBank.isPending || confirmClaim.isPending

  useEffect(() => {
    if (currentError) {
      setStep("error")
    }
  }, [currentError])

  function handleStartClaim() {
    if (!delayId) return

    events.claimStarted({
      delayId,
      delayMinutes: delay?.delayMinutes,
      cancelled: delay?.cancelled,
      estimatedCompensation: delay?.estimatedCompensation,
    })

    startClaim.mutate(delayId, {
      onSuccess: (res) => {
        setClaimToken(res.claimToken)
        setContact({
          firstName: res.contact.firstName,
          lastName: res.contact.lastName,
          email: res.contact.email,
          phone: formatPhone(res.contact.phone),
        })
        setStep("contact")
      },
      onError: () => {
        setFailedStep("travel")
        events.claimError({ delayId, step: "start" })
      },
    })
  }

  function handleSubmitContact() {
    submitContact.mutate(
      { claimToken, ...contact, phone: getPhoneDigits(contact.phone) },
      {
        onSuccess: (res) => {
          setClaimToken(res.claimToken)
          setBank({
            personalNumber: res.bank.personalNumber,
            swishPhone: formatPhone(res.bank.swishPhone),
          })
          setStep("bank")
        },
        onError: () => {
          setFailedStep("contact")
        },
      }
    )
  }

  function handleSubmitBank() {
    submitBank.mutate(
      {
        claimToken,
        personalNumber: formatPersonnummer(bank.personalNumber),
        swishPhone: getPhoneDigits(bank.swishPhone),
      },
      {
        onSuccess: (res) => {
          setClaimToken(res.claimToken)
          setBarId(res.barId)
          setStep("confirm")
        },
        onError: () => {
          setFailedStep("bank")
        },
      }
    )
  }

  function handleConfirm() {
    if (!delayId) return

    confirmClaim.mutate(
      { claimToken, barId, delayId },
      {
        onSuccess: (res) => {
          setResult(res)
          setStep("success")
          events.claimSubmitted({
            delayId,
            confirmationId: res.confirmationId,
            delayMinutes: delay?.delayMinutes,
            cancelled: delay?.cancelled,
            estimatedCompensation: delay?.estimatedCompensation,
          })
        },
        onError: () => {
          setFailedStep("confirm")
          events.claimError({ delayId, step: "confirm" })
        },
      }
    )
  }

  function handleRetry() {
    startClaim.reset()
    submitContact.reset()
    submitBank.reset()
    confirmClaim.reset()
    setStep(failedStep ?? "travel")
    setFailedStep(null)
  }

  if (delayLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <TrainLoader size="md" />
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
            loading={isLoading}
            onContinue={handleStartClaim}
          />
        )}

        {step === "contact" && (
          <ContactStep
            contact={contact}
            setContact={setContact}
            loading={isLoading}
            onContinue={handleSubmitContact}
            onBack={() => setStep("travel")}
          />
        )}

        {step === "bank" && (
          <BankStep
            bank={bank}
            setBank={setBank}
            loading={isLoading}
            onContinue={handleSubmitBank}
            onBack={() => setStep("contact")}
            fieldError={submitBank.error?.field === "personalNumber" || submitBank.error?.field === "swishPhone" ? submitBank.error : undefined}
          />
        )}

        {step === "confirm" && (
          <ConfirmStep
            delay={delay}
            contact={contact}
            bank={bank}
            loading={isLoading}
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
            error={currentError}
            delay={delay}
            onRetry={handleRetry}
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
  const phoneDigits = contact.phone.replace(/\D/g, "")
  const isValid =
    contact.firstName.length > 0 &&
    contact.lastName.length > 0 &&
    contact.email.includes("@") &&
    phoneDigits.length >= 10

  return (
    <>
      <div className="animate-fade-up rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Steg 2: Kontaktuppgifter
        </h2>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Förnamn</label>
              <Input
                value={contact.firstName}
                onChange={(e) =>
                  setContact({ ...contact, firstName: e.target.value })
                }
                className="mt-1 h-12 text-base sm:h-10 sm:text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Efternamn</label>
              <Input
                value={contact.lastName}
                onChange={(e) =>
                  setContact({ ...contact, lastName: e.target.value })
                }
                className="mt-1 h-12 text-base sm:h-10 sm:text-sm"
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
              className="mt-1 h-12 text-base sm:h-10 sm:text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Telefon</label>
            <PhoneInput
              value={contact.phone}
              onChange={(value) =>
                setContact({ ...contact, phone: value })
              }
              className="mt-1 h-12 text-base sm:h-10 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Dessa uppgifter skickas till SJ för att de ska kunna kontakta dig
        angående din ersättning.
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
        <Button
          variant="outline"
          className="h-12 w-full rounded-lg sm:flex-1"
          onClick={onBack}
          disabled={loading}
        >
          Tillbaka
        </Button>
        <Button
          className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 sm:flex-1"
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
  fieldError,
}: {
  bank: { personalNumber: string; swishPhone: string }
  setBank: (b: typeof bank) => void
  loading: boolean
  onContinue: () => void
  onBack: () => void
  fieldError?: ApiError
}) {
  const personalNumberDigits = bank.personalNumber.replace(/\D/g, "")
  const swishPhoneDigits = bank.swishPhone.replace(/\D/g, "")
  
  const personnummerValidation = validatePersonnummer(bank.personalNumber)
  const isValid =
    personnummerValidation.valid && swishPhoneDigits.length >= 10

  const personalNumberError = fieldError?.field === "personalNumber" 
    ? fieldError.message 
    : (personalNumberDigits.length >= 10 ? personnummerValidation.error : undefined)
  const swishPhoneError = fieldError?.field === "swishPhone" ? fieldError.message : undefined

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
            <PersonnummerInput
              value={bank.personalNumber}
              onChange={(value) =>
                setBank({ ...bank, personalNumber: value })
              }
              className={`mt-1 h-12 text-base sm:h-10 sm:text-sm ${personalNumberError ? "border-destructive" : ""}`}
            />
            {personalNumberError && (
              <p className="mt-1 text-xs text-destructive">{personalNumberError}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">
              Swish-nummer (för utbetalning)
            </label>
            <PhoneInput
              value={bank.swishPhone}
              onChange={(value) => setBank({ ...bank, swishPhone: value })}
              className={`mt-1 h-12 text-base sm:h-10 sm:text-sm ${swishPhoneError ? "border-destructive" : ""}`}
            />
            {swishPhoneError && (
              <p className="mt-1 text-xs text-destructive">{swishPhoneError}</p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Ersättningen betalas ut via Swish till det angivna numret.
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
        <Button
          variant="outline"
          className="h-12 w-full rounded-lg sm:flex-1"
          onClick={onBack}
          disabled={loading}
        >
          Tillbaka
        </Button>
        <Button
          className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 sm:flex-1"
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
          className="mt-0.5 size-5 rounded border-border sm:size-4"
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

      <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
        <Button
          variant="outline"
          className="h-12 w-full rounded-lg sm:flex-1"
          onClick={onBack}
          disabled={loading}
        >
          Tillbaka
        </Button>
        <Button
          className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 sm:flex-1"
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
      <div className="flex size-16 items-center justify-center rounded-full bg-success-surface">
        <Check className="size-8 text-success" />
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
  delay,
  onRetry,
  onBack,
}: {
  error: ApiError | null
  delay?: NonNullable<ReturnType<typeof useDelay>["delay"]>
  onRetry: () => void
  onBack: () => void
}) {
  const isRetryable = error?.retryable ?? true
  const showManualFallback = !isRetryable || error?.code === "SERVICE_UNAVAILABLE"

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>

      <h2 className="mt-6 text-xl font-semibold text-foreground">
        Något gick fel
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        {error?.message || "Ett oväntat fel uppstod. Försök igen."}
      </p>

      {showManualFallback && delay && (
        <div className="mt-6 w-full rounded-xl border border-border bg-card p-4 text-left">
          <p className="text-sm font-medium text-foreground">
            Ansök manuellt på SJ.se
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Om problemet kvarstår kan du ansöka direkt hos SJ med dessa uppgifter:
          </p>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p><span className="font-medium">Resa:</span> {delay.fromStation} → {delay.toStation}</p>
            <p><span className="font-medium">Datum:</span> {delay.date}</p>
            <p><span className="font-medium">Avgång:</span> {delay.scheduledDeparture}</p>
            <p><span className="font-medium">Försening:</span> {delay.cancelled ? "Inställt" : `${delay.delayMinutes} min`}</p>
          </div>
          <a
            href="https://www.sj.se/kundservice/forseningsersattning"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground underline"
          >
            Öppna SJ.se
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          className="h-12 w-full rounded-lg sm:flex-1"
          onClick={onBack}
        >
          Avbryt
        </Button>
        {isRetryable && (
          <Button
            className="h-12 w-full rounded-lg bg-foreground text-[15px] font-semibold text-background hover:bg-foreground/90 sm:flex-1"
            onClick={onRetry}
          >
            Försök igen
          </Button>
        )}
      </div>
    </div>
  )
}
