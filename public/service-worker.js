const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/index.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    "/data.js",
    "/manifest.webmanifest"
];

const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v1';

self.addEventListener('install', function (event) {
    console.log("Ran install step")
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


/// fetch happens here -- changed to async killed an error message
self.addEventListener('fetch', async function (event) {
    if (event.request.url.includes('/api/')) {
        if (event.request.method == "GET") {
            await offlineDB(event.request.method);
        }
        console.log('[Service Worker] Fetch(data)', event.request.url);
        event.respondWith(caches.open(DATA_CACHE_NAME).then(cache => {
            console.log(event)
            return fetch(event.request)
                .then(response => {
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }
                    console.log(response)
                    return response;
                }).catch(err => {

                    return cache.match(event.request);
                });
        })

        );

        return;
    }


    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then
                (response => {
                    return response || fetch(event.request);
                });
        })
    );
});



async function offlineDB(record) {
    let db;
    const request = indexedDB.open("budget", 1);
    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        db.createObjectStore("pending", {
            autoIncrement: true

        });
    };


    request.onsuccess = function (event) {
        db = event.target.result;

        if (navigator.online) {
            checkDatabase();

            // } else {
            //     if (record != "GET") {
            //         saveRecord(record);
            //     }
        }
    };

    request.onerror = function (event) {
        console.log("sorry error " + event.target.errorCode);
    };

    function saveRecord(record) {
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.add(record);
    }

    function checkDatabase() {
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        const getAll = store.getAll();

        getAll.onsuccess = function () {
            if (getAll.result.length > 0) {
                fetch("/api/transaction/bulk", {
                    method: "POST",
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                    .then(response => response.json())
                    .then(() => {
                        ///success pending db 
                        const transaction = db.transaction(["pending"], "readwrite");
                        ///pending obj store
                        const store = transaction.objectStore("pending");
                        /// clear
                        store.clear();

                    });
            }
        }
    }
    return;
}



