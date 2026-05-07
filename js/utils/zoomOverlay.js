// Scope variables outside the function so they aren't recreated on every call
let zoomOverlayElement = null;
let zoomHideTimeout = null;

/**
 * Displays a temporary overlay showing the current zoom percentage.
 * The overlay appears in the center of the screen and automatically
 * disappears after a short delay.
 *
 * @param {number} scale - Current block scale value (e.g., 1, 1.5, 2).
 */
function showZoomOverlay(scale) {
    if (!zoomOverlayElement) {
        zoomOverlayElement = document.createElement("div");
        zoomOverlayElement.id = "zoomOverlay";
        zoomOverlayElement.setAttribute("aria-live", "polite");

        // --- CROSS-BROWSER CSS ---
        const style = zoomOverlayElement.style;

    style.position = "fixed";
    style.top = "50%";
    style.left = "50%";

    // Standard transform for centering
    style.transform = "translate(-50%, -50%)";
    style.webkitTransform = "translate(-50%, -50%)"; // Legacy Safari/Chrome support
    style.msTransform = "translate(-50%, -50%)"; // IE 9 support

    // Background and Opacity
    style.backgroundColor = "rgba(0, 0, 0, 0.55)";
    style.color = "#ffffff";
    style.padding = "16px 32px";
    style.borderRadius = "12px";
    style.fontSize = "36px";
    style.fontWeight = "bold";
    style.fontFamily =
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    style.textAlign = "center";

    // Glassmorphism (Backdrop blur) - Requires vendor prefix for Safari
    style.webkitBackdropFilter = "blur(5px)";
    style.backdropFilter = "blur(5px)";

    // Smooth Transitions
    style.zIndex = "10000";
    style.opacity = "1";
    style.pointerEvents = "none"; // Ensures user can click "through" it if it's visible
    style.transition = "opacity 0.3s ease-in-out";
    style.webkitTransition = "opacity 0.3s ease-in-out";
    }

    if (!document.body.contains(zoomOverlayElement)) {
        document.body.appendChild(zoomOverlayElement);
    }

    zoomOverlayElement.textContent = Math.round(scale * 100) + "%";
    zoomOverlayElement.style.opacity = "1";

    // Reset and trigger auto-hide
    if (zoomHideTimeout) clearTimeout(zoomHideTimeout);
    zoomHideTimeout = setTimeout(() => {
        zoomOverlayElement.style.opacity = "0";
    }, 1200);
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = showZoomOverlay;
}
