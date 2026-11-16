export type TrafficFeature = {
  type: "Feature";

  properties: {
    datex_id: string;
    site_name: string;

    measurement_time?: string;

    total_flow_forwards?: number;
    total_flow_backwards?: number;

    average_speed_forwards?: number;
    average_speed_backwards?: number;
  };

  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};