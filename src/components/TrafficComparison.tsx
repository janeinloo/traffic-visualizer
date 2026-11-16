import type { TrafficFeature } from "../types/traffic";
import {
  formatSpeed,
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

type TrafficComparisonProps = {
  detectors: TrafficFeature[];
  onClear: () => void;
};

function TrafficComparison({
  detectors,
  onClear,
}: TrafficComparisonProps) {
  if (detectors.length < 2) {
    return null;
  }

  const comparisonChartData = detectors.map((detector) => ({
    name: detector.properties.site_name,
    traffic: getTotalTraffic(
      detector.properties.total_flow_forwards,
      detector.properties.total_flow_backwards
    ),
  }));

  return (
    <div className="absolute bottom-4 left-1/2 z-[1000] max-h-[60%] w-[calc(100%-2rem)] -translate-x-1/2 overflow-y-auto rounded-xl bg-white p-4 shadow-lg sm:w-[560px] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Võrdlus
        </h2>

        <button
          onClick={onClear}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Tühjenda
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {detectors.map((detector) => {
          const {
            total_flow_forwards,
            total_flow_backwards,
            average_speed_forwards,
            average_speed_backwards,
          } = detector.properties;

          const totalTraffic = getTotalTraffic(
            total_flow_forwards,
            total_flow_backwards
          );

          const speedValues = [
            average_speed_forwards,
            average_speed_backwards,
          ].filter(
            (value): value is number =>
              typeof value === "number"
          );

          const averageSpeed =
            speedValues.length > 0
              ? speedValues.reduce(
                  (sum, value) => sum + value,
                  0
                ) / speedValues.length
              : undefined;

          return (
            <div
              key={detector.properties.datex_id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <h3 className="font-semibold">
                {detector.properties.site_name}
              </h3>

              <div className="mt-3 space-y-1 text-sm">
                <p>
                  Liiklus kokku:{" "}
                  <strong>
                    {totalTraffic}
                  </strong>
                </p>

                <p>
                  Keskmine kiirus:{" "}
                  <strong>
                    {formatSpeed(
                      averageSpeed
                    )}
                  </strong>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <p className="mb-2 font-semibold">
          Liiklusvoo võrdlus
        </p>

        <div className="h-44 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={comparisonChartData}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
              />

              <YAxis
                tick={{ fontSize: 11 }}
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
    </div>
  );
}

export default TrafficComparison;