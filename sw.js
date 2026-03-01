var CACHE_NAME = "ivyhub-v1";
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

// Activate: clean old caches
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
    })
  );
  self.clients.claim();
});

// Fetch: network-only for API/auth, cache-first for everything else
self.addEventListener("fetch", function(e) {
  if (e.request.url.includes("script.google.com") ||
      e.request.url.includes("googleapis.com") ||
      e.request.url.includes("gstatic.com") ||
      e.request.url.includes("firebaseapp.com")) {
    return;
  }
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
