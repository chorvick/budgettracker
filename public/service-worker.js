const { response } = require("express");

console.log("Hello from your service worker!");
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/index.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );



    self.skipWaiting();
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', (event) => {
    EventTarget.waitUntil(
        caches.keys().then(keylist => {
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
    self.ClientRectList.claim();

});


/// fetch functionality
self.addEventListener('fetch', async function (event) {
    if (event.request.url.includes("/api/")) {
        if (event.request.method == "GET") {
            await offlineDB(event.request.method);
        }
        console.log(event);
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {

                return fetch(event.request)
                    .then(response => {
                        if (response.status === 200) {
                            cache.put(event.request.jurl, response.clone());
                        }
                        return response;
                    })
                    .catch(err => {
                        return cache.match(event.request);
                    });
            }).catch(err => console.log(err))
        );
        return;
    }
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        })
    )

});



