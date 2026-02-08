/*
  global

    offlineFallbackPage
*/

// This is the "Offline page" service worker

const CACHE_PREFIX = "pwabuilder-precache";
const CACHE_VERSION = "v2";
const CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}`;
const precacheFiles = [
    /* Add an array of files to precache for your app */
    "./index.html"
];

self.addEventListener("install", function (event) {
    // eslint-disable-next-line no-console
    console.log("[PWA Builder] Install Event processing");

    // eslint-disable-next-line no-console
    console.log("[PWA Builder] Skip waiting on install");
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE).then(function (cache) {
            // eslint-disable-next-line no-console
            console.log("[PWA Builder] Caching pages during install");
            return cache.addAll(precacheFiles);
        })
    );
});

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
    // eslint-disable-next-line no-console
    console.log("[PWA Builder] Claiming clients for current page and cleaning old caches");
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            const staleCaches = cacheNames.filter(function (cacheName) {
                return cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE;
            });

            return Promise.all(
                staleCaches.map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            ).then(function () {
                return self.clients.claim();
            });
        })
    );
});

function updateCache(request, response) {
    if (response.status === 206) {
        console.log("Partial response is unsupported for caching.");
        return Promise.resolve();
    }
    return caches.open(CACHE).then(function (cache) {
        return cache.put(request, response);
    });
}

function fromCache(request) {
    // Check to see if you have it in the cache
    // Return response
    // If not in the cache, then return
    return caches.open(CACHE).then(function (cache) {
        return cache.match(request).then(function (matching) {
            if (!matching || matching.status === 404) {
                return Promise.reject("no-match");
            }

            return matching;
        });
    });
}

async function getOfflineFallbackResponse(error) {
    // eslint-disable-next-line no-console
    console.log("[PWA Builder] Network request failed and no cache." + error);

    if (typeof offlineFallbackPage !== "undefined") {
        const fallbackResponse = await caches.match(offlineFallbackPage);
        if (fallbackResponse) return fallbackResponse;
    }

    return new Response("Service Unavailable", {
        status: 503,
        statusText: "offline"
    });
}

// If any fetch fails, it will look for the request in the cache and
// serve it from there first
self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET" || !event.request.url.startsWith("http")) return;

    const isNavigationRequest =
        event.request.mode === "navigate" || event.request.destination === "document";

    if (isNavigationRequest) {
        event.respondWith(
            (async function () {
                try {
                    const response = await fetch(event.request);
                    if (response.ok) {
                        event.waitUntil(updateCache(event.request, response.clone()));
                    }
                    return response;
                } catch (error) {
                    try {
                        return await fromCache(event.request);
                    } catch (cacheError) {
                        const cachedIndex = await caches.match("./index.html");
                        if (cachedIndex) {
                            return cachedIndex;
                        }
                        return getOfflineFallbackResponse(error);
                    }
                }
            })()
        );
        return;
    }

    event.respondWith(
        fromCache(event.request).then(
            function (response) {
                // The response was found in the cache so we responde
                // with it and update the entry

                // This is where we call the server to get the newest
                // version of the file to use the next time we show view
                event.waitUntil(
                    fetch(event.request).then(function (response) {
                        if (response.ok) {
                            return updateCache(event.request, response);
                        }
                    })
                );

                return response;
            },
            async function () {
                // The response was not found in the cache so we look
                // for it on the server
                try {
                    const response = await fetch(event.request);
                    // If request was success, add or update it in the cache
                    if (response.ok) {
                        event.waitUntil(updateCache(event.request, response.clone()));
                    }
                    return response;
                } catch (error) {
                    return getOfflineFallbackResponse(error);
                }
            }
        )
    );
});

// This is an event that can be fired from your page to tell the SW to
// update the offline page
self.addEventListener("refreshOffline", function () {
    if (typeof offlineFallbackPage !== "string" || offlineFallbackPage.trim().length === 0) {
        // eslint-disable-next-line no-console
        console.log("[PWA Builder] refreshOffline ignored: offlineFallbackPage is not set");
        return Promise.resolve();
    }

    const offlinePageRequest = new Request(offlineFallbackPage);

    return fetch(offlineFallbackPage).then(function (response) {
        return caches.open(CACHE).then(function (cache) {
            // eslint-disable-next-line no-console
            console.log(
                "[PWA Builder] Offline page updated from refreshOffline event: " + response.url
            );
            return cache.put(offlinePageRequest, response);
        });
    });
});
