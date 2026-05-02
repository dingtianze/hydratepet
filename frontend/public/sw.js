// HydratePet Service Worker - Cache First Strategy
const CACHE_NAME = 'hydratepet-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.error('[SW] Cache failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Cache First strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network First for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Cache First for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch((error) => {
          console.error('[SW] Fetch failed:', error);
          // Return offline fallback if available
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// Background sync for water records
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-water-records') {
    event.waitUntil(syncWaterRecords());
  }
});

// Push notification support
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  // Default notification options
  const options = {
    body: data.body || '该喝水啦！你的宠物渴了~',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'water-reminder',
    requireInteraction: data.requireInteraction ?? true,
    renotify: data.renotify ?? false,
    timestamp: data.timestamp ?? Date.now(),
    data: data.data || {},
    actions: data.actions || [
      { action: 'drink', title: '我喝了💧' },
      { action: 'dismiss', title: '稍后提醒' },
      { action: 'open', title: '打开应用' }
    ],
    vibrate: data.vibrate || [200, 100, 200],
  };

  // Different notification types
  let title = data.title || 'HydratePet';
  if (data.type === 'achievement') {
    title = '🎉 成就解锁！';
    options.badge = '/icons/achievement-badge.png';
  } else if (data.type === 'pet-evolution') {
    title = '🌟 宠物进化了！';
  } else if (data.type === 'goal-complete') {
    title = '🎉 目标达成！';
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );

  // Track notification delivery (if analytics enabled)
  if (data.trackId) {
    event.waitUntil(
      fetch('/api/notifications/delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: data.trackId })
      }).catch(() => {
        // Silently fail - don't block notification display
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'drink') {
    // Open records page with add action
    event.waitUntil(
      self.clients.openWindow('/records?action=add&source=notification')
    );
  } else if (action === 'dismiss') {
    // Dismiss and schedule next reminder (handled by app)
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'NOTIFICATION_DISMISSED',
            timestamp: Date.now()
          });
        }
      })
    );
  } else if (action === 'open' || !action) {
    // Default: open the app
    const urlToOpen = data.url || '/';
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if there's already a window open
        const hadWindowToFocus = clients.some((client) => {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
          return false;
        });

        // If no window open, open a new one
        if (!hadWindowToFocus) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  const data = event.data;
  
  if (data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (data?.type === 'GET_VERSION') {
    event.source?.postMessage({
      type: 'VERSION',
      version: CACHE_NAME
    });
  }
});

async function syncWaterRecords() {
  console.log('[SW] Syncing water records...');
}

console.log('[SW] HydratePet Service Worker loaded');
