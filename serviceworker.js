const CACHE_NAME = 'orekhovo-v2';
const FILES = ['./', './index.html', './manifest.json', './icon.svg', './style.css'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Кэширование');
        return cache.addAll(FILES);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаление:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(cached) {
        if (cached) return cached;
        return fetch(event.request)
          .then(function(response) {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(function() {
            return new Response('Офлайн режим', { status: 503 });
          });
      })
  );
});

self.addEventListener('push', function(event) {
  const title = 'Орехово-Зуево';
  const options = {
    body: event.data ? event.data.text() : 'Новое обновление в Орехово-Зуево',
    icon: 'icon.svg',
    badge: 'icon.svg',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: {
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('Service Worker загружен');