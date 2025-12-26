import { useCallback, useEffect, useMemo, useState } from "react";
import { requestBrowserNotificationPermission, subscribeUserToPush } from "@/lib/pwa";

type Status = "idle" | "pending" | "granted" | "denied" | "unsupported" | "error";

export function usePushNotifications() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const isSupported = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }, []);

  useEffect(() => {
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }

    navigator.serviceWorker.ready
      .then((reg) => {
        setRegistration(reg);
        setStatus(Notification.permission === "granted" ? "granted" : "idle");
      })
      .catch((err) => {
        console.error("Unable to resolve service worker registration:", err);
        setError("Kunde inte ansluta till service worker.");
        setStatus("error");
      });
  }, [isSupported]);

  const enableNotifications = useCallback(async () => {
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }
    if (!registration) {
      setError("Service worker inte redo ännu, försök igen om en stund.");
      setStatus("error");
      return;
    }

    setStatus("pending");
    setError(null);

    try {
      const permission = await requestBrowserNotificationPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      await subscribeUserToPush(registration);
      setStatus("granted");
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Det gick inte att aktivera pushnotiser.",
      );
      setStatus("error");
    }
  }, [isSupported, registration]);

  return {
    isSupported,
    status,
    error,
    enableNotifications,
  };
}

