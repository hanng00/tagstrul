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
import { MOVINGO_CARD_LABELS } from "@/types"
import { PersonnummerInput } from "@/components/ui-extended/personnummer-input"
import { PhoneInput, formatPhone, getPhoneDigits } from "@/components/ui-extended/phone-input"
import { PageHeader } from "@/components/AppLayout"

const profileFields = [
  { key: "firstName" as const, label: "Förnamn" },
  { key: "lastName" as const, label: "Efternamn" },
  { key: "personalNumber" as const, label: "Personnummer" },
  { key: "email" as const, label: "E-post" },
  { key: "phone" as const, label: "Telefon" },
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

  const displayProfile = editing && draft ? draft : profile
  const activeCards = cards.filter((c) => !isExpired(c))
  const expiredCards = cards.filter((c) => isExpired(c))

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
              {(profile.firstName?.[0] ?? "").toUpperCase()}
              {(profile.lastName?.[0] ?? "").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={startEditing}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-auto sm:px-0"
            >
              <Pencil className="size-3.5 sm:size-3" />
              <span className="hidden sm:inline">Redigera</span>
            </button>
          )}
        </div>
      </PageHeader>

      <div className="flex-1 app-padding pb-6">
        <section className="animate-fade-up">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Uppgifter</h2>
            {editing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setDraft(null)
                    setEditing(false)
                  }}
                  className="flex btn-icon-touch items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-5 sm:size-4" />
                </button>
                <button
                  onClick={handleSave}
                  className="flex h-10 items-center gap-1 rounded-lg bg-foreground px-4 text-xs font-medium text-background sm:h-auto sm:px-3 sm:py-1.5"
                >
                  <Check className="size-4 sm:size-3" />
                  Spara
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {profileFields.map(({ key, label }) => (
              <div
                key={key}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                {editing && draft ? (
                  key === "phone" ? (
                    <PhoneInput
                      value={draft[key] ?? ""}
                      onChange={(value) => setDraft({ ...draft, [key]: value })}
                      className="h-12 w-full text-base sm:h-auto sm:w-1/2 sm:text-right sm:text-sm"
                    />
                  ) : key === "personalNumber" ? (
                    <PersonnummerInput
                      value={draft[key] ?? ""}
                      onChange={(value) => setDraft({ ...draft, [key]: value })}
                      className="h-12 w-full text-base sm:h-auto sm:w-1/2 sm:text-right sm:text-sm"
                    />
                  ) : (
                    <input
                      value={draft[key] ?? ""}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.value })
                      }
                      className="h-12 w-full rounded-md border border-input bg-background px-3 text-base text-foreground outline-none transition-colors focus:border-foreground sm:h-auto sm:w-1/2 sm:px-2.5 sm:py-1.5 sm:text-right sm:text-sm"
                    />
                  )
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {displayProfile[key] || "—"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="animate-fade-up stagger-1 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Movingo-kort
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {activeCards.length} aktiv{activeCards.length !== 1 && "a"}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {activeCards.map((card) => (
              <MovingoCardRow
                key={card.cardId}
                card={card}
                onDelete={() => handleDeleteCard(card.cardId)}
              />
            ))}

            {activeCards.length === 0 && !showAddCard && (
              <div className="rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-4 py-4 text-center">
                <p className="text-sm font-medium text-destructive">
                  Inget aktivt kort
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Lägg till för att beräkna ersättning
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
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                <Plus className="size-4" />
                Lägg till kort
              </button>
            )}
          </div>

          {expiredCards.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Utgångna
              </p>
              <div className="space-y-1.5">
                {expiredCards.map((card) => (
                  <MovingoCardRow
                    key={card.cardId}
                    card={card}
                    expired
                    onDelete={() => handleDeleteCard(card.cardId)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="animate-fade-up stagger-2 mt-8">
          <h2 className="text-sm font-semibold text-foreground">Notiser</h2>
          <div className="mt-3 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {isSubscribed ? (
                  <Bell className="size-4 text-foreground" />
                ) : (
                  <BellOff className="size-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Förseningsnotiser
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {permission === "unsupported"
                      ? "Stöds ej i denna webbläsare"
                      : permission === "denied"
                        ? "Blockerade i webbläsaren"
                        : isSubscribed
                          ? "Aktiva — du får notiser vid förseningar"
                          : "Få notis när ditt tåg är försenat"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSubscribed && (
                  <button
                    onClick={sendTestNotification}
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Testa
                  </button>
                )}
                {canSubscribe && (
                  <button
                    onClick={isSubscribed ? unsubscribe : subscribe}
                    disabled={pushLoading}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSubscribed
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    } disabled:opacity-50`}
                  >
                    {pushLoading
                      ? "..."
                      : isSubscribed
                        ? "Stäng av"
                        : "Aktivera"}
                  </button>
                )}
              </div>
            </div>
            {!isSubscribed && canSubscribe && (
              <div className="border-t border-border px-4 py-3">
                <button
                  onClick={async () => {
                    const success = await subscribe()
                    if (success) {
                      sendTestNotification()
                    }
                  }}
                  disabled={pushLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground/5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50"
                >
                  <Bell className="size-4" />
                  Prova en testnotis
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="mt-12">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
          >
            <LogOut className="size-4" />
            Logga ut
          </button>
        </div>
      </div>
    </div>
  )
}

function MovingoCardRow({
  card,
  expired,
  onDelete,
}: {
  card: MovingoCard
  expired?: boolean
  onDelete: () => void
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 sm:py-3 ${
        expired
          ? "border-border/50 bg-muted/30 opacity-50"
          : "border-border bg-card"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {MOVINGO_CARD_LABELS[card.cardType]}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {card.price} kr · {formatDate(card.purchaseDate)} —{" "}
          {formatDate(card.expiryDate)}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="flex btn-icon-touch shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-4 sm:size-3.5" />
      </button>
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

  function expiryFromType(type: MovingoCardType, start: string): string {
    const d = new Date(start)
    if (type === "movingo-year") d.setFullYear(d.getFullYear() + 1)
    else if (type === "movingo-90") d.setDate(d.getDate() + 90)
    else d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  }

  return (
    <div className="animate-fade-up rounded-xl border border-border bg-card p-4 sm:p-5">
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
            Movingo-nummer
          </span>
          <input
            type="text"
            value={movingoId}
            onChange={(e) => setMovingoId(e.target.value)}
            placeholder="ABCD1E234"
            className="input-mobile rounded-lg border border-input bg-background px-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
          />
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
          className="input-mobile w-full rounded-lg bg-foreground font-semibold text-background hover:bg-foreground/90"
          onClick={() =>
            onAdd({
              movingoId: movingoId.trim(),
              cardType,
              price: Number(price),
              purchaseDate,
              expiryDate: expiryFromType(cardType, purchaseDate),
            })
          }
          disabled={!movingoId.trim() || !price || !purchaseDate}
        >
          Spara kort
        </Button>
      </div>
    </div>
  )
}
