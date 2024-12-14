/*
  global offlineFallbackPage, divInstall
*/

// This is the "Offline page" service worker
const CACHE = "pwabuilder-precache";
const precacheFiles = ["./index.html"];

// Install event
self.addEventListener("install", event => {
    console.log("[PWA Builder] Install Event processing");
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE).then(cache => {
            console.log("[PWA Builder] Caching pages during install");
            return cache.addAll(precacheFiles);
        })
    );
});

// Activate event
self.addEventListener("activate", event => {
    console.log("[PWA Builder] Claiming clients for current page");
    event.waitUntil(self.clients.claim());
});

// Helper functions
const updateCache = async (request, response) => {
    if (response.status === 206) {
        console.log("Partial response is unsupported for caching.");
        return;
    }
    const cache = await caches.open(CACHE);
    return cache.put(request, response);
};

const fromCache = async request => {
    const cache = await caches.open(CACHE);
    const matching = await cache.match(request);
    if (!matching || matching.status === 404) {
        throw "no-match";
    }
    return matching;
};

// Fetch event
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith((async () => {
        try {
            // Try to get from cache first
            const cachedResponse = await fromCache(event.request);
            
            // Update cache in background
            event.waitUntil(
                fetch(event.request).then(response => {
                    if (response.ok) {
                        return updateCache(event.request, response);
                    }
                })
            );
            
            return cachedResponse;
        } catch {
            // Network fetch if not in cache
            try {
                const response = await fetch(event.request);
                if (response.ok) {
                    event.waitUntil(updateCache(event.request, response.clone()));
                }
                return response;
            } catch (error) {
                console.log("[PWA Builder] Network request failed and no cache." + error);
            }
        }
    })());
});

// Install prompt
self.addEventListener("beforeinstallprompt", event => {
    console.log("done", "beforeinstallprompt", event);
    window.deferredPrompt = event;
    divInstall.classList.toggle("hidden", false);
});

// Offline page update
self.addEventListener("refreshOffline", () => {
    const offlinePageRequest = new Request(offlineFallbackPage);
    return fetch(offlineFallbackPage).then(response => {
        return caches.open(CACHE).then(cache => {
            console.log("[PWA Builder] Offline page updated from refreshOffline event: " + response.url);
            return cache.put(offlinePageRequest, response);
        });
    });
});