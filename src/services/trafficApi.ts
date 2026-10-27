const API_URL =
  "https://tarktee.transpordiamet.ee/tarktee/rest/services/traffic_detectors/MapServer/0/query";

export async function getTrafficDetectors() {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });

  const response = await fetch(`${API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Liiklusandmete laadimine ebaõnnestus");
  }

  return response.json();
}