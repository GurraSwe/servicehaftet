import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerPWA } from "@/lib/pwa";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Error handling for root element
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure there's a <div id='root'></div> in your HTML.");
}

// Wrap app in error boundary
const root = createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Register service worker with error handling and auto-update
if ("serviceWorker" in navigator) {
  // Register immediately (don't wait for load event)
  registerPWA().catch((error) => {
    console.error("Failed to register service worker:", error);
  });
  
  // Listen for controller changes (when new service worker takes control)
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("Service worker controller changed, reloading...");
    window.location.reload();
  });
  
  // Listen for service worker messages
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SW_UPDATED") {
      console.log("Service worker updated, reloading page...");
      window.location.reload();
    }
  });
}
