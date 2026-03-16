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

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  tokens: AuthTokens | null
  signIn: (email: string) => Promise<AuthSession>
  verifyOtp: (session: AuthSession, otp: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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
        } else {
          setTokens(stored)
        }
      } else {
        // Tokens expired or near-expiry - try to refresh using refresh token
        const refreshed = await refreshSession()
        if (refreshed) {
          setTokens(refreshed)
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
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    setTokens(null)
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
