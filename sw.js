/*
  global

*/

// This is the "Offline page" service worker

const CACHE = "pwabuilder-precache";
const precacheFiles = [
    /* Add an array of files to precache for your app */
    "./index.html"
];
const offlineFallbackPage = "./index.html";

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
/*
function isPrecachedRequest(request) {
    try {
        const url = new URL(request.url);
        const precached = new Set(precacheFiles.map(path => new URL(path, self.location).href));
        return precached.has(url.href);
    } catch {
        return false;
    }
}

function isStaticAssetRequest(request) {
    // Only allow safe, same-origin, static subresources.
    if (request.method !== "GET") return false;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;

    // Never runtime-cache URLs with query params (precache exact URLs instead).
    if (url.search) return false;

    // Avoid caching programmatic fetch() calls (often API/data requests).
    if (!request.destination) return false;

    // Avoid caching requests that explicitly include credentials.
    if (request.credentials === "include") return false;

    // Avoid range requests.
    if (request.headers.has("range")) return false;

    switch (request.destination) {
        case "style":
        case "script":
        case "image":
        case "font":
        case "manifest":
            return true;
        default:
            return false;
    }
}

function isAppShellNavigation(request) {
    if (request.method !== "GET") return false;
    if (request.mode !== "navigate") return false;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;

    // Only treat the root and index.html as app-shell.
    // Do not cache arbitrary documents.
    if (url.search) return false;
    return url.pathname === "/" || url.pathname.toLowerCase().endsWith("/index.html");
}

function shouldCacheResponse(request, response) {
    if (!response) return false;
    if (!response.ok) return false;
    if (response.status === 206) return false;

    // Only cache same-origin "basic" responses to avoid opaque caching.
    if (response.type !== "basic") return false;

    const cacheControl = (response.headers.get("Cache-Control") || "").toLowerCase();
    if (cacheControl.includes("no-store") || cacheControl.includes("private")) return false;

    // Only cache responses for allowlisted requests (static assets + explicit precache URLs).
    return isStaticAssetRequest(request) || isPrecachedRequest(request);
}
*/
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
                    if (response.ok) {
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
