import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  GlobalSignOutCommand,
  type AuthenticationResultType,
} from "@aws-sdk/client-cognito-identity-provider"

const REGION = import.meta.env.VITE_AWS_REGION || "eu-north-1"
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || ""

const client = new CognitoIdentityProviderClient({ region: REGION })

export interface AuthTokens {
  idToken: string
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface AuthSession {
  session: string
  email: string
}

const TOKEN_KEY = "auth_tokens"

function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
}

function loadTokens(): AuthTokens | null {
  const stored = localStorage.getItem(TOKEN_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as AuthTokens
  } catch {
    return null
  }
}

function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem("id_token")
}

function authResultToTokens(result: AuthenticationResultType): AuthTokens {
  const tokens: AuthTokens = {
    idToken: result.IdToken!,
    accessToken: result.AccessToken!,
    refreshToken: result.RefreshToken!,
    expiresAt: Date.now() + (result.ExpiresIn ?? 3600) * 1000,
  }
  saveTokens(tokens)
  localStorage.setItem("id_token", tokens.idToken)
  return tokens
}

export async function signIn(email: string): Promise<AuthSession> {
  const command = new InitiateAuthCommand({
    AuthFlow: "USER_AUTH",
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PREFERRED_CHALLENGE: "EMAIL_OTP",
    },
  })

  try {
    const response = await client.send(command)

    if (response.ChallengeName === "EMAIL_OTP") {
      return {
        session: response.Session!,
        email,
      }
    }

    throw new Error(`Unexpected challenge: ${response.ChallengeName}`)
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "UserNotFoundException"
    ) {
      await signUp(email)
      return signIn(email)
    }
    throw error
  }
}

async function signUp(email: string): Promise<void> {
  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: generateTempPassword(),
    UserAttributes: [{ Name: "email", Value: email }],
  })

  await client.send(command)
}

function generateTempPassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
  let password = ""
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function verifyOtp(
  session: AuthSession,
  otp: string,
): Promise<AuthTokens> {
  const command = new RespondToAuthChallengeCommand({
    ClientId: CLIENT_ID,
    ChallengeName: "EMAIL_OTP",
    Session: session.session,
    ChallengeResponses: {
      USERNAME: session.email,
      EMAIL_OTP_CODE: otp,
    },
  })

  const response = await client.send(command)

  if (response.AuthenticationResult) {
    return authResultToTokens(response.AuthenticationResult)
  }

  throw new Error("Authentication failed")
}

export async function refreshSession(): Promise<AuthTokens | null> {
  const tokens = loadTokens()
  if (!tokens?.refreshToken) return null

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: tokens.refreshToken,
      },
    })

    const response = await client.send(command)

    if (response.AuthenticationResult) {
      const newTokens: AuthTokens = {
        idToken: response.AuthenticationResult.IdToken!,
        accessToken: response.AuthenticationResult.AccessToken!,
        refreshToken: tokens.refreshToken,
        expiresAt:
          Date.now() + (response.AuthenticationResult.ExpiresIn ?? 3600) * 1000,
      }
      saveTokens(newTokens)
      localStorage.setItem("id_token", newTokens.idToken)
      return newTokens
    }
  } catch {
    clearTokens()
  }

  return null
}

export async function signOut(): Promise<void> {
  const tokens = loadTokens()

  if (tokens?.accessToken) {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: tokens.accessToken,
      })
      await client.send(command)
    } catch {
      // Ignore errors during sign out
    }
  }

  clearTokens()
}

export function getStoredTokens(): AuthTokens | null {
  const tokens = loadTokens()
  if (!tokens) return null

  if (tokens.expiresAt < Date.now() + 60000) {
    return null
  }

  return tokens
}

export function isAuthenticated(): boolean {
  return getStoredTokens() !== null
}

export function getIdToken(): string | null {
  const tokens = getStoredTokens()
  return tokens?.idToken ?? null
}
