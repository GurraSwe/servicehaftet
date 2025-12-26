const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function registerPWA() {
  if (!("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }

  return navigator.serviceWorker
    .register("/service-worker.js")
    .catch((error) => {
      console.error("Service worker registration failed:", error);
      return null;
    });
}

export async function requestBrowserNotificationPermission() {
  if (!("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission !== "default") {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export async function subscribeUserToPush(registration: ServiceWorkerRegistration) {
  if (!("PushManager" in window)) {
    throw new Error("PushManager not supported in this browser.");
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn("VITE_VAPID_PUBLIC_KEY is not set. Push subscription skipped.");
    return null;
  }

  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    return existingSubscription;
  }

  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

