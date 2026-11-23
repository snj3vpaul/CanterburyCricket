import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { preloadRoute } from "./routePages";

preloadRoute(window.location.pathname).then(() => createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
));