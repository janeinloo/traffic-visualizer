import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";

import {
  fetchTrams,
  type Tram,
} from "../services/tramApi";

type LineFilter = "all" | "1" | "3";

function TramsPage() {
  const [trams, setTrams] = useState<Tram[]>([]);
  const [selectedLine, setSelectedLine] =
    useState<LineFilter>("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  useEffect(() => {
    async function loadTrams() {
      try {
        setError(null);

        const data = await fetchTrams();

        setTrams(data.trams);
        setLastUpdated(new Date());
      } catch (error) {
        console.error(
          "Trammiandmete viga:",
          error
        );

        setError(
          "Trammiandmete laadimine ebaõnnestus."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadTrams();

    const interval = window.setInterval(
      loadTrams,
      10_000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const filteredTrams = useMemo(() => {
    if (selectedLine === "all") {
      return trams;
    }

    return trams.filter(
      (tram) => tram.line === selectedLine
    );
  }, [trams, selectedLine]);

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100">
      <header className="flex min-h-16 items-center gap-4 border-b border-slate-200 bg-white px-6 py-3">
        <Link
          to="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Avaleht
        </Link>

        <div className="mr-auto">
          <h1 className="text-xl font-bold text-slate-900">
            Trammid Tallinna Ülikooli
          </h1>

          <p className="text-xs text-slate-500">
            Reaalaja trammipositsioonid
          </p>
        </div>

        <select
          value={selectedLine}
          onChange={(event) =>
            setSelectedLine(
              event.target.value as LineFilter
            )
          }
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">
            Kõik trammid
          </option>

          <option value="1">
            Liin 1
          </option>

          <option value="3">
            Liin 3
          </option>
        </select>

        <div className="text-right text-sm text-slate-500">
          <p>
            {filteredTrams.length} trammi
          </p>

          {lastUpdated && (
            <p className="text-xs">
              Uuendatud{" "}
              {lastUpdated.toLocaleTimeString(
                "et-EE",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              )}
            </p>
          )}
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        <MapContainer
          center={[59.437, 24.7536]}
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredTrams.map((tram, index) => {
            const color =
              tram.line === "1"
                ? "#2563eb"
                : "#dc2626";

            return (
              <CircleMarker
                key={
                  tram.vehicleId ??
                  `${tram.line}-${index}`
                }
                center={[
                  tram.latitude,
                  tram.longitude,
                ]}
                radius={9}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.9,
                  weight: 2,
                }}
              >
                <Popup>
                  <div>
                    <strong>
                      🚋 Tramm {tram.line}
                    </strong>

                    {tram.destination && (
                      <p>
                        Suund:{" "}
                        {tram.destination}
                      </p>
                    )}

                    {tram.vehicleId && (
                      <p className="text-xs">
                        Sõiduk:{" "}
                        {tram.vehicleId}
                      </p>
                    )}

                    <p className="mt-1 text-xs">
                      Reaalaja GPS-positsioon
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-5 left-5 z-[1000] rounded-xl bg-white p-4 shadow-lg">
          <h3 className="mb-2 font-semibold">
            Trammiliinid
          </h3>

          <div className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-blue-600" />
            Liin 1
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-red-600" />
            Liin 3
          </div>

          <p className="mt-2 max-w-48 text-xs text-slate-500">
            Positsioone uuendatakse automaatselt
            iga 10 sekundi järel.
          </p>
        </div>

        {isLoading && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/70">
            <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
              <p className="font-medium text-slate-700">
                Trammiandmete laadimine...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute left-1/2 top-4 z-[2000] -translate-x-1/2 rounded-lg bg-red-50 px-5 py-3 text-sm text-red-700 shadow-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

export default TramsPage;