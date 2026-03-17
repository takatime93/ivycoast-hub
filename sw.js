var CACHE_NAME = "ivyhub-v4";
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
// - Network-first for HTML (always get latest page)
// - Cache-first for other assets (icons, fonts, json)
self.addEventListener("fetch", function(e) {
  // Skip API and auth calls entirely
  if (e.request.url.includes("script.google.com") ||
      e.request.url.includes("googleapis.com") ||
      e.request.url.includes("gstatic.com") ||
      e.request.url.includes("firebaseapp.com") ||
      e.request.url.includes("version.json")) {
    return;
  }

  // Network-first for HTML pages
  if (e.request.mode === "navigate" || e.request.headers.get("accept").includes("text/html")) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, resp.clone());
          return resp;
        });
      }).catch(function() {
        return caches.match(e.request);
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
