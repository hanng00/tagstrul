import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { putRoute, userId } from '../../repository.ts';
import { created, badRequest, internalServerError } from '../../utils/response.ts';
import { getStationByName } from '../../data/stations.ts';

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
    return created(route);
  } catch (error) {
    return internalServerError(error);
  }
};
