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

export async function fetchTrams(): Promise<TramResponse> {
  const response = await fetch("/api/trams");

  if (!response.ok) {
    throw new Error(
      "Trammiandmete laadimine ebaõnnestus."
    );
  }

  return response.json();
}