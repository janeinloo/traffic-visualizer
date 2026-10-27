import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";
import { getTrafficDetectors } from "./services/trafficApi";
import proj4 from "proj4";

proj4.defs(
  "EPSG:3301",
  "+proj=lcc +lat_1=59.33333333333334 +lat_2=58 +lat_0=57.51755393055556 +lon_0=24 +x_0=500000 +y_0=6375000 +ellps=GRS80 +units=m +no_defs"
);

type TrafficFeature = {
  type: "Feature";
  properties: {
    site_name?: string;
    road_name?: string;
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

function App() {
  const [trafficData, setTrafficData] = useState<TrafficFeature[]>([]);

  useEffect(() => {
  async function loadTrafficData() {
    try {
      const data = await getTrafficDetectors();

      console.log("Traffic data:", data);
      console.log(
        "First coordinates:",
        data.features[0]?.geometry?.coordinates
      );

      setTrafficData(data.features);
    } catch (error) {
      console.error("API error:", error);
    }
  }

  loadTrafficData();
}, []);

  return (
    <div className="h-screen w-screen bg-slate-100">
      <header className="flex h-16 items-center border-b border-slate-200 bg-white px-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Traffic Visualizer
        </h1>
      </header>

      <main className="h-[calc(100vh-4rem)]">
        <MapContainer
          center={[58.6, 25.0]}
          zoom={7}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {trafficData.map((detector, index) => {
            const [x, y] = detector.geometry.coordinates;

            const [longitude, latitude] = proj4(
              "EPSG:3301",
              "EPSG:4326",
              [x, y]
            );

            return (
              <CircleMarker
                key={index}
                center={[latitude, longitude]}
                radius={6}
              >
                <Popup>
                  <div>
                    <strong>
                      {detector.properties.site_name ??
                        "Liiklusloendur"}
                    </strong>

                    <p>
                      {detector.properties.road_name ??
                        "Tee nimi puudub"}
                    </p>

                    <p>
                      Liiklus edasi:{" "}
                      {detector.properties.total_flow_forwards ??
                        "—"}
                    </p>

                    <p>
                      Liiklus tagasi:{" "}
                      {detector.properties.total_flow_backwards ??
                        "—"}
                    </p>

                    <p>
                      Keskmine kiirus edasi:{" "}
                      {detector.properties
                        .average_speed_forwards ?? "—"}{" "}
                      km/h
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </main>
    </div>
  );
}

export default App;