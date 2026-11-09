export type TrafficFeature = {
  type: "Feature";
  properties: {
    traffic_detector_id?: string;
    site_name?: string;
    road_name?: string;
    measurement_time?: string | number;

    total_flow_forwards?: number;
    total_flow_backwards?: number;

    heavy_traffic_forwards?: number;
    heavy_traffic_backwards?: number;

    average_speed_forwards?: number;
    average_speed_backwards?: number;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
};