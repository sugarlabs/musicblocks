var CACHE_NAME = 'music-blocks-site-cache-v1';
var urlsToCache = [
    '/index.html',
    '/loading-animatoon.gif',
    '/header-icons',
    '/images',
    '/lib',
    '/sounds',
    '/css',
    '/js'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});
