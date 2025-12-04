// Service Worker for Web Push Notifications and Offline Support

const CACHE_NAME = 'ben-hashmashot-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon-512.png',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function() {
        self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return cacheName !== CACHE_NAME;
          })
          .map(function(cacheName) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(function() {
      return clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API calls and external requests
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || 
      url.pathname.startsWith('/api') ||
      url.hostname.includes('supabase') ||
      url.hostname.includes('hebcal')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        // Return cached response if found
        if (cachedResponse) {
          // Fetch in background to update cache
          fetch(event.request)
            .then(function(response) {
              if (response.ok) {
                caches.open(CACHE_NAME)
                  .then(function(cache) {
                    cache.put(event.request, response);
                  });
              }
            })
            .catch(function() {
              // Ignore network errors when updating cache
            });
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(function(response) {
            // Cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(function() {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
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
