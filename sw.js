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

    // Cleanup: remove any previously-cached non-static GET responses.
    // This prevents serving stale / user-specific / poisoned cache entries
    // that older SW versions may have cached.
    event.waitUntil(
        (async () => {
            await self.clients.claim();

            const cache = await caches.open(CACHE);
            const keys = await cache.keys();
            const keepUrls = new Set(precacheFiles.map(path => new URL(path, self.location).href));

            for (const request of keys) {
                try {
                    const url = new URL(request.url);
                    if (keepUrls.has(url.href)) continue;
                    if (url.origin !== self.location.origin) {
                        await cache.delete(request);
                        continue;
                    }
                    if (url.search) {
                        await cache.delete(request);
                        continue;
                    }

                    const pathname = url.pathname.toLowerCase();
                    const isStaticPath =
                        pathname === "/" ||
                        pathname.endsWith("/index.html") ||
                        /\.(css|js|mjs|json|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|eot|mp3|wav|webm|mp4)$/i.test(
                            pathname
                        );

                    if (!isStaticPath) {
                        await cache.delete(request);
                    }
                } catch {
                    // If the URL can't be parsed, treat it as unsafe.
                    await cache.delete(request);
                }
            }
        })()
    );
});

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

    // App-shell offline support: serve cached index.html for navigations.
    if (isAppShellNavigation(event.request)) {
        event.respondWith(
            (async () => {
                const indexRequest = new Request("./index.html");
                try {
                    const cached = await fromCache(indexRequest);
                    // Update the cached app-shell in the background.
                    event.waitUntil(
                        fetch(indexRequest).then(function (response) {
                            if (shouldCacheResponse(indexRequest, response)) {
                                return updateCache(indexRequest, response.clone());
                            }
                        })
                    );
                    return cached;
                } catch {
                    // No cached app-shell yet: fall back to network.
                    return fetch(event.request);
                }
            })()
        );
        return;
    }

    // Only use cache-first for explicit precache URLs and allowlisted static assets.
    const canUseCache = isPrecachedRequest(event.request) || isStaticAssetRequest(event.request);
    if (!canUseCache) {
        // Network-only for everything else (prevents caching/serving user-specific responses).
        event.respondWith(fetch(event.request));
        return;
    }

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
