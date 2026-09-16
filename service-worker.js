const CACHE = 'gymlog-v0.1.0';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './program.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/exercises/goblet_squat.png',
  './assets/exercises/neutral_db_press.png',
  './assets/exercises/db_bench_press.png',
  './assets/exercises/hammer_curl.png',
  './assets/exercises/forearm_plank.png',
  './assets/exercises/db_rdl.png',
  './assets/exercises/chest_supported_row.png',
  './assets/exercises/lateral_raise.png',
  './assets/exercises/incline_curl.png',
  './assets/exercises/pallof_press.png',
  './assets/exercises/step_ups.png',
  './assets/exercises/lat_pulldown.png',
  './assets/exercises/face_pull.png',
  './assets/exercises/supinated_curl.png',
  './assets/exercises/suitcase_carry.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
