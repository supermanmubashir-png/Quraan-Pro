const CACHE_NAME = "quraan-pro-v6.5.8";

// Files to cache (edit if needed)
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./home.html",
  "./about.html",
  "./updates.html",
  "./changelog.html",
  "./terms.html",
  "./privacy.html"
];

// INSTALL
self.addEventListener("install", event => {
  console.log("Service Worker Installing...");
  
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// ACTIVATE
self.addEventListener("activate", event => {
  console.log("Service Worker Activated");

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
