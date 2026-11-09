import type { TrafficFeature } from "../types/traffic";
import {
  formatMeasurementTime,
  formatSpeed,
  getDataAge,
  getFreshnessLabel,
  getHeavyTrafficPercentage,
  getTotalTraffic,
} from "../utils/traffic";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TrafficDetailsProps = {
  detector: TrafficFeature;
  onClose: () => void;
  onAddToComparison: (detector: TrafficFeature) => void;
};

function TrafficDetails({
  detector,
  onClose,
  onAddToComparison,
}: TrafficDetailsProps) {
  const {
    total_flow_forwards,
    total_flow_backwards,
    heavy_traffic_forwards,
    heavy_traffic_backwards,
    average_speed_forwards,
    average_speed_backwards,
    measurement_time,
  } = detector.properties;

  const totalTraffic = getTotalTraffic(
    total_flow_forwards,
    total_flow_backwards
  );

  const totalHeavyTraffic =
    (heavy_traffic_forwards ?? 0) +
    (heavy_traffic_backwards ?? 0);

  const heavyTrafficPercentage =
    getHeavyTrafficPercentage(
      totalTraffic,
      totalHeavyTraffic
    );

  const trafficChartData = [
    {
      direction: "Suund 1",
      traffic: total_flow_forwards ?? 0,
    },
    {
      direction: "Suund 2",
      traffic: total_flow_backwards ?? 0,
    },
  ];

  const ageMinutes = getDataAge(measurement_time);
  const freshness = getFreshnessLabel(ageMinutes);

  return (
    <aside className="absolute right-4 top-4 z-[1000] w-80 rounded-xl bg-white p-5 shadow-lg">
      <button
        onClick={onClose}
        className="float-right text-slate-500 hover:text-slate-900"
      >
        ✕
      </button>

      <h2 className="pr-8 text-lg font-bold">
        {detector.properties.site_name ?? "Liiklusloendur"}
      </h2>

      <p className="mt-1 text-sm text-slate-600">
        {detector.properties.road_name ?? "Tee nimi puudub"}
      </p>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="font-semibold">Liiklusvoog</p>
          <p>Kokku: {totalTraffic}</p>
          <p>Suund 1: {total_flow_forwards ?? "—"}</p>
          <p>Suund 2: {total_flow_backwards ?? "—"}</p>
        </div>

        <div>
          <p className="mb-2 font-semibold">
            Liiklusvoog suundade kaupa
          </p>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficChartData}>
                <XAxis
                  dataKey="direction"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Bar
                  dataKey="traffic"
                  name="Liiklusvoog"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="font-semibold">Keskmine kiirus</p>
          <p>Suund 1: {formatSpeed(average_speed_forwards)}</p>
          <p>Suund 2: {formatSpeed(average_speed_backwards)}</p>
        </div>

        <div>
          <p className="font-semibold">Raskeliiklus</p>
          <p>
            {totalHeavyTraffic} ({heavyTrafficPercentage}%)
          </p>
        </div>

        <div>
          <p className="font-semibold">Andmete seis</p>
          <p>{freshness}</p>
          <p className="text-xs text-slate-500">
            Mõõtmise aeg:{" "}
            {formatMeasurementTime(measurement_time)}
          </p>
        </div>
      </div>

      <button
        onClick={() => onAddToComparison(detector)}
        className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Lisa võrdlusse
      </button>
    </aside>
  );
}

export default TrafficDetails;