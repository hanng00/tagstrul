import { useState } from "react"
import { Trash2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StationInput } from "@/components/StationInput"
import { useRoutes, useAddRoute, useDeleteRoute } from "@/lib/queries"
import { events } from "@/lib/posthog"
import { TrainLoader } from "@/components/ui/train-loader"

export function RoutesPage() {
  const { data: routes = [], isLoading: loading } = useRoutes()
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
      <header className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-semibold text-foreground">Pendlingar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vi bevakar dessa resor åt dig
        </p>
      </header>

      <div className="flex-1 px-5 pb-6">
        {routes.length > 0 && (
          <div className="space-y-2">
            {routes.map((route, i) => (
              <div
                key={route.routeId}
                className="animate-fade-up flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>{route.fromStation}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{route.toStation}</span>
                  </div>
                  {route.departureTime && (
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      Avgång {route.departureTime}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(route.routeId)}
                  disabled={deleteRoute.isPending}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {routes.length === 0 && !showForm && (
          <div className="animate-fade-in flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-foreground">
              Inga pendlingar ännu
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Lägg till din första för att börja bevaka
            </p>
          </div>
        )}

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
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            <Plus className="size-4" />
            Lägg till pendling
          </button>
        )}
      </div>
    </div>
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
      className={`animate-fade-up rounded-xl border border-border bg-card p-5 ${isFirst ? "" : "mt-3"}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Ny pendling</h2>
        <button
          onClick={onCancel}
          disabled={isPending}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <X className="size-4" />
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
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-foreground focus:ring-1 focus:ring-foreground disabled:opacity-50"
          />
        </label>

        <Button
          className="h-11 w-full rounded-lg bg-foreground text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50"
          onClick={() => onAdd(from, to, time)}
          disabled={!from || !to || isPending}
        >
          {isPending ? (
            <div className="size-4 animate-spin rounded-full border-2 border-background/20 border-t-background" />
          ) : (
            "Spara pendling"
          )}
        </Button>
      </div>
    </div>
  )
}
