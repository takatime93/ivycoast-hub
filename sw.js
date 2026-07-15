var CACHE_NAME = "ivyhub-v21"; // bumped for the 2026-07-15 slice-6 run (v20 was committed pre-run; fresh name guarantees cache invalidation on deploy)
var STATIC_ASSETS = [
  "/ivycoast-hub/",
  "/ivycoast-hub/index.html",
  "/ivycoast-hub/links.json",
  "/ivycoast-hub/manifest.json"
];

// Install: pre-cache static assets
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches, notify clients
self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) {
          return k !== CACHE_NAME;
        }).map(function(k) {
          return caches.delete(k);
        })
      );
    }).then(function() {
      // Tell all open tabs that a new version activated
      return self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({ type: "SW_UPDATED" });
        });
      });
    })
  );
  self.clients.claim();
});

// Fetch strategy:
// - Network-only for API/auth
// - Stale-while-revalidate for HTML (instant paint from cache; background
//   fetch refreshes the cache and posts SW_UPDATED when the page changed)
// - Cache-first for other assets (icons, /fonts/, json — lazily cached on first fetch)
self.addEventListener("fetch", function(e) {
  // Skip API and auth calls entirely
  if (e.request.url.includes("script.google.com") ||
      e.request.url.includes("googleapis.com") ||
      e.request.url.includes("gstatic.com") ||
      e.request.url.includes("firebaseapp.com") ||
      e.request.url.includes("version.json")) {
    return;
  }

  // Stale-while-revalidate for HTML pages: serve the cached copy instantly,
  // refresh the cache in the background, and tell open tabs when it changed.
  if (e.request.mode === "navigate" || (e.request.headers.get("accept") || "").includes("text/html")) {
    // Background revalidation: fetch, update the cache, and notify open tabs
    // (existing SW_UPDATED mechanism) when the page actually changed.
    var revalidate = caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        return fetch(e.request).then(function(resp) {
          if (resp && resp.ok) {
            var newTag = resp.headers.get("etag") || resp.headers.get("last-modified") || "";
            var oldTag = cached ? (cached.headers.get("etag") || cached.headers.get("last-modified") || "") : "";
            return cache.put(e.request, resp.clone()).then(function() {
              // Only notify when a stale copy was servable and the page changed.
              if (cached && newTag && newTag !== oldTag) {
                return self.clients.matchAll().then(function(clients) {
                  clients.forEach(function(client) {
                    client.postMessage({ type: "SW_UPDATED" });
                  });
                });
              }
            }).then(function() { return resp; });
          }
          return resp;
        });
      });
    });
    e.waitUntil(revalidate.catch(function() {}));
    // Respond from cache immediately when present; otherwise wait on the network.
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || revalidate.catch(function() { return Response.error(); });
      })
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(resp) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, resp.clone());
          return resp;
        });
      });
    })
  );
});
