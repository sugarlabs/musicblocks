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

function isSameOrigin(url) {
    return url.origin === self.location.origin;
}

function hasQueryParams(url) {
    return typeof url.search === "string" && url.search.length > 0;
}

function hasNoStoreOrPrivateCacheControl(response) {
    const cacheControl = response.headers.get("Cache-Control");
    if (!cacheControl) return false;
    return /(?:^|,)(?:\s*)(no-store|private)(?:\s*)(?:,|$)/i.test(cacheControl);
}

function isAllowedStaticDestination(destination) {
    // NOTE: Intentionally excludes 'document' to avoid caching dynamic/user-specific pages.
    // App-shell HTML should be handled via explicit precache (see precacheFiles).
    const allowed = new Set([
        "style",
        "script",
        "worker",
        "image",
        "font",
        "manifest",
        "audio",
        "video"
    ]);
    return allowed.has(destination);
}

function isAllowedStaticPathname(pathname) {
    // Strict allowlist by file extension (no query strings). Keeps runtime caching scoped to static assets.
    return /\.(?:css|js|mjs|json|map|wasm|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|mp3|wav|ogg|m4a|mp4|webm)$/i.test(
        pathname
    );
}

function shouldHandleCachingForRequest(request) {
    if (request.method !== "GET") return false;

    const url = new URL(request.url);
    if (!isSameOrigin(url)) return false;
    if (hasQueryParams(url)) return false;

    // Avoid caching requests that are more likely to be user-specific.
    // We conservatively skip credentialed requests only when explicitly forced to include.
    // (Static subresources typically use 'same-origin'.)
    if (request.credentials === "include") return false;
    if (request.headers.has("Authorization")) return false;

    // Don't cache Range requests.
    if (request.headers.has("Range")) return false;

    // Respect request-side no-store.
    if (request.cache === "no-store") return false;

    // Only cache static subresources by destination.
    if (!isAllowedStaticDestination(request.destination)) return false;

    return isAllowedStaticPathname(url.pathname);
}

function shouldCacheResponse(request, response) {
    // IMPORTANT: This function assumes the request has already passed
    // shouldHandleCachingForRequest(). Keep it focused on response safety checks.
    if (!response) return false;
    if (!response.ok) return false;
    if (response.status === 206) return false;
    if (hasNoStoreOrPrivateCacheControl(response)) return false;

    // Cross-origin responses should never reach here due to request gating.
    // Still, avoid caching opaque responses defensively.
    if (response.type === "opaque") return false;

    // If the response varies on everything, it is not safe to cache.
    const vary = response.headers.get("Vary");
    if (vary && vary.trim() === "*") return false;

    return true;
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

    // Only cache a strict allowlist of same-origin static assets.
    // For all other GETs, fall back to default network behavior to avoid
    // caching user-specific or dynamic content.
    if (!shouldHandleCachingForRequest(event.request)) {
        // Preserve offline fallback behavior for navigations.
        if (event.request.mode === "navigate") {
            event.respondWith(
                fetch(event.request).catch(async function (error) {
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
                })
            );
        }
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
                        if (shouldCacheResponse(event.request, response)) {
                            return updateCache(event.request, response.clone());
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
