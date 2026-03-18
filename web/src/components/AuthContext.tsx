import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
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

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  tokens: AuthTokens | null
  signIn: (email: string) => Promise<AuthSession>
  verifyOtp: (session: AuthSession, otp: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function initAuth() {
      const stored = getStoredTokens()
      if (stored) {
        if (stored.expiresAt < Date.now() + 5 * 60 * 1000) {
          const refreshed = await refreshSession()
          setTokens(refreshed)
          identifyFromTokens(refreshed)
        } else {
          setTokens(stored)
          identifyFromTokens(stored)
        }
      } else {
        const refreshed = await refreshSession()
        if (refreshed) {
          setTokens(refreshed)
          identifyFromTokens(refreshed)
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  useEffect(() => {
    if (!tokens) return

    const timeUntilRefresh = tokens.expiresAt - Date.now() - 5 * 60 * 1000
    if (timeUntilRefresh <= 0) return

    const timer = setTimeout(async () => {
      const refreshed = await refreshSession()
      setTokens(refreshed)
    }, timeUntilRefresh)

    return () => clearTimeout(timer)
  }, [tokens])

  const signIn = useCallback(async (email: string) => {
    return authSignIn(email)
  }, [])

  const verifyOtp = useCallback(async (session: AuthSession, otp: string) => {
    const newTokens = await authVerifyOtp(session, otp)
    setTokens(newTokens)
    identifyFromTokens(newTokens)
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    setTokens(null)
    resetUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: tokens !== null,
        isLoading,
        tokens,
        signIn,
        verifyOtp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
