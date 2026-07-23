const C='orekhovo-v2',F=['./','./index.html','./manifest.json','./icon.svg','./style.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.map(k=>k!==C?caches.delete(k):null))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r&&r.status===200){const c=r.clone();caches.open(C).then(c=>c.put(e.request,c))}return r}).catch(()=>new Response('Офлайн',{status:503}))))});
self.addEventListener('push',e=>{e.waitUntil(self.registration.showNotification('Орехово-Зуево',{body:e.data?e.data.text():'Новое обновление',icon:'icon.svg',badge:'icon.svg',vibrate:[200,100,200],requireInteraction:true}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow('/'))});
console.log('SW loaded');