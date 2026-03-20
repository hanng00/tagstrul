import { useState, useEffect } from "react"
import { useSearchParams } from "react-router"
import {
  Users,
  Route,
  Clock,
  FileCheck,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  UserPlus,
} from "lucide-react"
import { publicRequest } from "@/lib/api-client"
import { TrainLoader } from "@/components/ui/train-loader"

interface AdminStats {
  users: {
    total: number
    withRoutes: number
    withMovingoCards: number
    withOnboardingComplete: number
  }
  routes: {
    total: number
    withDepartureTime: number
    topStations: { station: string; count: number }[]
  }
  delays: {
    total: number
    claimable: number
    claimed: number
    dismissed: number
    cancelled: number
    byDelayTier: {
      tier20to39: number
      tier40to59: number
      tier60plus: number
    }
  }
  claims: {
    total: number
    submitted: number
    approved: number
    rejected: number
    totalEstimatedCompensation: number
    totalActualCompensation: number
  }
  feedback: {
    total: number
    recent: { message: string; email?: string; createdAt: string }[]
  }
  recentUsers: {
    email: string
    createdAt: string
    hasRoutes: boolean
    hasMovingo: boolean
    onboardingComplete: boolean
  }[]
  generatedAt: string
}

const ADMIN_SECRET_KEY = "tagstrul_admin_secret"

export function AdminPage() {
  const [searchParams] = useSearchParams()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [secret, setSecret] = useState(() => {
    return searchParams.get("secret") || localStorage.getItem(ADMIN_SECRET_KEY) || ""
  })
  const [showFeedback, setShowFeedback] = useState(false)
  const [showStations, setShowStations] = useState(false)

  useEffect(() => {
    if (searchParams.get("secret")) {
      localStorage.setItem(ADMIN_SECRET_KEY, searchParams.get("secret")!)
    }
  }, [searchParams])

  async function fetchStats() {
    if (!secret) {
      setError("Admin secret required")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await publicRequest<AdminStats>(`/admin/stats?secret=${encodeURIComponent(secret)}`)
      setStats(data)
      localStorage.setItem(ADMIN_SECRET_KEY, secret)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (!secret && !loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-xl font-semibold text-foreground">Admin</h1>
          <input
            type="password"
            placeholder="Secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="input-mobile w-full rounded-lg border border-input bg-background px-3 text-foreground outline-none focus:border-foreground"
          />
          <button
            onClick={fetchStats}
            className="input-mobile w-full rounded-lg bg-foreground font-semibold text-background hover:bg-foreground/90"
          >
            Logga in
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <TrainLoader size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-4">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => {
            localStorage.removeItem(ADMIN_SECRET_KEY)
            setSecret("")
            setError(null)
          }}
          className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground"
        >
          Försök igen
        </button>
      </div>
    )
  }

  if (!stats) return null

  const onboardingRate = stats.users.total > 0
    ? Math.round((stats.users.withOnboardingComplete / stats.users.total) * 100)
    : 0

  return (
    <div className="min-h-svh bg-background">
      <header className="app-padding pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(stats.generatedAt).toLocaleString("sv-SE")}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex btn-icon-touch items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="app-padding pb-8 space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Användare" value={stats.users.total} />
          <StatCard icon={Route} label="Pendlingar" value={stats.routes.total} />
          <StatCard icon={Clock} label="Förseningar" value={stats.delays.total} />
          <StatCard icon={FileCheck} label="Krav" value={stats.claims.total} />
        </div>

        {/* User Funnel */}
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-foreground">Användartratt</h2>
          <div className="mt-3 space-y-2">
            <FunnelRow label="Registrerade" value={stats.users.total} max={stats.users.total} />
            <FunnelRow label="Movingo-kort" value={stats.users.withMovingoCards} max={stats.users.total} />
            <FunnelRow label="Pendling" value={stats.users.withRoutes} max={stats.users.total} />
            <FunnelRow label="Onboarding klar" value={stats.users.withOnboardingComplete} max={stats.users.total} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {onboardingRate}% slutför onboarding
          </p>
        </section>

        {/* Recent Users */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Senaste användare</h2>
          </div>
          {stats.recentUsers.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Inga användare ännu</p>
          ) : (
            <div className="mt-3 space-y-2">
              {stats.recentUsers.slice(0, 10).map((user, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("sv-SE") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {user.hasMovingo && <span className="text-foreground">M</span>}
                    {user.hasRoutes && <span className="text-foreground">R</span>}
                    {user.onboardingComplete && <span className="text-foreground">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Claims */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <FileCheck className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Krav</h2>
          </div>
          <div className="mt-3 space-y-1.5">
            <Row label="Inskickade" value={stats.claims.submitted} />
            <Row label="Godkända" value={stats.claims.approved} />
            <Row label="Avslagna" value={stats.claims.rejected} />
            <div className="my-2 border-t border-border" />
            <Row label="Uppskattat" value={`${stats.claims.totalEstimatedCompensation.toLocaleString("sv-SE")} kr`} />
            <Row label="Utbetalt" value={`${stats.claims.totalActualCompensation.toLocaleString("sv-SE")} kr`} muted={false} />
          </div>
        </section>

        {/* Delays */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium text-foreground">Förseningar</h2>
          </div>
          <div className="mt-3 space-y-1.5">
            <Row label="20–39 min" value={stats.delays.byDelayTier.tier20to39} />
            <Row label="40–59 min" value={stats.delays.byDelayTier.tier40to59} />
            <Row label="60+ min" value={stats.delays.byDelayTier.tier60plus} />
            <Row label="Inställda" value={stats.delays.cancelled} />
            <div className="my-2 border-t border-border" />
            <Row label="Krävda" value={stats.delays.claimed} />
            <Row label="Dolda" value={stats.delays.dismissed} />
          </div>
        </section>

        {/* Top Stations - Collapsible */}
        {stats.routes.topStations.length > 0 && (
          <section>
            <button
              onClick={() => setShowStations(!showStations)}
              className="flex w-full items-center justify-between py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Populära stationer
                </span>
              </div>
              {showStations ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            {showStations && (
              <div className="mt-2 rounded-xl border border-border bg-card p-4">
                <div className="space-y-1.5">
                  {stats.routes.topStations.map((s, i) => (
                    <Row key={s.station} label={`${i + 1}. ${s.station}`} value={s.count} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Feedback - Collapsible */}
        {stats.feedback.total > 0 && (
          <section>
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="flex w-full items-center justify-between py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Feedback ({stats.feedback.total})
                </span>
              </div>
              {showFeedback ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
            {showFeedback && (
              <div className="mt-2 space-y-2">
                {stats.feedback.recent.map((f, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-foreground">{f.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {f.email && `${f.email} · `}
                      {new Date(f.createdAt).toLocaleDateString("sv-SE")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
        {value.toLocaleString("sv-SE")}
      </p>
    </div>
  )
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground/70"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function Row({ label, value, muted = true }: { label: string; value: string | number; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${muted ? "text-foreground" : "font-medium text-foreground"}`}>
        {value}
      </span>
    </div>
  )
}
