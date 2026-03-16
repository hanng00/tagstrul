import webpush from 'web-push';
import type { PushSubscription } from '../../types.ts';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@tagstrul.se';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface DelayNotification {
  title: string;
  body: string;
  data: {
    delayId: string;
    url: string;
  };
}

export async function sendPushNotification(
  subscription: PushSubscription,
  notification: DelayNotification,
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(notification),
    );
    return true;
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('[Push] Subscription expired or invalid:', subscription.endpoint.slice(-20));
      return false;
    }
    console.error('[Push] Failed to send notification:', error.message);
    return false;
  }
}

export function formatDelayNotification(delay: {
  delayId: string;
  fromStation: string;
  toStation: string;
  delayMinutes: number;
  cancelled: boolean;
  estimatedCompensation: number;
}): DelayNotification {
  const { fromStation, toStation, delayMinutes, cancelled, estimatedCompensation, delayId } = delay;

  const title = cancelled
    ? `🚫 Ditt tåg är inställt`
    : `🚂 Ditt tåg är ${delayMinutes} min försenat`;

  const compensation = estimatedCompensation > 0 
    ? `Du kan ha rätt till ${estimatedCompensation} kr ersättning.`
    : '';

  const body = cancelled
    ? `${fromStation} → ${toStation} är inställt. ${compensation}`
    : `${fromStation} → ${toStation}. ${compensation}`;

  return {
    title,
    body: body.trim(),
    data: {
      delayId,
      url: `/app/claim/${delayId}`,
    },
  };
}
