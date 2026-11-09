export function formatSpeed(speed?: number) {
  if (speed == null) {
    return "—";
  }

  return `${Math.round(speed)} km/h`;
}

export function formatMeasurementTime(value?: string | number) {
  if (value == null) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("et-EE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function getTotalTraffic(
  forwards?: number,
  backwards?: number
) {
  return (forwards ?? 0) + (backwards ?? 0);
}

export function getHeavyTrafficPercentage(
  totalTraffic: number,
  heavyTraffic: number
) {
  if (totalTraffic === 0) {
    return 0;
  }

  return Math.round((heavyTraffic / totalTraffic) * 100);
}

export function getDataAge(value?: string | number) {
  if (value == null) {
    return null;
  }

  const measurementDate = new Date(value);

  if (Number.isNaN(measurementDate.getTime())) {
    return null;
  }

  const differenceMs =
    Date.now() - measurementDate.getTime();

  return Math.floor(differenceMs / 1000 / 60);
}

export function getFreshnessLabel(ageMinutes: number | null) {
  if (ageMinutes == null) {
    return "Teadmata";
  }

  if (ageMinutes <= 30) {
    return "Värske";
  }

  if (ageMinutes <= 180) {
    return "Vanem";
  }

  return "Aegunud";
}

export type TrafficLevel = "low" | "medium" | "high";

export type TrafficThresholds = {
  medium: number;
  high: number;
};

export function calculateTrafficThresholds(
  values: number[]
): TrafficThresholds {
  const sorted = values
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (sorted.length === 0) {
    return {
      medium: 0,
      high: 0,
    };
  }

  const getPercentile = (percentage: number) => {
    const index = Math.floor(
      (sorted.length - 1) * percentage
    );

    return sorted[index];
  };

  return {
    medium: getPercentile(0.33),
    high: getPercentile(0.66),
  };
}

export function getTrafficLevel(
  totalTraffic: number,
  thresholds: TrafficThresholds
): TrafficLevel {
  if (totalTraffic <= thresholds.medium) {
    return "low";
  }

  if (totalTraffic <= thresholds.high) {
    return "medium";
  }

  return "high";
}

export function getTrafficColor(level: TrafficLevel) {
  switch (level) {
    case "low":
      return "#22c55e";

    case "medium":
      return "#f59e0b";

    case "high":
      return "#ef4444";
  }
}

export function getTrafficRadius(
  totalTraffic: number,
  maxTraffic: number
) {
  if (maxTraffic <= 0) {
    return 5;
  }

  return 5 + Math.sqrt(totalTraffic / maxTraffic) * 10;
}