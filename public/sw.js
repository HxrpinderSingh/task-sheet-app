const CACHE_NAME = 'sheetflow-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg'
];

// Install Event - Pre-cache offline assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[Service Worker] Pre-cache failed (ignoring for dynamic assets):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Exclude real-time syncing endpoints, API requests, and OAuth/Firebase flows from cache
  if (
    url.pathname.startsWith('/api') || 
    url.hostname.includes('googleapis') || 
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, clone it and save to cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch((err) => {
        console.log('[Service Worker] Network request failed, attempting cache fallback:', err);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback if both fail and it is a document navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          throw err;
        });
      })
  );
});
