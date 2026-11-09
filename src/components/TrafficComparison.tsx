import type { TrafficFeature } from "../types/traffic";
import {
  formatSpeed,
  getHeavyTrafficPercentage,
  getTotalTraffic,
} from "../utils/traffic";

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

  return (
    <div className="absolute bottom-4 left-1/2 z-[1000] w-[min(560px,90%)] -translate-x-1/2 rounded-xl bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Võrdlus</h2>

        <button
          onClick={onClear}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Tühjenda
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {detectors.map((detector) => {
          const {
            total_flow_forwards,
            total_flow_backwards,
            heavy_traffic_forwards,
            heavy_traffic_backwards,
            average_speed_forwards,
            average_speed_backwards,
          } = detector.properties;

          const totalTraffic = getTotalTraffic(
            total_flow_forwards,
            total_flow_backwards
          );

          const totalHeavyTraffic =
            (heavy_traffic_forwards ?? 0) +
            (heavy_traffic_backwards ?? 0);

          const heavyPercentage =
            getHeavyTrafficPercentage(
              totalTraffic,
              totalHeavyTraffic
            );

          return (
            <div
              key={detector.properties.traffic_detector_id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <h3 className="font-semibold">
                {detector.properties.site_name ??
                  "Liiklusloendur"}
              </h3>

              <p className="mb-3 text-xs text-slate-500">
                {detector.properties.road_name ??
                  "Tee nimi puudub"}
              </p>

              <p>
                Liiklus kokku:{" "}
                <strong>{totalTraffic}</strong>
              </p>

              <p>
                Keskmine kiirus:{" "}
                <strong>
                  {formatSpeed(
                    Math.round(
                      (
                        (average_speed_forwards ?? 0) +
                        (average_speed_backwards ?? 0)
                      ) / 2
                    )
                  )}
                </strong>
              </p>

              <p>
                Raskeliiklus:{" "}
                <strong>{heavyPercentage}%</strong>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrafficComparison;