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
import type { TrafficLevel } from "./utils/traffic";
import TrafficDetails from "./components/TrafficDetails";
import TrafficComparison from "./components/TrafficComparison";
import TrafficStats from "./components/TrafficStats";

proj4.defs(
  "EPSG:3301",
  "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +units=m +no_defs"
);


function App() {
  const [trafficData, setTrafficData] = useState<TrafficFeature[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"all" | TrafficLevel>("all");
  const [selectedDetector, setSelectedDetector] = useState<TrafficFeature | null>(null);
  const [comparisonDetectors, setComparisonDetectors] = useState<TrafficFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);


  useEffect(() => {
    async function loadTrafficData() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getTrafficDetectors();

        setTrafficData(data.features);
      } catch (error) {
        console.error("API error:", error);

        setError(
          "Liiklusandmete laadimine ebaõnnestus."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadTrafficData();
  }, []);

  function addToComparison(detector: TrafficFeature) {
  setComparisonDetectors((current) => {
    if (
      current.some(
        (item) =>
          item.properties.traffic_detector_id ===
          detector.properties.traffic_detector_id
      )
    ) {
      return current;
    }

    if (current.length >= 2) {
      return [current[1], detector];
    }

    return [...current, detector];
  });
}

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

  const filteredTrafficData = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return trafficData.filter((detector) => {
      const { site_name, road_name } = detector.properties;

      const matchesSearch =
        search === "" ||
        site_name?.toLowerCase().includes(search) ||
        road_name?.toLowerCase().includes(search);

      const totalTraffic = getTotalTraffic(
        detector.properties.total_flow_forwards,
        detector.properties.total_flow_backwards
      );

      const trafficLevel = getTrafficLevel(
        totalTraffic,
        trafficThresholds
      );

      const matchesLevel =
        selectedLevel === "all" ||
        trafficLevel === selectedLevel;

      return matchesSearch && matchesLevel;
    });
  }, [
    trafficData,
    searchTerm,
    selectedLevel,
    trafficThresholds,
  ]);

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
    <div className="flex h-screen w-screen flex-col bg-slate-100">
      <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
        <h1 className="mr-auto text-xl font-semibold text-slate-800">
          Traffic Visualizer
        </h1>

        <input
          type="text"
          placeholder="Otsi teed või punkti..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:w-64"
        />

        <button
          onClick={() => setShowStats((current) => !current)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Statistika
        </button>

        <select
          value={selectedLevel}
          onChange={(event) =>
            setSelectedLevel(
              event.target.value as "all" | TrafficLevel
            )
          }
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:w-auto"
        >
          <option value="all">Kõik koormused</option>
          <option value="low">Madal</option>
          <option value="medium">Keskmine</option>
          <option value="high">Kõrge</option>
        </select>

        <span className="text-sm text-slate-500">
          {filteredTrafficData.length} punkti
        </span>
      </header>

      <main className="relative min-h-0 flex-1">
        <MapContainer
          center={[58.6, 25.0]}
          zoom={7}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {filteredTrafficData.map((detector, index) => {
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
                eventHandlers={{
                  click: () => setSelectedDetector(detector),
                }}
              >
                <Popup>
                  <div>
                    <strong>
                      {detector.properties.site_name ?? "Liiklusloendur"}
                    </strong>

                    <p>
                      {detector.properties.road_name ?? "Tee nimi puudub"}
                    </p>

                    <p>Liiklus kokku: {totalTraffic}</p>

                    <button
                      onClick={() => setSelectedDetector(detector)}
                      className="mt-2 font-medium text-blue-600"
                    >
                      Vaata detaile
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {isLoading && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/70">
            <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
              <p className="font-medium text-slate-700">
                Liiklusandmete laadimine...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute left-1/2 top-4 z-[2000] -translate-x-1/2 rounded-lg bg-red-50 px-5 py-3 text-sm text-red-700 shadow-lg">
            {error}
          </div>
        )}

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

          {selectedDetector && (
            <TrafficDetails
              detector={selectedDetector}
              onClose={() => setSelectedDetector(null)}
              onAddToComparison={addToComparison}
            />
          )}

          {showStats && (
            <TrafficStats
              detectors={filteredTrafficData}
              thresholds={trafficThresholds}
              onClose={() => setShowStats(false)}
            />
          )}

          <TrafficComparison
            detectors={comparisonDetectors}
            onClear={() => setComparisonDetectors([])}
          />

      </main>
    </div>
  );
}

export default App;