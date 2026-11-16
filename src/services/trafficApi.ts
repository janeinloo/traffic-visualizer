export type DatexDirection = {
  siteReferenceId: string;
  direction: number | null;
  lanes: number | null;
  measurementTime: string | null;
  speed: number | null;
  flow: number | null;
  measurementPeriodSeconds: number | null;
};

export type DatexTrafficPoint = {
  id: string;
  name: string | null;
  latitude: number;
  longitude: number;
  directions: Record<string, DatexDirection>;
  hasTrafficData: boolean;
  activeDirectionCount: number;
  totalFlow: number | null;
  averageSpeed: number | null;
  latestMeasurementTime: string | null;
};

export type DatexTrafficMapResponse = {
  sitesPublicationTime: string | null;
  trafficPublicationTime: string | null;
  siteCount: number;
  activeSiteCount: number;
  measurementCount: number;
  points: DatexTrafficPoint[];
};

export async function fetchTrafficMap(): Promise<DatexTrafficMapResponse> {
  const response = await fetch("/api/traffic-map");

  if (!response.ok) {
    throw new Error(
      "DATEX kaardiandmete laadimine ebaõnnestus."
    );
  }

  return response.json();
}