


console.log("Hello from your service worker!");
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/index.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/data.js',
];

const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );



    self.skipWaiting();
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("removing old cache", key);
                        return caches.delete(key);
                    }
                })
            )
        })
    )
    self.clients.claim();

});


/// fetch functionality
self.addEventListener('fetch', function (event) {
    if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (event.request.url.includes("/api/transaction")) {

        event.respondWith(

            caches.open(DATA_CACHE_NAME).then(cache => {

                return fetch(event.request)

                    .then(response => {

                        if (response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    })
                    .catch(() => caches.match(event.request));
            })
                .catch(err => console.log(err))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return caches.open(DATA_CACHE_NAME).then(cache => {


                return fetch(event.request).then(response => {


                    return cache.put(event.request, response.clone()).then(() => {
                        return response;
                    });

                });

            });

        })

    );

});








