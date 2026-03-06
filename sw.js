const CACHE_NAME = 'courses-malin-v2.8'; // mettez à jour la version
const urlsToCache = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/css/style2.css',
  './assets/js/script.js',        // attention : vous aviez script.min.js
  './assets/js/i18n.js',
  './assets/js/units.js',
  './assets/js/dragdrop.js',
  './assets/js/speech.js',
  './assets/js/geolocation.js',
  './assets/images/LogoCourses.webp',
  './assets/images/QRcode7.webp',
  './assets/images/iconeCSV.svg',
  './assets/images/iconeIMPORT.svg',
  './assets/images/iconeTXT.svg',
  './assets/icon/android-chrome-192x192.png',   // optionnel
  './assets/icon/android-chrome-512x512.png',   // optionnel
  './site.webmanifest'                           // optionnel
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});