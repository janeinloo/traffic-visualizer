import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";
import { getTrafficDetectors } from "./services/trafficApi";
import proj4 from "proj4";
import type { TrafficFeature } from "./types/traffic";
import {
  formatMeasurementTime,
  formatSpeed,
  getDataAge,
  getFreshnessLabel,
  getHeavyTrafficPercentage,
  getTotalTraffic,
  calculateTrafficThresholds,
  getTrafficColor,
  getTrafficLevel,
  getTrafficRadius,
} from "./utils/traffic";

proj4.defs(
  "EPSG:3301",
  "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +units=m +no_defs"
);


function App() {
  const [trafficData, setTrafficData] = useState<TrafficFeature[]>([]);

  const trafficTotals = useMemo(() => {
    return trafficData.map((detector) =>
      getTotalTraffic(
        detector.properties.total_flow_forwards,
        detector.properties.total_flow_backwards
      )
    );
  }, [trafficData]);

  const trafficThresholds = useMemo(() => {
    return calculateTrafficThresholds(trafficTotals);
  }, [trafficTotals]);

  const maxTraffic = useMemo(() => {
    return Math.max(...trafficTotals, 0);
  }, [trafficTotals]);

  useEffect(() => {
  async function loadTrafficData() {
    try {
      const data = await getTrafficDetectors();

      console.log("Traffic data:", data);
      console.log(
        "First coordinates:",
        data.features[0]?.geometry?.coordinates
      );

      setTrafficData(data.features);
    } catch (error) {
      console.error("API error:", error);
    }
  }

  loadTrafficData();
}, []);

  return (
    <div className="h-screen w-screen bg-slate-100">
      <header className="flex h-16 items-center border-b border-slate-200 bg-white px-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Traffic Visualizer
        </h1>
      </header>

      <main className="relative h-[calc(100vh-4rem)]">
        <MapContainer
          center={[58.6, 25.0]}
          zoom={7}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {trafficData.map((detector, index) => {
            const [x, y] = detector.geometry.coordinates;

            const [longitude, latitude] = proj4(
              "EPSG:3301",
              "EPSG:4326",
              [x, y]
            );

            const {
              total_flow_forwards,
              total_flow_backwards,
              heavy_traffic_forwards,
              heavy_traffic_backwards,
            } = detector.properties;

            const totalTraffic =
              (total_flow_forwards ?? 0) +
              (total_flow_backwards ?? 0);

            const trafficLevel = getTrafficLevel(
              totalTraffic,
              trafficThresholds
            );

            const markerColor = getTrafficColor(trafficLevel);

            const markerRadius = getTrafficRadius(
              totalTraffic,
              maxTraffic
            );

            const totalHeavyTraffic =
              (heavy_traffic_forwards ?? 0) +
              (heavy_traffic_backwards ?? 0);

            const heavyTrafficPercentage =
              totalTraffic > 0
                ? Math.round((totalHeavyTraffic / totalTraffic) * 100)
                : 0;
            
            const ageMinutes = getDataAge(
              detector.properties.measurement_time
            );

            const freshness = getFreshnessLabel(ageMinutes);

            return (
              <CircleMarker
                key={index}
                center={[latitude, longitude]}
                radius={markerRadius}
                pathOptions={{
                  color: markerColor,
                  fillColor: markerColor,
                  fillOpacity: 0.75,
                  weight: 1,
                }}
              >
                <Popup>
                  <div className="min-w-55">
                    <h2 className="mb-1 text-base font-bold">
                      {detector.properties.site_name ?? "Liiklusloendur"}
                    </h2>

                    <p className="mb-3 text-sm">
                      {detector.properties.road_name ?? "Tee nimi puudub"}
                    </p>

                    <p>
                      <strong>Liiklus kokku:</strong> {totalTraffic}
                    </p>

                    <p>
                      Suund 1: {total_flow_forwards ?? "—"}
                    </p>

                    <p>
                      Suund 2: {total_flow_backwards ?? "—"}
                    </p>

                    <hr className="my-2" />

                    <p>
                      <strong>Keskmine kiirus</strong>
                    </p>

                    <p>
                      Suund 1:{" "}
                      {formatSpeed(
                        detector.properties.average_speed_forwards
                      )}
                    </p>

                    <p>
                      Suund 2:{" "}
                      {formatSpeed(
                        detector.properties.average_speed_backwards
                      )}
                    </p>

                    <hr className="my-2" />

                    <p>
                      <strong>Raskeliiklus:</strong>{" "}
                      {totalHeavyTraffic} ({heavyTrafficPercentage}%)
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Mõõtmise aeg:{" "}
                      {formatMeasurementTime(
                        detector.properties.measurement_time
                      )}
                    </p>

                    <p>
                      <strong>Andmete seis:</strong> {freshness}
                    </p>

                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-5 left-5 z-[1000] rounded-lg bg-white p-4 shadow-lg">
          <h3 className="mb-2 font-semibold">
            Liikluskoormus
          </h3>

          <div className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            Madal
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            Keskmine
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            Kõrge
          </div>

          <p className="mt-2 max-w-44 text-xs text-slate-500">
            Markeri suurus näitab suhtelist liiklusvoogu.
          </p>
        </div>

      </main>
    </div>
  );
}

export default App;