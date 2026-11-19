export type Tram = {
  type: string;
  line: string;
  longitude: number;
  latitude: number;
  vehicleId: string | null;
  destination: string | null;
};

export type TramResponse = {
  count: number;
  trams: Tram[];
};

export type TramStop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type TramDeparture = {
  stopId: string;
  stopName: string;
  line: string;
  destination: string | null;
  expectedTime: string;
  scheduledTime: string;
  minutesUntil: number;
  delayMinutes: number;
};

export type TramDeparturesResponse = {
  stopName: string;
  currentTime: string | null;
  stops: TramStop[];
  count: number;
  departures: TramDeparture[];
};

export async function fetchTrams(): Promise<TramResponse> {
  const response = await fetch(
    "/api/trams"
  );

  if (!response.ok) {
    throw new Error(
      "Trammiandmete laadimine ebaõnnestus."
    );
  }

  return response.json();
}

export async function fetchTramDepartures(): Promise<TramDeparturesResponse> {
  const response = await fetch(
    "/api/tram-departures"
  );

  if (!response.ok) {
    throw new Error(
      "Trammide väljumiste laadimine ebaõnnestus."
    );
  }

  return response.json();
}