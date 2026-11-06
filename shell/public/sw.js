/**
 * Apex Fitness Platform - Root Service Worker
 * Implementa Precaching del Shell, Stale-While-Revalidate y Soporte Offline.
 */

const CACHE_NAME = 'apex-pwa-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// 1. Instalación: Precaching de assets esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching App Shell assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activación: Limpieza de cachés antiguas y reclamar clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purgando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategias de Fetching según el tipo de solicitud
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar métodos no GET (las mutaciones van a través de la cola Outbox en IndexedDB)
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar llamadas de extensiones del navegador
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // A. Peticiones de navegación (HTML): NetworkFirst con fallback a index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // B. Endpoints de lectura de catálogos (/api/catalogos, /api/users/profile, etc.): NetworkFirst con timeout de 3s
  if (url.pathname.startsWith('/api/') && !url.pathname.includes('/auth/')) {
    event.respondWith(
      new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          caches.match(request).then((cached) => {
            if (cached) resolve(cached);
          });
        }, 3000);

        fetch(request)
          .then((networkResponse) => {
            clearTimeout(timeoutId);
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            resolve(networkResponse);
          })
          .catch(async () => {
            clearTimeout(timeoutId);
            const cached = await caches.match(request);
            if (cached) {
              resolve(cached);
            } else {
              resolve(new Response(JSON.stringify({ error: 'Offline', offline: true }), {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }));
            }
          });
      })
    );
    return;
  }

  // C. Archivos estáticos (JS, CSS, Imágenes, Fuentes): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // En offline, ignorar fallo si ya tenemos cachedResponse
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Background Sync / PostMessage listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

