import { SJApiError, parseSJErrorResponse, createNetworkError } from '../features/claims/errors.ts';

const BASE_URL = 'https://prod-api.adp.sj.se/public/delay-compensation/v1';
const OCP_API_KEY = '78e7aad0e7b042b685d70e0131d897ca';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0',
];

const SEC_CH_UA_OPTIONS = [
  { ua: '"Chromium";v="145", "Google Chrome";v="145", "Not-A.Brand";v="99"', mobile: '?0', platform: '"Windows"' },
  { ua: '"Chromium";v="145", "Google Chrome";v="145", "Not-A.Brand";v="99"', mobile: '?0', platform: '"macOS"' },
  { ua: '"Chromium";v="145", "Google Chrome";v="145", "Not-A.Brand";v="99"', mobile: '?1', platform: '"Android"' },
  { ua: '"Not:A-Brand";v="99", "Brave";v="145", "Chromium";v="145"', mobile: '?0', platform: '"Windows"' },
  { ua: '"Not:A-Brand";v="99", "Brave";v="145", "Chromium";v="145"', mobile: '?1', platform: '"Android"' },
  { ua: '"Microsoft Edge";v="145", "Chromium";v="145", "Not-A.Brand";v="99"', mobile: '?0', platform: '"Windows"' },
];

function generateTraceId(): string {
  const hex = () => Math.random().toString(16).slice(2, 10);
  return `${hex()}${hex()}${hex()}${hex()}`;
}

function generateSpanId(): string {
  return Math.random().toString(16).slice(2, 18);
}

function getBrowserHeaders(): Record<string, string> {
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const secChUa = SEC_CH_UA_OPTIONS[Math.floor(Math.random() * SEC_CH_UA_OPTIONS.length)];
  
  return {
    'accept': '*/*',
    'accept-language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
    'content-type': 'application/json; charset=UTF-8',
    'ocp-apim-subscription-key': OCP_API_KEY,
    'origin': 'https://www.sj.se',
    'priority': 'u=1, i',
    'referer': 'https://www.sj.se/',
    'request-id': `|${traceId}.${spanId}`,
    'sec-ch-ua': secChUa.ua,
    'sec-ch-ua-mobile': secChUa.mobile,
    'sec-ch-ua-platform': secChUa.platform,
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'sec-gpc': '1',
    'traceparent': `00-${traceId}-${spanId}-01`,
    'user-agent': userAgent,
    'x-api.sj.se-language': 'sv',
    'x-client-name': 'sjse-delay-compensation-client',
    'x-client-version': 'PLACEHOLDER_VERSION',
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { rawText: text };
    }
  } catch {
    return null;
  }
}

interface FetchOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

async function fetchWithRetry<T>(
  endpoint: string,
  options: FetchOptions,
  payload?: unknown
): Promise<T> {
  let lastError: SJApiError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[SJ API] Retry attempt ${attempt}/${MAX_RETRIES} after ${delay}ms`);
        await sleep(delay);
      }

      const response = await fetch(endpoint, options);

      if (response.ok) {
        return (await response.json()) as T;
      }

      const responseBody = await parseResponseBody(response);
      const error = parseSJErrorResponse(response.status, responseBody, endpoint);

      console.error(`[SJ API] Error on attempt ${attempt + 1}:`, {
        endpoint,
        status: response.status,
        code: error.code,
        message: error.message,
        retryable: error.isRetryable,
        payload: payload ? JSON.stringify(payload) : undefined,
      });

      if (!error.isRetryable || attempt === MAX_RETRIES) {
        throw error;
      }

      lastError = error;
    } catch (error) {
      if (error instanceof SJApiError) {
        throw error;
      }

      const networkError = createNetworkError(error);
      console.error(`[SJ API] Network error on attempt ${attempt + 1}:`, {
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (attempt === MAX_RETRIES) {
        throw networkError;
      }

      lastError = networkError;
    }
  }

  throw lastError ?? createNetworkError(new Error('Max retries exceeded'));
}

export interface SJLocation {
  id: string;
  name: string;
}

export interface ContactInfo {
  emailAddress: string;
  mobilePhoneNumber: string;
  personName: {
    firstName: string;
    lastName: string;
  };
}

export interface TravelDetails {
  journeyDetail: {
    departureLocation: SJLocation;
    arrivalLocation: SJLocation;
    journeyDate: { date: string };
    journeyTime: { time: string };
    trainNumber: string;
  };
  expenses: unknown[];
}

export interface BankDetails {
  personalIdentityNumber: string;
  swishPhoneNumber: string;
}

interface TokenResponse {
  delayCompensationToken: string;
  existingServiceRequests: unknown[];
  eligibleOrderItems: unknown[];
}

interface TravelDetailsResponse {
  delayCompensationToken: string;
  bankAccountInfoRequirement: {
    requirementReason: string[];
    ticketCompensation: boolean;
    expensesCompensation: boolean;
  };
}

interface BankDetailsResponse {
  barId: string;
}

interface ConfirmationResponse {
  ticketCompensationServiceRequests: string[];
  expenseCompensationServiceRequests: string[];
  expenseServiceRequestCreationFailed: boolean;
}

export async function getDelayCompensationToken(
  movingoId: string,
  cardType: string,
): Promise<string> {
  const endpoint = `${BASE_URL}/compensation/delaycompensationtokens`;
  const body = {
    orderOrTicketNumber: '',
    orderSecurity: '',
    commuterCardType: cardType,
    commuterCardNumber: movingoId,
  };

  const data = await fetchWithRetry<TokenResponse>(
    endpoint,
    {
      method: 'POST',
      headers: getBrowserHeaders(),
      body: JSON.stringify(body),
    },
    body
  );

  return data.delayCompensationToken;
}

export async function submitTravelDetails(
  token: string,
  details: TravelDetails,
): Promise<{ token: string; ticketCompensation: boolean }> {
  const endpoint = `${BASE_URL}/compensation/${token}/traveldetails`;

  const boundaryId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const boundary = `----WebKitFormBoundary${boundaryId}`;
  
  const body = 
    `------WebKitFormBoundary${boundaryId}\r\n` +
    `Content-Disposition: form-data; name="data"; filename="blob"\r\n` +
    `Content-Type: application/json\r\n` +
    `\r\n` +
    `${JSON.stringify(details)}\r\n` +
    `------WebKitFormBoundary${boundaryId}--\r\n`;

  const headers = getBrowserHeaders();
  headers['content-type'] = `multipart/form-data; boundary=${boundary}`;

  const data = await fetchWithRetry<TravelDetailsResponse>(
    endpoint,
    { method: 'PUT', headers, body },
    details
  );

  return {
    token: data.delayCompensationToken,
    ticketCompensation: data.bankAccountInfoRequirement.ticketCompensation,
  };
}

export async function submitContactInfo(
  token: string,
  contact: ContactInfo,
): Promise<string> {
  const endpoint = `${BASE_URL}/compensation/${token}/contactinformation`;

  const data = await fetchWithRetry<{ delayCompensationToken: string }>(
    endpoint,
    {
      method: 'PUT',
      headers: getBrowserHeaders(),
      body: JSON.stringify(contact),
    },
    contact
  );

  return data.delayCompensationToken;
}

export async function submitBankDetails(
  token: string,
  bank: BankDetails,
): Promise<string> {
  const endpoint = `${BASE_URL}/compensation/bankaccountrecords`;

  const data = await fetchWithRetry<BankDetailsResponse>(
    endpoint,
    {
      method: 'POST',
      headers: getBrowserHeaders(),
      body: JSON.stringify(bank),
    },
    bank
  );

  return data.barId;
}

export async function confirmClaim(
  token: string,
  barId: string,
): Promise<string> {
  const endpoint = `${BASE_URL}/compensation/${token}/confirmations`;
  const payload = {
    paynovaBarIds: {
      ticketCompensation: barId,
    },
  };

  const data = await fetchWithRetry<ConfirmationResponse>(
    endpoint,
    {
      method: 'POST',
      headers: getBrowserHeaders(),
      body: JSON.stringify(payload),
    },
    payload
  );

  return data.ticketCompensationServiceRequests[0] ?? '';
}

export const MOVINGO_CARD_TYPE_LABELS: Record<string, string> = {
  'movingo-30': 'Movingo 30 dgr på SJ kort',
  'movingo-90': 'Movingo 90 dgr på SJ kort',
  'movingo-year': 'Movingo År på SJ kort',
  'movingo-5-30': 'Movingo 5/30 på SJ kort',
};
