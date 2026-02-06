/*
  global

    offlineFallbackPage
*/

// This is the "Offline page" service worker

const CACHE = "pwabuilder-precache";
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
    console.log("[PWA Builder] Claiming clients for current page");
    event.waitUntil(self.clients.claim());
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

// If any fetch fails, it will look for the request in the cache and
// serve it from there first
self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") return;

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
                    // eslint-disable-next-line no-console
                    console.log("[PWA Builder] Network request failed and no cache." + error);

                    if (typeof offlineFallbackPage !== "undefined" && offlineFallbackPage) {
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
    if (typeof offlineFallbackPage === "undefined" || !offlineFallbackPage) {
        // eslint-disable-next-line no-console
        console.log("[PWA Builder] refreshOffline skipped: offlineFallbackPage is not defined");
        return;
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
    }).catch(function (error) {
        // eslint-disable-next-line no-console
        console.log("[PWA Builder] refreshOffline failed: " + error);
    });
});
