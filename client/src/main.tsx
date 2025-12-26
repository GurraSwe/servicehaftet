import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerPWA } from "@/lib/pwa";

createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.PROD) {
  registerPWA();
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    registerPWA();
  });
}
