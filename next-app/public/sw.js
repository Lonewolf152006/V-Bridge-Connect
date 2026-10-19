// VBridgeConnect — Production Service Worker
// CAUTION: Strictly caches ONLY immutable static assets and the offline fallback page.
// NEVER caches HTML documents, API endpoints, Server Actions, or authenticated pages.

const CACHE_NAME = 'vbridge-static-v1';
const OFFLINE_FALLBACK_URL = '/offline';

const PRECACHE_ASSETS = [
  OFFLINE_FALLBACK_URL,
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-512x512.png',
];

// 1. Install Event — Pre-cache static shell & offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache warning:', err);
      });
    })
  );
  // Do not automatically skipWaiting here so user can be prompted for update
});

// 2. Activate Event — Clean up stale cache versions & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Message Event — Listen for user click on "Refresh for update"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch Event — Strict Caching Rules
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // A. NEVER intercept non-GET requests (mutations, form posts, Server Actions)
  if (request.method !== 'GET') {
    return;
  }

  // B. NEVER intercept Server Actions (Next.js headers)
  if (
    request.headers.has('next-action') ||
    request.headers.has('x-action-id') ||
    request.headers.has('rsc')
  ) {
    return;
  }

  // C. NEVER cache API responses or NextAuth endpoints
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/auth/')) {
    return;
  }

  // D. HTML Page Navigations: ALWAYS Network-Only to guarantee fresh authenticated state
  // If the user is offline and network fails, serve the static /offline fallback page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        console.warn('[SW] Navigation failed (offline). Serving offline fallback.');
        const cache = await caches.open(CACHE_NAME);
        const fallback = await cache.match(OFFLINE_FALLBACK_URL);
        return fallback || new Response('Offline — Please reconnect to the internet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
    );
    return;
  }

  // E. Cache ONLY versioned immutable static assets (/_next/static/*) and pre-cached icons
  const isVersionedStaticAsset = url.pathname.startsWith('/_next/static/');
  const isPrecachedAsset = PRECACHE_ASSETS.includes(url.pathname);

  if (isVersionedStaticAsset || isPrecachedAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
  }
  // All other requests pass through transparently to the network
});

// 5. Push Event — Web Push listener (Handled in Step 4)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from VBridgeConnect',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/dashboard',
        tag: data.tag || 'vbridge-notification',
      },
      tag: data.tag || 'vbridge-notification',
      renotify: true,
      actions: [
        { action: 'open', title: 'Open VBridge' },
        { action: 'close', title: 'Dismiss' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'VBridgeConnect', options)
    );
  } catch (err) {
    console.error('[SW] Error parsing push data:', err);
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
