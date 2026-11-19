import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import TrafficPage from "./pages/TrafficPage";
import TramsPage from "./pages/TramsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/traffic"
          element={<TrafficPage />}
        />

        <Route
          path="/trams"
          element={<TramsPage />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;