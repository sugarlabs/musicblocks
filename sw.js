/*
  global

    offlineFallbackPage
*/

// This is the "Offline page" service worker

const CACHE = "pwabuilder-precache";
const precacheFiles = [
    /* Add an array of files to precache for your app */
    "./index.html",
    // Keep in sync with the query-param URL used in index.html.
    "./css/activities.css?v=fixed"
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
    console.log("[PWA Builder] Claiming clients for current page");
    event.waitUntil(self.clients.claim());
});

// Helper function to check if a request can be cached
function isCacheableRequest(request) {
    const url = new URL(request.url);
    // Only cache HTTP and HTTPS requests
    return url.protocol === "http:" || url.protocol === "https:";
}

// Helper function to determine if a response should be cached
function shouldCacheResponse(request, response) {
    // Don't cache requests with unsupported schemes
    if (!isCacheableRequest(request)) {
        return false;
    }
    // Only cache successful responses
    return response && response.ok;
}

function updateCache(request, response) {
    // Don't cache requests with unsupported schemes
    if (!isCacheableRequest(request)) {
        return Promise.resolve();
    }
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

// If any fetch fails, it will look for the request in the cache and
// serve it from there first
self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fromCache(event.request).then(
            function (response) {
                // Cache hit: return immediately, then update in background.
                event.waitUntil(
                    fetch(event.request).then(function (networkResponse) {
                        if (shouldCacheResponse(event.request, networkResponse)) {
                            return updateCache(event.request, networkResponse.clone());
                        }
                    })
                );
                return response;
            },
            async function () {
                // Cache miss: fetch from network and cache if safe.
                try {
                    const response = await fetch(event.request);
                    if (shouldCacheResponse(event.request, response)) {
                        event.waitUntil(updateCache(event.request, response.clone()));
                    }
                    return response;
                } catch (error) {
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
