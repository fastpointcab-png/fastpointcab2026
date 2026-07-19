const CACHE_NAME = "fastpointcab-v4";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Install: Cache important files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
  );

  self.skipWaiting();
});


// Activate: Remove old cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});


// Fetch: Fast loading strategy
self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") return;


  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {

        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {

            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {

              const clone = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, clone);
                });
            }

            return networkResponse;
          })
          .catch(() => cachedResponse);


        // Instant cache response, update silently
        return cachedResponse || fetchPromise;

      })
  );
});