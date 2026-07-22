// Service Worker для PWA приложения "Орехово-Зуево"

const CACHE_NAME = 'orekhovo-zuevo-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.css'
];

// Устанавливаем кэш при установке SW
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('📦 Кэширование статики');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// Активация и очистка старых кэшей
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Стратегия: кэш сначала, потом сеть (Cache First)
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Кэшируем только свои ресурсы
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      event.request.destination === 'script' ||
      event.request.destination === 'style') {
    
    event.respondWith(
      caches.match(event.request)
        .then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(function(networkResponse) {
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(function(cache) {
                    cache.put(event.request, responseClone);
                  });
              }
              return networkResponse;
            })
            .catch(function(error) {
              console.log('⚠️ Сеть недоступна');
              return new Response('Вы офлайн. Приложение работает в автономном режиме.', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  } else {
    event.respondWith(fetch(event.request));
  }
});

console.log('✅ Service Worker загружен');