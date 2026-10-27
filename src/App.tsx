import { MapContainer, TileLayer } from "react-leaflet";
import { useEffect } from "react";
import { getTrafficDetectors } from "./services/trafficApi";

function App() {

  useEffect(() => {
    async function loadTrafficData() {
      try {
        const data = await getTrafficDetectors();
        console.log("Traffic data:", data);
        console.log("First detector:", data.features[0]);
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
        </MapContainer>
      </main>
    </div>
  );
}

export default App;