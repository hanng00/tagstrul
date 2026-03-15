import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { z } from 'zod';
import { putRoute, userId } from '../../repository.ts';
import { created, badRequest, internalServerError } from '../../utils/response.ts';
import { getStationByName, normalizeStationName } from '../../data/stations.ts';

const lambda = new LambdaClient({});
const POLL_USER_ROUTES_ARN = process.env.POLL_USER_ROUTES_ARN;

const schema = z.object({
  fromStation: z.string().min(1),
  toStation: z.string().min(1),
  departureTime: z.string().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const fromStation = getStationByName(body.data.fromStation);
    const toStation = getStationByName(body.data.toStation);

    if (!fromStation) return badRequest(`Invalid station: ${body.data.fromStation}`);
    if (!toStation) return badRequest(`Invalid station: ${body.data.toStation}`);

    const routeId = crypto.randomUUID();
    const route = {
      routeId,
      fromStation: fromStation.name,
      fromStationUic: fromStation.uic,
      toStation: toStation.name,
      toStationUic: toStation.uic,
      departureTime: body.data.departureTime,
    };

    await putRoute(uid, route);

    if (POLL_USER_ROUTES_ARN) {
      lambda
        .send(
          new InvokeCommand({
            FunctionName: POLL_USER_ROUTES_ARN,
            InvocationType: 'Event',
            Payload: JSON.stringify({ userId: uid }),
          }),
        )
        .catch((err: Error) => console.error('[PostRoute] Failed to trigger poll:', err));
    }

    return created(route);
  } catch (error) {
    return internalServerError(error);
  }
};
