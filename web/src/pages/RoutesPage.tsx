import { useMemo, useState } from "react"
import type { Delay, Route } from "@/types"
import { Trash2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StationInput } from "@/components/StationInput"
import { useRoutes, useAddRoute, useDeleteRoute, useDelays } from "@/lib/queries"
import { events } from "@/lib/posthog"
import { TrainLoader } from "@/components/ui/train-loader"

export function RoutesPage() {
  const { data: routes = [], isLoading: loading } = useRoutes()
  const { data: delays = [] } = useDelays()
  const commutes = useMemo(() => groupCommutes(routes, delays), [routes, delays])
  const addRoute = useAddRoute()
  const deleteRoute = useDeleteRoute()
  const [showForm, setShowForm] = useState(false)

  function handleAdd(from: string, to: string, time: string) {
    addRoute.mutate(
      { fromStation: from, toStation: to, departureTime: time || undefined },
      {
        onSuccess: () => {
          setShowForm(false)
          events.routeAdded({
            fromStation: from,
            toStation: to,
            hasDepartureTime: !!time,
          })
        },
      },
    )
  }

  function handleDelete(routeId: string) {
    deleteRoute.mutate(routeId, {
      onSuccess: () => {
        events.routeDeleted({ routeId })
      },
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <TrainLoader size="md" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="app-padding pt-8">
        <h1 className="text-[34px] leading-[1.1] font-extrabold tracking-tight">Pendlingar</h1>
        <p className="mt-2 text-[17px] text-muted-foreground">
          Vi bevakar de här avgångarna och säger till när ett tåg blir sent.
        </p>
      </header>

      <div className="flex-1 app-padding pt-6 pb-8">
        {routes.length === 0 && !showForm && (
          <div className="animate-fade-in rounded-2xl bg-card px-5 py-8">
            <p className="text-[17px] font-semibold">Inga pendlingar ännu</p>
            <p className="mt-1 text-[15px] text-muted-foreground">
              Lägg till tåget du brukar ta så letar vi upp förseningar du kan få pengar för.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {commutes.map((commute) => (
            <CommuteCard
              key={commute.key}
              commute={commute}
              onDelete={handleDelete}
              deleting={deleteRoute.isPending}
            />
          ))}
        </div>

        {showForm ? (
          <AddRouteForm
            onAdd={handleAdd}
            onCancel={() => setShowForm(false)}
            isFirst={routes.length === 0}
            isPending={addRoute.isPending}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[17px] font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-5" />
            Lägg till pendling
          </button>
        )}
      </div>
    </div>
  )
}

interface Commute {
  key: string
  stations: [string, string]
  routes: Route[]
  lateThisMonth: number
  earnedThisMonth: number
}

/** Both directions between the same two stations belong to one commute. */
function groupCommutes(routes: Route[], delays: Delay[]): Commute[] {
  const month = new Date().toISOString().slice(0, 7)
  const groups = new Map<string, Commute>()
  for (const route of routes) {
    const stations = [route.fromStation, route.toStation].sort() as [string, string]
    const key = stations.join("|")
    const group =
      groups.get(key) ??
      { key, stations: [route.fromStation, route.toStation] as [string, string], routes: [], lateThisMonth: 0, earnedThisMonth: 0 }
    group.routes.push(route)
    groups.set(key, group)
  }
  for (const group of groups.values()) {
    const ids = new Set(group.routes.map((r) => r.routeId))
    const late = delays.filter(
      (d) => ids.has(d.routeId) && d.date.startsWith(month) && (d.claimable || d.claimed)
    )
    group.lateThisMonth = late.length
    group.earnedThisMonth = late.reduce((s, d) => s + d.estimatedCompensation, 0)
    group.routes.sort((a, b) => (a.departureTime ?? "99").localeCompare(b.departureTime ?? "99"))
  }
  return [...groups.values()]
}

function CommuteCard({
  commute,
  onDelete,
  deleting,
}: {
  commute: Commute
  onDelete: (routeId: string) => void
  deleting: boolean
}) {
  const monthName = new Date().toLocaleDateString("sv-SE", { month: "long" })
  return (
    <section className="animate-fade-up overflow-hidden rounded-2xl bg-card">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-lg font-bold tracking-tight">
          {commute.stations[0]} – {commute.stations[1]}
        </h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {commute.lateThisMonth === 0 ? (
            `Inga sena tåg i ${monthName} än`
          ) : (
            <>
              {commute.lateThisMonth === 1 ? "1 sent tåg" : `${commute.lateThisMonth} sena tåg`} i{" "}
              {monthName},{" "}
              <span className="font-semibold text-primary">{commute.earnedThisMonth} kr</span>
            </>
          )}
        </p>
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {commute.routes.map((route) => (
          <li key={route.routeId} className="flex items-center gap-3 py-1 pr-2 pl-4">
            <span className="w-14 shrink-0 text-base font-bold tabular-nums">
              {route.departureTime ?? "Alla"}
            </span>
            <span className="min-w-0 flex-1 truncate text-[15px]">mot {route.toStation}</span>
            <button
              onClick={() => onDelete(route.routeId)}
              disabled={deleting}
              aria-label={`Sluta bevaka ${route.departureTime ?? "alla avgångar"} mot ${route.toStation}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AddRouteForm({
  onAdd,
  onCancel,
  isFirst,
  isPending,
}: {
  onAdd: (from: string, to: string, time: string) => void
  onCancel: () => void
  isFirst: boolean
  isPending: boolean
}) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [time, setTime] = useState("")

  return (
    <div
      className={`animate-fade-up rounded-2xl bg-card p-4 sm:p-5 ${isFirst ? "" : "mt-4"}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Ny pendling</h2>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="flex btn-icon-touch items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <X className="size-5 sm:size-4" />
        </button>
      </div>

      <div className="space-y-4">
        <StationInput
          value={from}
          onChange={setFrom}
          placeholder="Stockholm C"
          label="Från"
          disabled={isPending}
        />

        <StationInput
          value={to}
          onChange={setTo}
          placeholder="Uppsala C"
          label="Till"
          disabled={isPending}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Vanlig avgångstid{" "}
            <span className="text-muted-foreground/50">(valfritt)</span>
          </span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={isPending}
            className="input-mobile rounded-lg border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground disabled:opacity-50"
          />
        </label>

        <Button
          className="h-14 w-full rounded-2xl bg-primary text-[17px] font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          onClick={() => onAdd(from, to, time)}
          disabled={!from || !to || isPending}
        >
          {isPending ? (
            <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
          ) : (
            "Spara pendling"
          )}
        </Button>
      </div>
    </div>
  )
}
