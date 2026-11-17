const CACHE_NAME = 'caf-v3';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/blog.html',
  '/contact.html',
  '/events.html',
  '/gallery.html',
  '/post.html',
  '/sermons.html',
  '/videos.html',
  '/offline.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/components.js',
  '/js/supabase.js',
  '/js/phase4.js',
  '/js/phase5.js',
  '/js/app.js',
  '/js/videos.js',
  '/images/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function isSupabaseRequest(request) {
  return request.url.includes('supabase.co') || request.url.includes('/rest/v1/') || request.url.includes('/storage/v1/');
}

function isHtmlRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function isStaticAssetRequest(request) {
  const url = new URL(request.url);
  return request.method === 'GET' &&
    (url.origin === self.location.origin) &&
    (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/') || url.pathname.startsWith('/images/') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.ico') || url.pathname.endsWith('.css') || url.pathname.endsWith('.js'));
}

function isAudioRequest(request) {
  const url = new URL(request.url);
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
  return request.destination === 'audio' || audioExtensions.some((extension) => url.pathname.toLowerCase().endsWith(extension));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (isAudioRequest(request)) return;

  if (isSupabaseRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          if (response.ok && request.url.startsWith('https://scrnhjrlzfaeihapxdsg.supabase.co')) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          if (cached) return cached;
          return caches.match('/offline.html');
        })
    );
    return;
  }

  if (isHtmlRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/offline.html');
        })
    );
    return;
  }

  if (isStaticAssetRequest(request)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200) return response;
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => {});
          return response;
        });
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('controllerchange', () => {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage({ type: 'SW_UPDATE' }));
  });
});
