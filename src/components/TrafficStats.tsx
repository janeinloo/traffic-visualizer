import type { TrafficFeature } from "../types/traffic";
import type {
  TrafficThresholds,
  TrafficLevel,
} from "../utils/traffic";

import {
  getHeavyTrafficPercentage,
  getTotalTraffic,
  getTrafficLevel,
} from "../utils/traffic";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TrafficStatsProps = {
  detectors: TrafficFeature[];
  thresholds: TrafficThresholds;
  onClose: () => void;
};

function TrafficStats({
  detectors,
  thresholds,
  onClose,
}: TrafficStatsProps) {
  if (detectors.length === 0) {
    return null;
  }

  // Kõikide punktide liiklusvood
  const totals = detectors.map((detector) =>
    getTotalTraffic(
      detector.properties.total_flow_forwards,
      detector.properties.total_flow_backwards
    )
  );

  const totalTraffic = totals.reduce(
    (sum, value) => sum + value,
    0
  );

  const averageTraffic = Math.round(
    totalTraffic / detectors.length
  );

  // Keskmine kiirus
  const speeds = detectors.flatMap((detector) => {
    const values = [
      detector.properties.average_speed_forwards,
      detector.properties.average_speed_backwards,
    ];

    return values.filter(
      (speed): speed is number =>
        speed != null && Number.isFinite(speed) && speed > 0
    );
  });

  const averageSpeed =
    speeds.length > 0
      ? Math.round(
          speeds.reduce((sum, speed) => sum + speed, 0) /
            speeds.length
        )
      : 0;

  // Kõige suurema liiklusvooga punkt
  const sortedByTraffic = [...detectors].sort((a, b) => {
    const trafficA = getTotalTraffic(
      a.properties.total_flow_forwards,
      a.properties.total_flow_backwards
    );

    const trafficB = getTotalTraffic(
      b.properties.total_flow_forwards,
      b.properties.total_flow_backwards
    );

    return trafficB - trafficA;
  });

  const busiestDetector = sortedByTraffic[0];

  const busiestTraffic = getTotalTraffic(
    busiestDetector.properties.total_flow_forwards,
    busiestDetector.properties.total_flow_backwards
  );

  // TOP 5
  const topFive = sortedByTraffic.slice(0, 5);

  const topFiveChartData = topFive.map((detector) => ({
    name:
      detector.properties.site_name ?? "Liiklusloendur",
    traffic: getTotalTraffic(
      detector.properties.total_flow_forwards,
      detector.properties.total_flow_backwards
    ),
  }));

  // Suurima raskeliikluse osakaaluga punkt
  const heavyTrafficStats = detectors.map((detector) => {
    const total = getTotalTraffic(
      detector.properties.total_flow_forwards,
      detector.properties.total_flow_backwards
    );

    const heavy =
      (detector.properties.heavy_traffic_forwards ?? 0) +
      (detector.properties.heavy_traffic_backwards ?? 0);

    return {
      detector,
      percentage: getHeavyTrafficPercentage(
        total,
        heavy
      ),
    };
  });

  const highestHeavyTraffic = heavyTrafficStats.reduce(
    (highest, current) =>
      current.percentage > highest.percentage
        ? current
        : highest
  );

  // Koormustasemete arv
  const levelCounts: Record<TrafficLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };

  detectors.forEach((detector) => {
    const total = getTotalTraffic(
      detector.properties.total_flow_forwards,
      detector.properties.total_flow_backwards
    );

    const level = getTrafficLevel(
      total,
      thresholds
    );

    levelCounts[level]++;
  });

  return (
    <div className="absolute right-4 top-4 z-[1000] max-h-[calc(100%-2rem)] w-[min(420px,calc(100%-2rem))] overflow-y-auto rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Andmestiku statistika
        </h2>

        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-900"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Loenduspunkte
          </p>
          <p className="text-xl font-bold">
            {detectors.length}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Keskmine liiklusvoog
          </p>
          <p className="text-xl font-bold">
            {averageTraffic}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Keskmine kiirus
          </p>
          <p className="text-xl font-bold">
            {averageSpeed} km/h
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Kõrge koormusega
          </p>
          <p className="text-xl font-bold">
            {levelCounts.high}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="font-semibold">
          Koormustasemete jaotus
        </p>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-green-600">
              Madal
            </p>
            <strong>{levelCounts.low}</strong>
          </div>

          <div>
            <p className="text-amber-600">
              Keskmine
            </p>
            <strong>{levelCounts.medium}</strong>
          </div>

          <div>
            <p className="text-red-600">
              Kõrge
            </p>
            <strong>{levelCounts.high}</strong>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="font-semibold">
          Suurima liiklusvooga punkt
        </p>

        <p>
          {busiestDetector.properties.site_name ??
            "Liiklusloendur"}
        </p>

        <p className="text-sm text-slate-500">
          {busiestTraffic}
        </p>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="font-semibold">
          Suurim raskeliikluse osakaal
        </p>

        <p>
          {highestHeavyTraffic.detector.properties
            .site_name ?? "Liiklusloendur"}
        </p>

        <p className="text-sm text-slate-500">
          {highestHeavyTraffic.percentage}%
        </p>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <p className="mb-3 font-semibold">
          TOP 5 liiklusvooga punkti
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart data={topFiveChartData}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
              />

              <YAxis
                tick={{ fontSize: 10 }}
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

export default TrafficStats;