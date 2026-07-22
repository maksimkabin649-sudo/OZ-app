// Service Worker для PWA приложения "Орехово-Зуево"

const CACHE_NAME = 'orekhovo-zuevo-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Иконки (если есть)
  '/icon-192.png',
  '/icon-512.png'
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
  // Игнорируем запросы к API и внешним ресурсам
  const url = new URL(event.request.url);
  
  // Для HTML и основных ресурсов - используем кэш
  if (event.request.mode === 'navigate' || 
      event.request.destination === 'document' ||
      event.request.destination === 'script' ||
      event.request.destination === 'style' ||
      event.request.destination === 'image') {
    
    event.respondWith(
      caches.match(event.request)
        .then(function(cachedResponse) {
          if (cachedResponse) {
            // Возвращаем из кэша
            return cachedResponse;
          }
          
          // Если нет в кэше - идём в сеть
          return fetch(event.request)
            .then(function(networkResponse) {
              // Кэшируем ответ для будущих запросов
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
              // Если сеть недоступна и нет кэша - возвращаем fallback
              console.log('⚠️ Сеть недоступна, fallback:', error);
              return new Response('Офлайн - страница не доступна', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  } else {
    // Для остальных запросов - только сеть
    event.respondWith(fetch(event.request));
  }
});

// Обработка push-уведомлений (опционально)
self.addEventListener('push', function(event) {
  const title = 'Орехово-Зуево';
  const options = {
    body: 'Новое место добавлено!',
    icon: 'icon-192.png',
    badge: 'icon-192.png'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('✅ Service Worker загружен');