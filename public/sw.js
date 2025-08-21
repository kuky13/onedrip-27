const CACHE_NAME = 'oliver-pwa-v1.0.0';
const STATIC_CACHE_NAME = 'oliver-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'oliver-dynamic-v1.0.0';

// Recursos essenciais para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/lovable-uploads/logoo.png'
];

// Recursos que podem ser armazenados dinamicamente
const CACHE_STRATEGIES = {
  // Cache primeiro para recursos estáticos
  CACHE_FIRST: 'cache-first',
  // Rede primeiro para dados dinâmicos
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate para recursos semi-estáticos
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache dos recursos estáticos
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Forçar ativação imediata
      self.skipWaiting()
    ])
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assumir controle de todas as páginas
      self.clients.claim()
    ])
  );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorar requisições não-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estratégia baseada no tipo de recurso
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    event.respondWith(networkFirstStrategy(request));
  }
});

// Estratégia: Cache First (para recursos estáticos)
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return await caches.match('/index.html') || new Response('Offline');
  }
}

// Estratégia: Network First (para dados dinâmicos)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback para navegação
    if (request.destination === 'document') {
      return await caches.match('/index.html') || new Response('Offline');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Estratégia: Stale While Revalidate
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || await fetchPromise;
}

// Helpers para identificar tipos de requisição
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => url.pathname.includes(ext)) || 
         url.pathname.includes('/static/') ||
         url.pathname.includes('/lovable-uploads/');
}

function isApiRequest(url) {
  return url.pathname.includes('/api/') || 
         url.hostname.includes('supabase') ||
         url.hostname.includes('api.');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Limpeza periódica do cache e gerenciamento de notificações
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCaches();
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'SUBSCRIBE_PUSH') {
    event.waitUntil(subscribeToPushNotifications(event.data.userId));
  }
  
  if (event.data && event.data.type === 'UNSUBSCRIBE_PUSH') {
    event.waitUntil(unsubscribeFromPushNotifications());
  }
});

// Função para inscrever-se em notificações push
async function subscribeToPushNotifications(userId) {
  try {
    const subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(getVapidPublicKey())
    });
    
    // Enviar subscription para o servidor
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription,
        userId: userId
      })
    });
    
    console.log('[SW] Successfully subscribed to push notifications');
  } catch (error) {
    console.log('[SW] Error subscribing to push notifications:', error);
  }
}

// Função para cancelar inscrição em notificações push
async function unsubscribeFromPushNotifications() {
  try {
    const subscription = await self.registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[SW] Successfully unsubscribed from push notifications');
    }
  } catch (error) {
    console.log('[SW] Error unsubscribing from push notifications:', error);
  }
}

// Função para converter VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// VAPID public key (deve ser configurada no ambiente)
function getVapidPublicKey() {
  // Esta chave deve ser configurada no ambiente de produção
  return 'BEl62iUYgUivxIkv69yViEuiBIa40HI8YlOu_7_bkPAcp9_MggWPTI9TpXSNjj_-Qx3vhPr1fJ1JMnEdPVgF6RU';
}

// Limpeza automática de caches antigos
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.includes('oliver-') && 
    name !== STATIC_CACHE_NAME && 
    name !== DYNAMIC_CACHE_NAME
  );
  
  return Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  );
}

// Background sync para ações offline
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Implementar sincronização de dados offline
  console.log('[SW] Handling background sync...');
}

// Push notifications melhoradas
self.addEventListener('push', event => {
  console.log('[SW] Push message received');
  
  let notificationData = {
    title: 'Oliver',
    body: 'Nova atualização disponível!',
    type: 'info',
    id: Date.now().toString()
  };
  
  // Parse dos dados da notificação se disponível
  if (event.data) {
    try {
      notificationData = JSON.parse(event.data.text());
    } catch (error) {
      console.log('[SW] Error parsing notification data:', error);
      notificationData.body = event.data.text();
    }
  }
  
  const options = {
    body: notificationData.body,
    icon: '/lovable-uploads/logoo.png',
    badge: '/lovable-uploads/logoo.png',
    vibrate: getVibrationPattern(notificationData.type),
    data: {
      dateOfArrival: Date.now(),
      notificationId: notificationData.id,
      type: notificationData.type,
      url: notificationData.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/lovable-uploads/logoo.png'
      },
      {
        action: 'mark-read',
        title: 'Marcar como lida',
        icon: '/lovable-uploads/logoo.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/lovable-uploads/logoo.png'
      }
    ],
    tag: notificationData.id, // Evita notificações duplicadas
    requireInteraction: notificationData.type === 'error' || notificationData.type === 'warning'
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'Oliver', options)
  );
});

// Função para definir padrão de vibração baseado no tipo
function getVibrationPattern(type) {
  switch (type) {
    case 'error':
      return [200, 100, 200, 100, 200];
    case 'warning':
      return [100, 50, 100, 50, 100];
    case 'success':
      return [100, 50, 100];
    default:
      return [100, 50, 100];
  }
}

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received.');
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;
  
  notification.close();
  
  if (action === 'open' || !action) {
    // Abrir a aplicação na URL específica ou página inicial
    const urlToOpen = data.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // Verificar se já existe uma janela aberta
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.focus();
              client.postMessage({
                type: 'NOTIFICATION_CLICKED',
                notificationId: data.notificationId,
                url: urlToOpen
              });
              return;
            }
          }
          // Se não há janela aberta, abrir uma nova
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (action === 'mark-read') {
    // Marcar notificação como lida
    event.waitUntil(
      markNotificationAsRead(data.notificationId)
    );
  }
  // Ação 'close' não precisa de tratamento adicional
});

// Função para marcar notificação como lida via API
async function markNotificationAsRead(notificationId) {
  try {
    // Enviar mensagem para a aplicação principal para marcar como lida
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'MARK_NOTIFICATION_READ',
        notificationId: notificationId
      });
    });
  } catch (error) {
    console.log('[SW] Error marking notification as read:', error);
  }
}

console.log('[SW] Service Worker loaded successfully');