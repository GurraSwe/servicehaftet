const CACHE_NAME = "servicehaftet-cache-v1";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  
  // Don't cache API requests (Supabase, external APIs, etc.)
  // Only cache static assets (HTML, CSS, JS, images, etc.)
  const isAPIRequest = url.pathname.includes('/rest/v1/') || 
                       url.pathname.includes('/auth/v1/') ||
                       url.hostname.includes('supabase.co') ||
                       url.hostname.includes('supabase.com');
  
  if (isAPIRequest) {
    // For API requests, always fetch from network (no caching)
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.error("Service worker: API fetch failed:", error);
        // Return a proper error response instead of failing silently
        return new Response(JSON.stringify({ error: "Network request failed" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // For static assets, use cache-first strategy with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (response && response.status === 200 && response.type !== "opaque") {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch((error) => {
                console.error("Service worker: Failed to cache response:", error);
              });
            });
          }
          return response;
        })
        .catch((error) => {
          console.error("Service worker: Fetch failed:", error);
          // For navigation requests, try to return cached index.html
          if (event.request.mode === "navigate") {
            return caches.match("/index.html").then((cachedIndex) => {
              return cachedIndex || new Response("Network error. Please check your connection.", {
                status: 503,
                headers: { "Content-Type": "text/plain" },
              });
            });
          }
          // For other requests, return the error
          throw error;
        });
    }),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "ServiceHäftet";
  const body = data.body || "Du har en ny servicepåminnelse.";
  const url = data.url || "/dashboard";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon/icon.jpeg",
      badge: "/icon/icon.jpeg",
      data: { url }
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});

