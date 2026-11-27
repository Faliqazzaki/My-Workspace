const CACHE_NAME = 'my-workspace-v1';
const PRECACHE_ASSETS = [
    '/offline.html',
    '/manifest.webmanifest',
    '/favicon.ico',
    '/favicon.svg',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-512x512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                        return null;
                    }),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Hanya tangani permintaan GET; mutasi (POST, PUT, PATCH, DELETE) dilewatkan
    // langsung agar tidak mengganggu login, logout, atau proteksi token CSRF.
    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    // 1. Permintaan navigasi halaman HTML (Network-first dengan fallback ke offline.html)
    // Jangan menyimpan respons navigasi atau HTML terautentikasi ke dalam cache.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(async () => {
                const cache = await caches.open(CACHE_NAME);
                const offlineResponse = await cache.match('/offline.html');
                return offlineResponse || new Response('Offline', { status: 503 });
            }),
        );
        return;
    }

    // Lewati respons Inertia dan permintaan JSON terautentikasi (TIDAK disimpan ke cache)
    if (
        request.headers.get('X-Inertia') ||
        request.headers.get('Accept')?.includes('application/json')
    ) {
        return;
    }

    // 2. Aset build Vite statis (/build/assets/*) dengan strategi Cache-First
    if (
        url.origin === self.location.origin &&
        url.pathname.startsWith('/build/assets/')
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    return cached;
                }

                return fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            }),
        );
        return;
    }

    // 3. Aset statis ter-precache (offline.html, manifest, ikon)
    if (
        url.origin === self.location.origin &&
        PRECACHE_ASSETS.includes(url.pathname)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => cached || fetch(request)),
        );
    }
});
