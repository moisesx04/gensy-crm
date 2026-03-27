const CACHE_NAME = 'gensy-pwa-v5'; // Update to v5 to bust cache
const assets = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    }).catch(err => console.error('SW Cache Error:', err))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Use network first strategy for the main items to avoid locking the user out
      return fetch(event.request).catch(() => response);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim()) // claim clients immediately
  );
});
