// Service Worker untuk caching dan offline support
const CACHE_NAME = 'musik-hanif-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './gambar/song1.jpg',
  './gambar/song2.jpeg',
  './gambar/song3.jpg',
  './gambar/song4.jpg',
  './lagu/song1.mp3',
  './lagu/song2.mp3',
  './lagu/song3.mp3',
  './lagu/song4.mp3',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch resources
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Update Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
