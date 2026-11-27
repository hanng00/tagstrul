import { useState } from "react"
import { useNavigate } from "react-router"
import { LogOut, Pencil, Check, X, Plus, Trash2, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/queries"
import { TrainLoader } from "@/components/ui/train-loader"
import {
  useProfile,
  useMovingoCards,
  useUpdateProfile,
  useAddMovingoCard,
  useDeleteMovingoCard,
} from "@/lib/queries"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import type { Profile, MovingoCard, MovingoCardType } from "@/types"
import { MOVINGO_CARD_LABELS, isValidMovingoId, getMovingoIdError } from "@/types"
import { PersonnummerInput } from "@/components/ui-extended/personnummer-input"
import { PhoneInput } from "@/components/ui-extended/phone-input"
import { formatPhone, getPhoneDigits } from "@/components/ui-extended/phone-utils"

type FieldKey = "firstName" | "lastName" | "email" | "phone" | "personalNumber" | "swishPhone"

const fieldGroups: { title: string; note?: string; fields: { key: FieldKey; label: string }[] }[] = [
  {
    title: "Kontakt",
    fields: [
      { key: "firstName", label: "Förnamn" },
      { key: "lastName", label: "Efternamn" },
      { key: "email", label: "E-post" },
      { key: "phone", label: "Telefon" },
    ],
  },
  {
    title: "Utbetalning",
    note: "Pengarna betalas ut till det här Swish-numret. Personnumret behövs för kravet.",
    fields: [
      { key: "swishPhone", label: "Swish" },
      { key: "personalNumber", label: "Personnummer" },
    ],
  },
]

const CARD_TYPES: MovingoCardType[] = [
  "movingo-30",
  "movingo-90",
  "movingo-year",
  "movingo-5-30",
]

function isExpired(card: MovingoCard) {
  return card.expiryDate < new Date().toISOString().slice(0, 10)
}

function daysLeft(expiry: string) {
  const end = new Date(expiry)
  end.setHours(23, 59, 59, 999)
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000) - 1)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  })
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: cards = [], isLoading: cardsLoading } = useMovingoCards()
  const updateProfile = useUpdateProfile()
  const addMovingoCard = useAddMovingoCard()
  const deleteMovingoCard = useDeleteMovingoCard()
  const {
    permission,
    isSubscribed,
    isLoading: pushLoading,
    canSubscribe,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Profile | null>(null)
  const [showAddCard, setShowAddCard] = useState(false)

  const loading = profileLoading || cardsLoading

  function startEditing() {
    if (profile) {
      setDraft({
        ...profile,
        phone: formatPhone(profile.phone ?? ""),
        swishPhone: formatPhone(profile.swishPhone ?? ""),
      })
    }
    setEditing(true)
  }

  async function handleSignOut() {
    await signOut()
    navigate("/", { replace: true })
  }

  function handleSave() {
    if (!draft) return
    updateProfile.mutate(
      {
        ...draft,
        phone: getPhoneDigits(draft.phone ?? ""),
        swishPhone: getPhoneDigits(draft.swishPhone ?? "") || undefined,
      },
      {
        onSuccess: () => setEditing(false),
      }
    )
  }

  function handleAddCard(card: Omit<MovingoCard, "cardId">) {
    addMovingoCard.mutate(card, {
      onSuccess: () => setShowAddCard(false),
    })
  }

  function handleDeleteCard(cardId: string) {
    deleteMovingoCard.mutate(cardId)
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <TrainLoader size="md" />
      </div>
    )
  }

  const activeCards = cards.filter((c) => !isExpired(c))
  const expiredCards = cards.filter((c) => isExpired(c))

  function renderField(key: FieldKey) {
    if (editing && draft) {
      const inputClass =
        "h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none transition-colors focus:border-primary sm:w-1/2 sm:text-right"
      if (key === "phone" || key === "swishPhone") {
        return (
          <PhoneInput
            value={draft[key] ?? ""}
            onChange={(value) => setDraft({ ...draft, [key]: value })}
            className={inputClass}
          />
        )
      }
      if (key === "personalNumber") {
        return (
          <PersonnummerInput
            value={draft[key] ?? ""}
            onChange={(value) => setDraft({ ...draft, [key]: value })}
            className={inputClass}
          />
        )
      }
      return (
        <input
          value={draft[key] ?? ""}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          className={inputClass}
        />
      )
    }
    const value = profile?.[key]
    if (key === "personalNumber") return <FieldValue>{maskPersonnummer(value)}</FieldValue>
    if (key === "swishPhone") {
      return (
        <FieldValue>
          {value
            ? formatPhone(value)
            : profile?.phone
              ? `${formatPhone(profile.phone)} (telefon)`
              : "Saknas"}
        </FieldValue>
      )
    }
    if (key === "phone") return <FieldValue>{value ? formatPhone(value) : "Saknas"}</FieldValue>
    return <FieldValue>{value || "Saknas"}</FieldValue>
  }

  const notificationText =
    permission === "unsupported"
      ? "Stöds inte i den här webbläsaren"
      : permission === "denied"
        ? "Blockerade i webbläsaren. Tillåt notiser i inställningarna."
        : isSubscribed
          ? "På. Vi säger till när ditt tåg blir minst 20 min sent."
          : "Få en notis när ditt tåg blir sent, så missar du inga pengar."

  return (
    <div className="flex flex-1 flex-col">
      <header className="app-padding flex items-center justify-between gap-3 pt-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-bold text-primary">
            {(profile.firstName?.[0] ?? "").toUpperCase()}
            {(profile.lastName?.[0] ?? "").toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight">
              {[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Din profil"}
            </h1>
            <p className="truncate text-[15px] text-muted-foreground">{profile.email}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 app-padding pt-6 pb-8">
        {/* Notifications first: they are what brings people back to claim. */}
        <section aria-labelledby="notif-heading" className="rounded-2xl bg-card p-4">
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${
                isSubscribed ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {isSubscribed ? <Bell className="size-5" /> : <BellOff className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="notif-heading" className="text-base font-semibold">
                Förseningsnotiser
              </h2>
              <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                {notificationText}
              </p>
            </div>
          </div>
          {canSubscribe && (
            <div className="mt-3 flex gap-2">
              {isSubscribed ? (
                <>
                  <button
                    onClick={sendTestNotification}
                    className="h-11 flex-1 rounded-xl border border-border text-[15px] font-medium transition-colors hover:bg-muted"
                  >
                    Skicka en testnotis
                  </button>
                  <button
                    onClick={unsubscribe}
                    disabled={pushLoading}
                    className="h-11 rounded-xl px-4 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    Stäng av
                  </button>
                </>
              ) : (
                <button
                  onClick={async () => {
                    const success = await subscribe()
                    if (success) sendTestNotification()
                  }}
                  disabled={pushLoading}
                  className="h-11 flex-1 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {pushLoading ? "Slår på…" : "Slå på notiser"}
                </button>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="card-heading" className="mt-8">
          <h2 id="card-heading" className="px-1 text-lg font-bold tracking-tight">
            Movingo-kort
          </h2>
          <div className="mt-3 space-y-3">
            {activeCards.map((card) => (
              <MovingoCardView
                key={card.cardId}
                card={card}
                onDelete={() => handleDeleteCard(card.cardId)}
              />
            ))}

            {activeCards.length === 0 && !showAddCard && (
              <div className="rounded-2xl bg-card px-4 py-5">
                <p className="text-base font-semibold text-destructive">Inget aktivt kort</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Utan ett giltigt Movingo-kort kan vi inte kräva ersättning åt dig.
                </p>
              </div>
            )}

            {showAddCard ? (
              <AddMovingoCardForm
                onAdd={handleAddCard}
                onCancel={() => setShowAddCard(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddCard(true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[15px] font-semibold transition-colors hover:bg-muted"
              >
                <Plus className="size-4" />
                {activeCards.length > 0 ? "Lägg till nytt kort" : "Lägg till kort"}
              </button>
            )}
          </div>

          {expiredCards.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 px-1 text-[13px] text-muted-foreground">Utgångna kort</p>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
                {expiredCards.map((card) => (
                  <li key={card.cardId} className="flex items-center gap-3 py-1 pr-2 pl-4">
                    <span className="min-w-0 flex-1 text-[15px] text-muted-foreground">
                      {MOVINGO_CARD_LABELS[card.cardType]}, slutade {formatDate(card.expiryDate)}
                    </span>
                    <button
                      onClick={() => handleDeleteCard(card.cardId)}
                      aria-label="Ta bort kortet"
                      className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="mt-8 flex items-center justify-between px-1">
          <h2 className="text-lg font-bold tracking-tight">Dina uppgifter</h2>
          {editing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setDraft(null)
                  setEditing(false)
                }}
                className="h-10 rounded-lg px-3 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Check className="size-4" />
                Spara
              </button>
            </div>
          ) : (
            <button
              onClick={startEditing}
              className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-[15px] font-semibold text-primary transition-colors hover:bg-muted"
            >
              <Pencil className="size-4" />
              Ändra
            </button>
          )}
        </div>

        {fieldGroups.map((group) => (
          <section key={group.title} aria-label={group.title} className="mt-3">
            <p className="mb-1.5 px-1 text-[13px] text-muted-foreground">{group.title}</p>
            <dl className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
              {group.fields.map(({ key, label }) => (
                <div
                  key={key}
                  className={
                    editing
                      ? "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      : "flex items-center justify-between gap-4 px-4 py-3.5"
                  }
                >
                  <dt className="shrink-0 text-[15px] text-muted-foreground">{label}</dt>
                  <dd className="min-w-0">{renderField(key)}</dd>
                </div>
              ))}
            </dl>
            {group.note && (
              <p className="mt-1.5 px-1 text-[13px] text-muted-foreground">{group.note}</p>
            )}
          </section>
        ))}

        <button
          onClick={handleSignOut}
          className="mt-10 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-destructive transition-colors hover:bg-destructive/5"
        >
          <LogOut className="size-4" />
          Logga ut
        </button>
      </div>
    </div>
  )
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return <span className="block truncate text-right text-[15px] font-medium">{children}</span>
}

function maskPersonnummer(pnr?: string) {
  const digits = (pnr ?? "").replace(/\D/g, "")
  if (digits.length < 8) return "Saknas"
  return `${digits.slice(0, 8)}-••••`
}

/** The active Movingo card, drawn as a card, with how long it stays valid. */
export function MovingoCardView({ card, onDelete }: { card: MovingoCard; onDelete: () => void }) {
  const left = daysLeft(card.expiryDate)
  const soon = left <= 5

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold">{MOVINGO_CARD_LABELS[card.cardType]}</p>
          <p className="mt-0.5 font-mono text-[13px] tracking-wider opacity-80">{card.movingoId}</p>
        </div>
        <button
          onClick={onDelete}
          aria-label="Ta bort kortet"
          className="-mt-2 -mr-2 flex size-11 items-center justify-center rounded-full opacity-70 transition-opacity hover:bg-white/10 hover:opacity-100"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <p className="mt-6 text-[34px] leading-none font-extrabold tracking-tight tabular-nums">
        {left === 0 ? "Sista dagen" : left === 1 ? "1 dag kvar" : `${left} dagar kvar`}
      </p>
      <p className="mt-2 text-[13px] tabular-nums opacity-80">
        {formatDate(card.purchaseDate)} till {formatDate(card.expiryDate)}, {card.price} kr
      </p>
      {soon && (
        <p className="mt-4 rounded-xl bg-white/12 px-3 py-2 text-[13px] leading-snug">
          Lägg in ditt nya kort när du förnyar, så fortsätter vi kräva åt dig.
        </p>
      )}
    </div>
  )
}

function AddMovingoCardForm({
  onAdd,
  onCancel,
}: {
  onAdd: (card: Omit<MovingoCard, "cardId">) => void
  onCancel: () => void
}) {
  const [movingoId, setMovingoId] = useState("")
  const [cardType, setCardType] = useState<MovingoCardType>("movingo-30")
  const [price, setPrice] = useState("3600")
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [touched, setTouched] = useState(false)

  const movingoIdError = touched && movingoId.length > 0 ? getMovingoIdError(movingoId) : null
  const isValid = isValidMovingoId(movingoId) && price && purchaseDate

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
      price: Number(price),
      purchaseDate,
      expiryDate: expiryFromType(cardType, purchaseDate),
    })
  }

  return (
    <div className="animate-fade-up rounded-2xl bg-card p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Nytt kort</h3>
        <button
          onClick={onCancel}
          className="flex btn-icon-touch items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-5 sm:size-4" />
        </button>
      </div>

      <div className="space-y-4">
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
            className={`input-mobile rounded-lg border bg-background px-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground ${
              movingoIdError ? "border-destructive" : "border-input"
            }`}
          />
          {movingoIdError && (
            <p className="text-xs text-destructive">{movingoIdError}</p>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Korttyp
          </span>
          <select
            value={cardType}
            onChange={(e) => setCardType(e.target.value as MovingoCardType)}
            className="input-mobile rounded-lg border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-foreground"
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
            className="input-mobile rounded-lg border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-foreground"
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
            className="input-mobile rounded-lg border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-foreground"
          />
        </label>

        <Button
          className="h-14 w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground hover:bg-primary/90"
          onClick={handleSubmit}
          disabled={!isValid}
        >
          Spara kort
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Endast Movingo i Mälardalstrafiks app på SJ-sträckor.{" "}
        <a href="/om?request=other-routes" className="underline underline-offset-2 hover:no-underline" target="_blank">
          Önska fler
        </a>
      </p>
    </div>
  )
}
