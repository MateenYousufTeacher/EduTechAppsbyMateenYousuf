// FGL-Bridge – First-Generation Learners Support Ecosystem
// Offline-First Service Worker
// Author: Mateen Yousuf – School Education Department, J&K
// Aligned: NEP 2020 | NCF 2023 | PARAKH | FLN Mission | NIPUN Bharat | Samagra Shiksha

const CACHE = 'fgl-bridge-v1.0';
const OFFLINE = './index.html';

const PRECACHE = [
  './', './index.html', './manifest.json', './author.jpg',
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Quicksand:wght@400;500;600;700&family=Comic+Neue:wght@400;700&display=swap',
];

self.addEventListener('install', e => {
  console.log('[FGL-Bridge SW] Installing...');
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE.filter(u => !u.startsWith('https://fonts') || true)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200) return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => e.request.mode==='navigate' ? caches.match(OFFLINE) : undefined);
    })
  );
});

// Background sync for progress data
self.addEventListener('sync', e => {
  if (e.tag === 'sync-student-progress') {
    e.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  // Production: POST /student-progress, POST /goal, POST /competency-map
  console.log('[FGL-Bridge SW] Syncing student progress & competency data...');
}

// Daily reminder notifications
self.addEventListener('push', e => {
  const d = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(d.title || '🚀 Time to learn, Champion!', {
      body: d.body || 'Your daily goals are waiting. Let\'s earn some XP today! ⭐',
      icon: './manifest.json',
      tag: 'fgl-daily',
      vibrate: [200, 100, 200],
      data: { url: './' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || './'));
});

console.log('[FGL-Bridge SW] Ready ✅ — Every child can soar! 🚀');
