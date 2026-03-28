// FLN Booster Service Worker
// Enables full offline functionality

const CACHE_NAME = 'fln-booster-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './author.jpg',
  './about.html',
  './manual.html'
];

// Install event – cache all assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => {
      console.log('[SW] Cache failed for some assets:', err);
    })
  );
  self.skipWaiting();
});

// Activate event – clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event – serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // Cache new resources dynamically
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return offline fallback if network fails
        return caches.match('./index.html');
      });
    })
  );
});
