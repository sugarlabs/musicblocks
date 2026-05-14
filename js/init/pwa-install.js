// js/init/pwa-install.js
// Handles the PWA install prompt and install button behaviour.
// Extracted from inline script in index.html for CSP compliance.
let deferredPrompt;

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    const installButton = document.getElementById("installButton");
    if (installButton) {
        installButton.classList.remove("hidden");
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const installButton = document.getElementById("installButton");
    if (installButton) {
        installButton.addEventListener("click", async function () {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                installButton.classList.add("hidden");
            }
        });
    }
});
