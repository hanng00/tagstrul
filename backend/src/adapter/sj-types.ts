export type DepartureConnection = {
  trainNumber: string;
  operator: string;
  currentDateTime: string;
  originalDateTime: string;
  departureDate: string;
  station: string;
  currentTrack: string;
  originalTrack: string | null;
  transportType: string;
  informationOwner: string;
  cancelled: boolean;
  delayed: boolean;
  markDelayed: boolean;
  changedTrack: boolean;
  arrived: boolean;
  departed: boolean;
  awaitingTime: boolean;
  remarks: { id: string; level: number; information: string }[];
  xodRemarks: {
    id: number;
    editedDate: string;
    fromDate: string;
    toDate: string;
    header: string;
    content: string;
    contentFormat: string;
    tags: string[];
  }[];
};

export type FilteredConnectionsResponse = {
  locationId: string;
  locationName: string;
  arrivalConnections: unknown[];
  arrivalConnectionsUpdatedDateTime: string | null;
  departureConnections: DepartureConnection[];
};

export type SJLocation = {
  id: string;
  name: string;
};
