// Service Worker for Web Push Notifications and Offline Support

// v2: the site is now server-rendered. Pages (HTML) are always fetched from the
// network first so visitors never get a stale copy; the last good copy is kept
// only as an offline fallback. Old v1 caches (which held the previous site) are removed.
const CACHE_NAME = 'ben-hashmashot-v2';
const STATIC_ASSETS = ['/icon-512.png', '/manifest.json'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(STATIC_ASSETS); })
      .catch(function() {})
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names
          .filter(function(name) { return name.indexOf('ben-hashmashot-') === 0 && name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin ||
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/_serverFn') ||
      url.pathname.startsWith('/~oauth')) {
    return;
  }

  // Pages: network first, cached copy only when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); });
          }
          return response;
        })
        .catch(function() {
          return caches.match(event.request).then(function(cached) {
            return cached || caches.match('/') || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Hashed build assets and icons: cache first, then network.
  if (url.pathname.startsWith('/assets/') || /\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(function(cached) {
        if (cached) return cached;
        return fetch(event.request).then(function(response) {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); });
          }
          return response;
        });
      })
    );
  }
});

// Push notification event
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  let data = {
    title: 'בין השמשות',
    body: 'התראה חדשה',
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    dir: 'rtl',
    lang: 'he'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-512.png',
    badge: data.badge || '/icon-512.png',
    dir: data.dir || 'rtl',
    lang: data.lang || 'he',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/'
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window/tab open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Sync any pending notification preferences when back online
      Promise.resolve()
    );
  }
});

// Message handler for cache updates
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(function(cache) {
          return cache.addAll(event.data.payload);
        })
    );
  }
});
