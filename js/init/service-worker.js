// js/init/service-worker.js
// Registers the service worker for PWA offline support in production.
// Extracted from inline script in index.html for CSP compliance.
if ("serviceWorker" in navigator) {
    const allowLocalPwa = localStorage.getItem("allowLocalPwa") === "true";
    const runtimeEnv = window.MB_ENV;
    const isDevMode = runtimeEnv !== "production";

    if (!isDevMode || allowLocalPwa) {
        if (navigator.serviceWorker.controller) {
            console.debug("[PWA Builder] Active service worker found, no need to register");
        } else {
            navigator.serviceWorker
                .register("/sw.js")
                .then(function (reg) {
                    console.debug(
                        "[PWA Builder] Service worker registered for scope: " + reg.scope
                    );
                })
                .catch(function (err) {
                    console.error("[PWA Builder] Service worker registration failed:", err);
                });
        }
    } else {
        console.log("🔥 [DEV MODE] Service worker disabled for instant code updates");
        console.log(
            "Set localStorage.allowLocalPwa = 'true' to enable PWA install testing on localhost."
        );
    }
}
