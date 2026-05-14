// js/init/play-only-mode.js
// Handles play-only mode for small screens, viewport height fix, and canvas resize.
// Extracted from inline script in index.html for CSP compliance.
document.addEventListener("DOMContentLoaded", function () {
    let persistentNotification = null;

    function showPersistentNotification() {
        if (!persistentNotification) {
            persistentNotification = document.createElement("div");
            persistentNotification.id = "persistentNotification";
            persistentNotification.innerHTML =
                "Play only mode enabled. For full Music Blocks experience, use a larger display.";
            document.body.appendChild(persistentNotification);
        }
    }

    function removePersistentNotification() {
        if (persistentNotification) {
            persistentNotification.remove();
            persistentNotification = null;
        }
    }

    function hideElementById(elementId) {
        const elem = document.getElementById(elementId);
        if (elem) elem.style.display = "none";
    }

    function showElementById(elementId) {
        const elem = document.getElementById(elementId);
        if (elem) elem.style.display = "";
    }

    function togglePlayOnlyMode() {
        const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 600;
        const body = document.body;
        const homeButton = document.getElementById("Home [HOME]");

        if (isSmallScreen) {
            body.classList.add("play-only");
            showPersistentNotification();
            hideElementById("palette");
        } else {
            body.classList.remove("play-only");
            removePersistentNotification();
            showElementById("palette");
        }
    }

    togglePlayOnlyMode();
    window.addEventListener("resize", togglePlayOnlyMode);
});

// Viewport height fix for mobile browsers
(function () {
    function setAppHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
    }
    window.addEventListener("resize", setAppHeight);
    document.addEventListener("fullscreenchange", setAppHeight);
    setAppHeight();
})();

// Canvas resize to fill screen
(function () {
    function resizeCanvasesToScreen() {
        const canvases = document.querySelectorAll("canvas");
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvases.forEach(c => {
            c.width = width;
            c.height = height;
            c.style.width = "100%";
            c.style.height = "100%";
        });
    }
    window.addEventListener("resize", resizeCanvasesToScreen);
    document.addEventListener("fullscreenchange", resizeCanvasesToScreen);
    setTimeout(resizeCanvasesToScreen, 150);
})();
