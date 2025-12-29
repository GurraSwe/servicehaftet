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

// Register service worker with error handling
if (import.meta.env.PROD) {
  registerPWA().catch((error) => {
    console.error("Failed to register service worker in production:", error);
  });
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    registerPWA().catch((error) => {
      console.error("Failed to register service worker in development:", error);
    });
  });
}
