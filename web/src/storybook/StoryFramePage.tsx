import { useState, type ReactNode } from "react"
import { useParams, useSearchParams } from "react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Helmet } from "react-helmet-async"
import { queryKeys } from "@/lib/queries"
import { AppChrome } from "@/components/AppLayout"
import { HomePage } from "@/pages/HomePage"
import { ClaimAllPage } from "@/pages/ClaimAllPage"
import { ClaimPage } from "@/pages/ClaimPage"
import { RoutesPage } from "@/pages/RoutesPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { profile, scenarios, type ScenarioId } from "./fixtures"

const screens: Record<string, { tab: string; render: () => ReactNode }> = {
  home: { tab: "/app", render: () => <HomePage /> },
  "claim-all": { tab: "/app", render: () => <ClaimAllPage /> },
  claim: { tab: "/app", render: () => <ClaimPage /> },
  routes: { tab: "/app/routes", render: () => <RoutesPage /> },
  profile: { tab: "/app/profile", render: () => <ProfilePage /> },
}

/** A query cache pre-filled with sample data, so real screens render without the API. */
function seededClient(scenarioId: ScenarioId) {
  const scenario = scenarios[scenarioId] ?? scenarios.inbox
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
  })
  client.setQueryData(["auth", "tokens"], {
    idToken: "storybook",
    accessToken: "storybook",
    refreshToken: "storybook",
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365,
  })
  client.setQueryData(queryKeys.delays, scenario.delays)
  client.setQueryData(queryKeys.claims, scenario.claims)
  client.setQueryData(queryKeys.routes, scenario.routes)
  client.setQueryData(queryKeys.movingoCards, scenario.cards)
  client.setQueryData(queryKeys.profile, profile)
  return client
}

/**
 * One app screen rendered with sample data, for the phone frames on /storybook.
 * Links are disabled so a click can't leave the preview.
 */
export function StoryFramePage() {
  const { screen = "home" } = useParams()
  const [params] = useSearchParams()
  const scenarioId = (params.get("scenario") ?? "inbox") as ScenarioId
  const [client] = useState(() => seededClient(scenarioId))
  const entry = screens[screen] ?? screens.home

  return (
    <QueryClientProvider client={client}>
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest("a")) e.preventDefault()
        }}
      >
        <AppChrome activeTab={entry.tab}>{entry.render()}</AppChrome>
      </div>
    </QueryClientProvider>
  )
}
