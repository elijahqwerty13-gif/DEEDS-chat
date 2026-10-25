/**
 * DEEDS CHAT — Production Service Worker
 * Version: 2.1.0
 * 
 * Safe App-Shell Caching:
 * - Pre-caches only core application assets, fonts, and icons.
 * - STRICT SECURITY: NEVER caches Supabase API calls, authentication tokens,
 *   user private messages, WebSockets, or sensitive session data.
 */

const CACHE_NAME = 'deeds-chat-shell-v2';

// Static assets forming the offline app shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

// Domains and endpoints strictly prohibited from caching
function isSensitiveOrDynamic(url, request) {
  // Non-GET requests (POST, PUT, DELETE, PATCH) are never cached
  if (request.method !== 'GET') return true;

  const urlStr = url.toString().toLowerCase();

  // 1. Supabase database, auth, and storage endpoints
  if (urlStr.includes('supabase.co') || urlStr.includes('/auth/v1') || urlStr.includes('/rest/v1')) {
    return true;
  }

  // 2. Realtime WebSocket connections
  if (urlStr.includes('/realtime/v1') || urlStr.startsWith('ws://') || urlStr.startsWith('wss://')) {
    return true;
  }

  // 3. API endpoints that may carry private tokens
  if (urlStr.includes('/api/')) {
    return true;
  }

  // 4. Chrome-extension, data URIs, or non-http protocols
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    return true;
  }

  return false;
}

// Install Event: Precaching App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache app shell files, handling any missing gracefully
      return Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[PWA SW] Precache skipped for ${asset}:`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[PWA SW] Deleting obsolete cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Safe Network-First with Cache Fallback for App Shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If request is sensitive, auth-related, or Supabase, ALWAYS use NetworkOnly
  if (isSensitiveOrDynamic(url, event.request)) {
    // Pure network passthrough — do NOT touch cache
    return;
  }

  // For static fonts (Google Fonts CDN): Cache-First Strategy
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cached);
        });
      })
    );
    return;
  }

  // For navigation and App Shell assets (HTML, JS, CSS, images):
  // Stale-While-Revalidate with fallback to index.html for SPA routes
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Fetch in background to update cache
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Only cache same-origin static assets
            if (url.origin === self.location.origin) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is HTML navigation, fallback to root cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Support manual skip-waiting via message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
