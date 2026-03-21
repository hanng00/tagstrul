import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  signIn as authSignIn,
  verifyOtp as authVerifyOtp,
  signOut as authSignOut,
  refreshSession,
  getStoredTokens,
  type AuthTokens,
  type AuthSession,
} from "@/lib/auth"
import { identifyUser, resetUser } from "@/lib/posthog"

const AUTH_QUERY_KEY = ["auth", "tokens"] as const

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function identifyFromTokens(tokens: AuthTokens | null) {
  if (!tokens) return
  const payload = parseJwtPayload(tokens.idToken)
  if (payload?.sub && typeof payload.sub === "string") {
    identifyUser(payload.sub, {
      email: payload.email as string | undefined,
    })
  }
}

async function fetchTokens(): Promise<AuthTokens | null> {
  const stored = getStoredTokens()

  if (stored) {
    const needsRefresh = stored.expiresAt < Date.now() + 5 * 60 * 1000
    if (!needsRefresh) {
      identifyFromTokens(stored)
      return stored
    }
  }

  const refreshed = await refreshSession()
  if (refreshed) {
    identifyFromTokens(refreshed)
  }
  return refreshed
}

function getRefetchInterval(tokens: AuthTokens | null): number | false {
  if (!tokens) return false
  const timeUntilRefresh = tokens.expiresAt - Date.now() - 5 * 60 * 1000
  return timeUntilRefresh > 0 ? timeUntilRefresh : false
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: tokens, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchTokens,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: (query) => getRefetchInterval(query.state.data ?? null),
  })

  const signInMutation = useMutation({
    mutationFn: authSignIn,
  })

  const verifyOtpMutation = useMutation({
    mutationFn: async ({
      session,
      otp,
    }: {
      session: AuthSession
      otp: string
    }) => authVerifyOtp(session, otp),
    onSuccess: (newTokens) => {
      identifyFromTokens(newTokens)
      queryClient.setQueryData(AUTH_QUERY_KEY, newTokens)
    },
  })

  const signOutMutation = useMutation({
    mutationFn: authSignOut,
    onSuccess: () => {
      resetUser()
      queryClient.clear()
    },
  })

  return {
    isAuthenticated: tokens !== null,
    isLoading,
    tokens: tokens ?? null,
    signIn: signInMutation.mutateAsync,
    verifyOtp: (session: AuthSession, otp: string) =>
      verifyOtpMutation.mutateAsync({ session, otp }),
    signOut: signOutMutation.mutateAsync,
  }
}
