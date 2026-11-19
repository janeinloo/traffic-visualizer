import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";

import {
  fetchTramDepartures,
  fetchTrams,
  type Tram,
  type TramDeparturesResponse,
} from "../services/tramApi";

type LineFilter = "all" | "1" | "3";

function TramsPage() {
  const [trams, setTrams] =
    useState<Tram[]>([]);

  const [walkMinutes, setWalkMinutes] =
  useState(5);

  const [
    departuresData,
    setDeparturesData,
  ] =
    useState<TramDeparturesResponse | null>(
      null
    );

  const [selectedLine, setSelectedLine] =
    useState<LineFilter>("all");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [
    departuresError,
    setDeparturesError,
  ] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  // Live trammi GPS
  useEffect(() => {
    async function loadTrams() {
      try {
        setError(null);

        const data =
          await fetchTrams();

        setTrams(data.trams);

        setLastUpdated(
          new Date()
        );
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

    const interval =
      window.setInterval(
        loadTrams,
        10_000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);

  // TLÜ peatuse järgmised väljumised
  useEffect(() => {
    async function loadDepartures() {
      try {
        setDeparturesError(null);

        const data =
          await fetchTramDepartures();

        setDeparturesData(data);
      } catch (error) {
        console.error(
          "Väljumiste viga:",
          error
        );

        setDeparturesError(
          "Väljumiste laadimine ebaõnnestus."
        );
      }
    }

    loadDepartures();

    const interval =
      window.setInterval(
        loadDepartures,
        30_000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);

  const filteredTrams =
    useMemo(() => {
      if (
        selectedLine === "all"
      ) {
        return trams;
      }

      return trams.filter(
        (tram) =>
          tram.line ===
          selectedLine
      );
    }, [trams, selectedLine]);

  const filteredDepartures =
    useMemo(() => {
      if (!departuresData) {
        return [];
      }

      if (
        selectedLine === "all"
      ) {
        return departuresData.departures;
      }

      return departuresData.departures.filter(
        (departure) =>
          departure.line ===
          selectedLine
      );
    }, [
      departuresData,
      selectedLine,
    ]);

  const nextReachableDeparture =
  useMemo(() => {
    return filteredDepartures.find(
      (departure) =>
        departure.minutesUntil >=
        walkMinutes
    );
  }, [
    filteredDepartures,
    walkMinutes,
  ]);

const leaveInMinutes =
  nextReachableDeparture
    ? nextReachableDeparture.minutesUntil -
      walkMinutes
    : null;

const shouldLeaveNow =
  leaveInMinutes != null &&
  leaveInMinutes <= 1;

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
            Trammid Tallinna
            Ülikooli
          </h1>

          <p className="text-xs text-slate-500">
            Reaalaja
            trammipositsioonid ja
            järgmised väljumised
          </p>
        </div>

        <select
          value={selectedLine}
          onChange={(event) =>
            setSelectedLine(
              event.target
                .value as LineFilter
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
            {filteredTrams.length}{" "}
            trammi
          </p>

          {lastUpdated && (
            <p className="text-xs">
              Uuendatud{" "}
              {lastUpdated.toLocaleTimeString(
                "et-EE",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second:
                    "2-digit",
                }
              )}
            </p>
          )}
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        <MapContainer
          center={[
            59.437,
            24.7536,
          ]}
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Live trammid */}
          {filteredTrams.map(
            (tram, index) => {
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
                        🚋 Tramm{" "}
                        {tram.line}
                      </strong>

                      {tram.destination && (
                        <p>
                          Suund:{" "}
                          {
                            tram.destination
                          }
                        </p>
                      )}

                      {tram.vehicleId && (
                        <p className="text-xs">
                          Sõiduk:{" "}
                          {
                            tram.vehicleId
                          }
                        </p>
                      )}

                      <p className="mt-1 text-xs">
                        Reaalaja
                        GPS-positsioon
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            }
          )}

          {/* Tallinna Ülikooli peatused */}
          {departuresData?.stops.map(
            (stop) => (
              <CircleMarker
                key={stop.id}
                center={[
                  stop.latitude,
                  stop.longitude,
                ]}
                radius={11}
                pathOptions={{
                  color: "#111827",
                  fillColor:
                    "#facc15",
                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Popup>
                  <div>
                    <strong>
                      📍 {stop.name}
                    </strong>

                    <p className="text-xs">
                      Peatus{" "}
                      {stop.id}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            )
          )}
        </MapContainer>

        {/* Järgmiste trammide paneel */}
        <aside className="absolute right-4 top-4 z-[1000] max-h-[calc(100%-2rem)] w-80 overflow-y-auto rounded-xl bg-white p-5 shadow-lg">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Järgmised trammid
            </h2>

            <p className="text-xs text-slate-500">
              Tallinna Ülikool
            </p>
          </div>

          <div className="mb-4 rounded-lg bg-slate-50 p-3">
            <label
              htmlFor="walk-time"
              className="text-xs font-medium text-slate-600"
            >
              Kõndimisaeg peatusesse
            </label>

            <select
              id="walk-time"
              value={walkMinutes}
              onChange={(event) =>
                setWalkMinutes(
                  Number(event.target.value)
                )
              }
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value={3}>
                3 min
              </option>

              <option value={5}>
                5 min
              </option>

              <option value={7}>
                7 min
              </option>

              <option value={10}>
                10 min
              </option>
            </select>
          </div>

          {nextReachableDeparture && (
            <div
              className={`mb-4 rounded-lg border p-4 ${
                shouldLeaveNow
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              {shouldLeaveNow ? (
                <>
                  <p className="text-lg font-bold text-amber-800">
                    HAKKA MINEMA!
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    Tramm{" "}
                    <strong>
                      {nextReachableDeparture.line}
                    </strong>{" "}
                    sihtkohta{" "}
                    <strong>
                      {nextReachableDeparture.destination ??
                        "teadmata"}
                    </strong>{" "}
                    väljub umbes{" "}
                    <strong>
                      {
                        nextReachableDeparture.minutesUntil
                      }{" "}
                      min
                    </strong>{" "}
                    pärast.
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Peatusesse kõndimiseks
                    arvestatud {walkMinutes} min.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-800">
                    Järgmine sobiv tramm
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Tramm{" "}
                    <strong>
                      {nextReachableDeparture.line}
                    </strong>{" "}
                    –{" "}
                    {nextReachableDeparture.destination ??
                      "sihtkoht teadmata"}
                  </p>

                  <p className="text-sm text-slate-600">
                    Väljub{" "}
                    {
                      nextReachableDeparture.minutesUntil
                    }{" "}
                    min pärast.
                  </p>

                  {leaveInMinutes != null && (
                    <p className="mt-1 text-xs text-slate-500">
                      Võid veel umbes{" "}
                      {leaveInMinutes} min oodata
                      enne peatusesse minemist.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {departuresError && (
            <p className="text-sm text-red-600">
              {departuresError}
            </p>
          )}

          {!departuresError &&
            filteredDepartures.length ===
              0 && (
              <p className="text-sm text-slate-500">
                Järgmise tunni
                väljumisi ei leitud.
              </p>
            )}

          <div className="space-y-2">
            {filteredDepartures.map(
              (
                departure,
                index
              ) => {
                const lineColor =
                  departure.line ===
                  "1"
                    ? "bg-blue-600"
                    : "bg-red-600";

                return (
                  <div
                    key={`${departure.stopId}-${departure.line}-${departure.expectedTime}-${index}`}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${lineColor}`}
                      >
                        {
                          departure.line
                        }
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">
                        {departure.destination ??
                            "Sihtkoht teadmata"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {
                            departure.expectedTime
                          }
                        </p>

                        <p className="text-xs text-slate-500">
                          {departure.minutesUntil <=
                          0
                            ? "kohe"
                            : `${departure.minutesUntil} min`}
                        </p>
                      </div>
                    </div>

                    {departure.delayMinutes !== 0 && (
                      <p
                          className={`mt-2 text-xs font-medium ${
                          departure.delayMinutes > 0
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                      >
                          {departure.delayMinutes > 0
                          ? `Hilinemine: +${departure.delayMinutes} min`
                          : `Graafikust ${Math.abs(
                              departure.delayMinutes
                              )} min varem`}
                      </p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </aside>

        {/* Legend */}
        <div className="absolute bottom-5 left-5 z-[1000] rounded-xl bg-white p-4 shadow-lg">
          <h3 className="mb-2 font-semibold">
            Kaart
          </h3>

          <div className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-blue-600" />
            Liin 1
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-red-600" />
            Liin 3
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full bg-yellow-400 ring-2 ring-slate-900" />
            Tallinna Ülikool
          </div>

          <p className="mt-2 max-w-48 text-xs text-slate-500">
            GPS-positsioone
            uuendatakse iga 10
            sekundi järel.
          </p>
        </div>

        {isLoading && (
          <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/70">
            <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
              <p className="font-medium text-slate-700">
                Trammiandmete
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
      </main>
    </div>
  );
}

export default TramsPage;