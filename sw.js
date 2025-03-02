/*
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
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
                }
            }
        )
    );
});

self.addEventListener("beforeinstallprompt", (event) => {
    // eslint-disable-next-line no-console
    console.log("done", "beforeinstallprompt", event);
    // Stash the event so it can be triggered later.
    window.deferredPrompt = event;
    // Remove the "hidden" class from the install button container
    divInstall.classList.toggle("hidden", false);
});

// This is an event that can be fired from your page to tell the SW to
// update the offline page
self.addEventListener("refreshOffline", function () {
    const offlinePageRequest = new Request(offlineFallbackPage);

    return fetch(offlineFallbackPage).then(function (response) {
        return caches.open(CACHE).then(function (cache) {
            // eslint-disable-next-line no-console
            console.log("[PWA Builder] Offline page updated from refreshOffline event: " + response.url);
            return cache.put(offlinePageRequest, response);
        });
    });
});



