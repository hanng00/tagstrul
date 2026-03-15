const BASE_URL = 'https://prod-api.adp.sj.se/public/delay-compensation/v1';
const OCP_API_KEY = '78e7aad0e7b042b685d70e0131d897ca';

const BROWSER_HEADERS = {
  accept: '*/*',
  'accept-language': 'sv',
  origin: 'https://www.sj.se',
  referer: 'https://www.sj.se/',
  'x-client-name': 'sjse-delay-compensation-client',
  'x-client-version': '20250508.0003-prod',
  'x-api.sj.se-language': 'sv',
  'ocp-apim-subscription-key': OCP_API_KEY,
};

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

async function handleApiError(response: Response, endpoint: string, payload?: unknown): Promise<never> {
  let errorDetails = '';
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      errorDetails = ` | Response: ${JSON.stringify(json)}`;
    } catch {
      errorDetails = ` | Response: ${text}`;
    }
  } catch {
    // ignore
  }
  const payloadInfo = payload ? ` | Payload: ${JSON.stringify(payload)}` : '';
  throw new Error(`SJ API Error: ${response.status} ${response.statusText} | Endpoint: ${endpoint}${payloadInfo}${errorDetails}`);
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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { ...BROWSER_HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await handleApiError(response, endpoint, body);
  }

  const data = (await response.json()) as TokenResponse;
  return data.delayCompensationToken;
}

export async function submitTravelDetails(
  token: string,
  details: TravelDetails,
): Promise<{ token: string; ticketCompensation: boolean }> {
  const endpoint = `${BASE_URL}/compensation/${token}/traveldetails`;

  const boundary = `----WebKitFormBoundary${Math.random().toString(36).slice(2)}`;
  const bodyParts = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="data"; filename="blob"',
    'Content-Type: application/json',
    '',
    JSON.stringify(details),
    `--${boundary}--`,
  ];
  const body = bodyParts.join('\r\n');

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      ...BROWSER_HEADERS,
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    await handleApiError(response, endpoint, details);
  }

  const data = (await response.json()) as TravelDetailsResponse;
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

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: { ...BROWSER_HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify(contact),
  });

  if (!response.ok) {
    await handleApiError(response, endpoint, contact);
  }

  const data = (await response.json()) as { delayCompensationToken: string };
  return data.delayCompensationToken;
}

export async function submitBankDetails(
  token: string,
  bank: BankDetails,
): Promise<string> {
  const endpoint = `${BASE_URL}/compensation/bankaccountrecords`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { ...BROWSER_HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify(bank),
  });

  if (!response.ok) {
    await handleApiError(response, endpoint, bank);
  }

  const data = (await response.json()) as BankDetailsResponse;
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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { ...BROWSER_HEADERS, 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await handleApiError(response, endpoint, payload);
  }

  const data = (await response.json()) as ConfirmationResponse;
  return data.ticketCompensationServiceRequests[0] ?? '';
}

export const MOVINGO_CARD_TYPE_LABELS: Record<string, string> = {
  'movingo-30': 'Movingo 30 dgr på SJ kort',
  'movingo-90': 'Movingo 90 dgr på SJ kort',
  'movingo-year': 'Movingo År på SJ kort',
  'movingo-5-30': 'Movingo 5/30 på SJ kort',
};
