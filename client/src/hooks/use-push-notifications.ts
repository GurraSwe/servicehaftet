import { useCallback, useEffect, useMemo, useState } from "react";
import { requestBrowserNotificationPermission, subscribeUserToPush } from "@/lib/pwa";
import { supabase } from "@/lib/supabase";

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

      const subscription = await subscribeUserToPush(registration);
      if (!subscription) {
        throw new Error("Kunde inte skapa push-prenumeration.");
      }

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Du måste vara inloggad för att aktivera pushnotiser.");
      }

      // Extract subscription keys
      const key = subscription.getKey("p256dh");
      const auth = subscription.getKey("auth");
      
      if (!key || !auth) {
        throw new Error("Kunde inte hämta prenumerationsnycklar.");
      }

      // Convert ArrayBuffer to base64
      const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
      const authKey = btoa(String.fromCharCode(...new Uint8Array(auth)));

      // Save or update subscription
      const { error: dbError } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth: authKey,
        }, {
          onConflict: "user_id,endpoint"
        });

      if (dbError) {
        console.error("Error saving subscription to database:", dbError);
        throw new Error("Kunde inte spara prenumeration.");
      }

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

