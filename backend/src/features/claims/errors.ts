export const SJ_ERROR_CODES = {
  INVALID_FORMAT: 'INVALID_FORMAT',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INVALID_TOKEN: 'INVALID_TOKEN',
  CLAIM_REJECTED: 'CLAIM_REJECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type SJErrorCode = (typeof SJ_ERROR_CODES)[keyof typeof SJ_ERROR_CODES];

export interface SJApiErrorDetails {
  code: SJErrorCode;
  message: string;
  statusCode: number;
  isRetryable: boolean;
  field?: string;
  sjErrorCode?: string;
}

export class SJApiError extends Error {
  public readonly code: SJErrorCode;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;
  public readonly field?: string;
  public readonly sjErrorCode?: string;

  constructor(details: SJApiErrorDetails) {
    super(details.message);
    this.name = 'SJApiError';
    this.code = details.code;
    this.statusCode = details.statusCode;
    this.isRetryable = details.isRetryable;
    this.field = details.field;
    this.sjErrorCode = details.sjErrorCode;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      field: this.field,
      retryable: this.isRetryable,
    };
  }
}

const SJ_ERROR_CODE_MAP: Record<string, { code: SJErrorCode; message: string; field?: string }> = {
  PERSONAL_IDENTITY_NUMBER_FORMAT: {
    code: SJ_ERROR_CODES.INVALID_FORMAT,
    message: 'Personnumret har fel format. Använd formatet ÅÅÅÅMMDD-XXXX.',
    field: 'personalNumber',
  },
  PERSONAL_IDENTITY_NUMBER_CHECKSUM: {
    code: SJ_ERROR_CODES.INVALID_FORMAT,
    message: 'Personnumret är ogiltigt. Kontrollera att du angett rätt siffror.',
    field: 'personalNumber',
  },
  SWISH_PHONE_NUMBER_FORMAT: {
    code: SJ_ERROR_CODES.INVALID_FORMAT,
    message: 'Swish-numret har fel format. Använd formatet 07XXXXXXXX.',
    field: 'swishPhone',
  },
  INVALID_COMMUTER_CARD: {
    code: SJ_ERROR_CODES.CLAIM_REJECTED,
    message: 'Ogiltigt periodkortsnummer.',
    field: 'movingoId',
  },
  NO_ELIGIBLE_JOURNEYS: {
    code: SJ_ERROR_CODES.CLAIM_REJECTED,
    message: 'Inga ersättningsberättigade resor hittades.',
  },
  TOKEN_EXPIRED: {
    code: SJ_ERROR_CODES.INVALID_TOKEN,
    message: 'Sessionen har gått ut. Starta om ansökan.',
  },
  TOKEN_INVALID: {
    code: SJ_ERROR_CODES.INVALID_TOKEN,
    message: 'Ogiltig session. Starta om ansökan.',
  },
};

export function parseSJErrorResponse(
  statusCode: number,
  responseBody: unknown,
): SJApiError {
  if (statusCode === 429) {
    return new SJApiError({
      code: SJ_ERROR_CODES.RATE_LIMITED,
      message: 'För många förfrågningar. Vänta en stund och försök igen.',
      statusCode,
      isRetryable: true,
    });
  }

  if (statusCode >= 500) {
    return new SJApiError({
      code: SJ_ERROR_CODES.SERVICE_UNAVAILABLE,
      message: 'SJ:s system är tillfälligt otillgängligt. Försök igen om några minuter.',
      statusCode,
      isRetryable: true,
    });
  }

  if (typeof responseBody === 'object' && responseBody !== null && 'errors' in responseBody) {
    const errors = (responseBody as { errors: Array<{ code: string; field?: string }> }).errors;
    const firstError = errors[0];

    if (firstError?.code) {
      const mapped = SJ_ERROR_CODE_MAP[firstError.code];
      if (mapped) {
        return new SJApiError({
          code: mapped.code,
          message: mapped.message,
          statusCode,
          isRetryable: false,
          field: mapped.field ?? firstError.field,
          sjErrorCode: firstError.code,
        });
      }

      return new SJApiError({
        code: SJ_ERROR_CODES.UNKNOWN,
        message: `Ett fel uppstod: ${firstError.code}`,
        statusCode,
        isRetryable: false,
        field: firstError.field,
        sjErrorCode: firstError.code,
      });
    }
  }

  return new SJApiError({
    code: SJ_ERROR_CODES.UNKNOWN,
    message: 'Ett oväntat fel uppstod. Försök igen.',
    statusCode,
    isRetryable: statusCode >= 500,
  });
}

export function createNetworkError(): SJApiError {
  return new SJApiError({
    code: SJ_ERROR_CODES.NETWORK_ERROR,
    message: 'Kunde inte ansluta till SJ. Kontrollera din internetanslutning.',
    statusCode: 0,
    isRetryable: true,
  });
}
