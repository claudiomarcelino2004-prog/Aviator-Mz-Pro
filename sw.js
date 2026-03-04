// Service Worker - Aviator MZ Pro
const CACHE_NAME = 'aviator-mz-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap'
];

// Instalação
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('[SW] Erro ao cachear:', err);
      })
  );
  self.skipWaiting();
});

// Ativação
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estratégia: Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se encontrou no cache, retorna
        if (response) {
          console.log('[SW] Servindo do cache:', event.request.url);
          return response;
        }

        // Se não, busca da rede
        console.log('[SW] Buscando da rede:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta
            const responseToCache = response.clone();

            // Adiciona ao cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((err) => {
            console.log('[SW] Erro na requisição:', err);
            
            // Retorna página offline se disponível
            return caches.match('./index.html');
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Sincronizando dados...');
  // Implementação futura
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Novo sinal disponível!',
    icon: 'https://i.imgur.com/8HQwLua.png',
    badge: 'https://i.imgur.com/8HQwLua.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Aviator MZ Pro', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event.action);
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

console.log('[SW] Service Worker carregado com sucesso!');
