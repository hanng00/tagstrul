import { useState } from "react"
import { useNavigate } from "react-router"
import { LogOut, Pencil, Check, X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/AuthContext"
import {
  useProfile,
  useMovingoCards,
  useUpdateProfile,
  useAddMovingoCard,
  useDeleteMovingoCard,
} from "@/lib/queries"
import type { Profile, MovingoCard, MovingoCardType } from "@/types"
import { MOVINGO_CARD_LABELS } from "@/types"

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

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Profile | null>(null)
  const [showAddCard, setShowAddCard] = useState(false)

  const loading = profileLoading || cardsLoading

  function startEditing() {
    setDraft(profile ?? null)
    setEditing(true)
  }

  async function handleSignOut() {
    await signOut()
    navigate("/", { replace: true })
  }

  function handleSave() {
    if (!draft) return
    updateProfile.mutate(draft, {
      onSuccess: () => setEditing(false),
    })
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
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
      </div>
    )
  }

  const displayProfile = editing && draft ? draft : profile
  const activeCards = cards.filter((c) => !isExpired(c))
  const expiredCards = cards.filter((c) => isExpired(c))

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
              {(profile.firstName?.[0] ?? "").toUpperCase()}
              {(profile.lastName?.[0] ?? "").toUpperCase()}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil className="size-3" />
              Redigera
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 px-5 pb-6">
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
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                >
                  <Check className="size-3" />
                  Spara
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {profileFields.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                {editing && draft ? (
                  <input
                    value={draft[key] ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: e.target.value })
                    }
                    className="w-1/2 rounded-md border border-input bg-background px-2.5 py-1.5 text-right text-sm text-foreground outline-none transition-colors focus:border-foreground"
                  />
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
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        expired
          ? "border-border/50 bg-muted/30 opacity-50"
          : "border-border bg-card"
      }`}
    >
      <div>
        <p className="text-sm font-medium text-foreground">
          {MOVINGO_CARD_LABELS[card.cardType]}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {card.price} kr · {formatDate(card.purchaseDate)} —{" "}
          {formatDate(card.expiryDate)}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
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
    <div className="animate-fade-up rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Nytt kort</h3>
        <button
          onClick={onCancel}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
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
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Korttyp
          </span>
          <select
            value={cardType}
            onChange={(e) => setCardType(e.target.value as MovingoCardType)}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
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
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
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
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
          />
        </label>

        <Button
          className="h-11 w-full rounded-lg bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
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
