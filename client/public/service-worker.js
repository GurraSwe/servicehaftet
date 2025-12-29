// Cache version - increment this on each deploy to force cache invalidation
// The network-first strategy for HTML/JS files ensures fresh content, but this helps clear old caches
const CACHE_VERSION = "v2";
const CACHE_NAME = `servicehaftet-cache-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",
];

self.addEventListener("install", (event) => {
  console.log("Service worker installing with cache:", CACHE_NAME);
  // Force immediate activation of new service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((error) => {
        console.error("Failed to precache some URLs:", error);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activating, clearing old caches");
  
  event.waitUntil(
    Promise.all([
      // Delete ALL old caches (not just ones that don't match current name)
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("Deleting old cache:", name);
              return caches.delete(name);
            }
          })
        );
      }),
      // Immediately take control of all clients
      self.clients.claim(),
      // Notify all clients that a new service worker is active
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SW_UPDATED",
            cacheName: CACHE_NAME,
          });
        });
      }),
    ])
  );
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

  // For HTML and JS files, use NETWORK-FIRST strategy to always get latest version
  // For other static assets (images, fonts), use cache-first
  const isHTML = event.request.mode === "navigate" || 
                 event.request.headers.get("accept")?.includes("text/html");
  const isJS = event.request.url.endsWith(".js") || 
               event.request.url.includes("/src/") ||
               event.request.url.includes("/assets/");

  if (isHTML || isJS) {
    // NETWORK-FIRST: Always try network first, fallback to cache only if offline
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we got a fresh response, update cache
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
        .catch(() => {
          // Network failed, try cache as fallback
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If it's a navigation request and we have no cache, return index.html
            if (isHTML) {
              return caches.match("/index.html");
            }
            throw new Error("Network failed and no cache available");
          });
        })
    );
    return;
  }

  // For other static assets (images, fonts, CSS), use cache-first
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

