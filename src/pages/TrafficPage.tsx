import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";

import { fetchTrafficMap } from "../services/trafficApi";
import type { TrafficFeature } from "../types/traffic";

import {
  getTotalTraffic,
  calculateTrafficThresholds,
  getTrafficColor,
  getTrafficLevel,
  getTrafficRadius,
  formatMeasurementTime,
} from "../utils/traffic";

import type { TrafficLevel } from "../utils/traffic";

import TrafficDetails from "../components/TrafficDetails";
import TrafficComparison from "../components/TrafficComparison";
import TrafficStats from "../components/TrafficStats";

function TrafficPage() {
  const [trafficData, setTrafficData] = useState<TrafficFeature[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] =
    useState<"all" | TrafficLevel>("all");

  const [selectedDetector, setSelectedDetector] =
    useState<TrafficFeature | null>(null);

  const [comparisonDetectors, setComparisonDetectors] =
    useState<TrafficFeature[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrafficData() {
      try {
        setIsLoading(true);
        setError(null);

        const datexMap = await fetchTrafficMap();

        setLastUpdated(
          datexMap.trafficPublicationTime
        );

        const activePoints = datexMap.points.filter(
          (point) => point.hasTrafficData
        );

        const data: TrafficFeature[] = activePoints.map((point) => {
          const direction1 = point.directions["1"];
          const direction2 = point.directions["2"];

          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                point.longitude,
                point.latitude,
              ],
            },
            properties: {
              datex_id: point.id,

              site_name:
                point.name ?? "Nimetu mõõtepunkt",

              measurement_time:
                point.latestMeasurementTime ?? undefined,

              total_flow_forwards:
                direction1?.flow ?? undefined,

              total_flow_backwards:
                direction2?.flow ?? undefined,

              average_speed_forwards:
                direction1?.speed ?? undefined,

              average_speed_backwards:
                direction2?.speed ?? undefined,
            },
          };
        });

        setTrafficData(data);
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
      const detectorId =
        detector.properties.datex_id;

      if (
        current.some(
          (item) =>
            item.properties.datex_id === detectorId
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
    return calculateTrafficThresholds(
      trafficTotals
    );
  }, [trafficTotals]);

  const filteredTrafficData = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return trafficData.filter((detector) => {
      const { site_name } =
        detector.properties;

      const matchesSearch =
        search === "" ||
        site_name
          ?.toLowerCase()
          .includes(search);

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

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100">
      <header className="flex min-h-16 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
        <Link
        to="/"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
        ← Avaleht
        </Link>
        <h1 className="mr-auto text-xl font-semibold text-slate-800">
          Traffic Visualizer
        </h1>

        <input
          type="text"
          placeholder="Otsi mõõtepunkti..."
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:w-64"
        />

        <button
          onClick={() => {
            setShowStats((current) => !current);
            setSelectedDetector(null);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Statistika
        </button>

        <select
          value={selectedLevel}
          onChange={(event) =>
            setSelectedLevel(
              event.target.value as
                | "all"
                | TrafficLevel
            )
          }
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:w-auto"
        >
          <option value="all">
            Kõik koormused
          </option>

          <option value="low">
            Madal
          </option>

          <option value="medium">
            Keskmine
          </option>

          <option value="high">
            Kõrge
          </option>
        </select>

        <div className="text-right text-sm text-slate-500">
          <p>
            {filteredTrafficData.length} punkti
          </p>

          {lastUpdated && (
            <p className="text-xs">
              Viimati uuendatud:{" "}
              {formatMeasurementTime(lastUpdated)}
            </p>
          )}
        </div>
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

          {filteredTrafficData.map(
            (detector) => {
              const [
                longitude,
                latitude,
              ] =
                detector.geometry.coordinates;

              const {
                total_flow_forwards,
                total_flow_backwards,
              } = detector.properties;

              const totalTraffic =
                getTotalTraffic(
                  total_flow_forwards,
                  total_flow_backwards
                );

              const trafficLevel =
                getTrafficLevel(
                  totalTraffic,
                  trafficThresholds
                );

              const markerColor =
                getTrafficColor(
                  trafficLevel
                );

              const markerRadius =
                getTrafficRadius(
                  totalTraffic,
                  maxTraffic
                );

              return (
                <CircleMarker
                  key={
                    detector.properties
                      .datex_id
                  }
                  center={[
                    latitude,
                    longitude,
                  ]}
                  radius={markerRadius}
                  pathOptions={{
                    color: markerColor,
                    fillColor:
                      markerColor,
                    fillOpacity: 0.75,
                    weight: 1,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedDetector(detector);
                      setShowStats(false);
                    },
                  }}
                >
                  <Popup>
                    <div>
                      <strong>
                        {detector
                          .properties
                          .site_name ??
                          "Liiklusloendur"}
                      </strong>

                      <p>
                        Liiklus kokku:{" "}
                        {totalTraffic}
                      </p>

                      <button
                        onClick={() =>
                          setSelectedDetector(
                            detector
                          )
                        }
                        className="mt-2 font-medium text-blue-600"
                      >
                        Vaata detaile
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            }
          )}
        </MapContainer>

        {isLoading && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/70">
            <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
              <p className="font-medium text-slate-700">
                Liiklusandmete
                laadimine...
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
            Markeri suurus näitab
            suhtelist liiklusvoogu.
          </p>
        </div>

        {selectedDetector && (
          <TrafficDetails
            detector={selectedDetector}
            onClose={() =>
              setSelectedDetector(null)
            }
            onAddToComparison={
              addToComparison
            }
          />
        )}

        {showStats && (
          <TrafficStats
            detectors={
              filteredTrafficData
            }
            thresholds={
              trafficThresholds
            }
            onClose={() =>
              setShowStats(false)
            }
          />
        )}

        <TrafficComparison
          detectors={
            comparisonDetectors
          }
          onClear={() =>
            setComparisonDetectors([])
          }
        />
      </main>
    </div>
  );
}

export default TrafficPage;