import { getIdToken } from "@/lib/auth"

const API_BASE = import.meta.env.VITE_API_URL || ""

export interface StructuredError {
  code: string
  message: string
  field?: string
  retryable: boolean
}

export class ApiError extends Error {
  public readonly code: string
  public readonly field?: string
  public readonly retryable: boolean
  public readonly statusCode: number

  constructor(
    message: string,
    code: string,
    retryable: boolean,
    statusCode: number,
    field?: string
  ) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.retryable = retryable
    this.statusCode = statusCode
    this.field = field
  }
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const body = await response.json()
    if (body.error && typeof body.error === "object") {
      const err = body.error as StructuredError
      return new ApiError(
        err.message || `API error: ${response.status}`,
        err.code || "UNKNOWN",
        err.retryable ?? false,
        response.status,
        err.field
      )
    }
    if (body.error && typeof body.error === "string") {
      return new ApiError(body.error, "UNKNOWN", false, response.status)
    }
  } catch {
    // Failed to parse JSON
  }
  return new ApiError(`API error: ${response.status}`, "UNKNOWN", false, response.status)
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getIdToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = token
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  return response.json()
}

export async function publicRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  return response.json()
}
