/**
 * Displays a temporary overlay showing the current zoom percentage.
 * The overlay appears in the center of the screen and automatically
 * disappears after a short delay.
 *
 * @param {number} scale - Current block scale value (e.g., 1, 1.5, 2).
 */
function showZoomOverlay(scale) {
    let overlay = document.getElementById("zoomOverlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "zoomOverlay";
        overlay.className = "zoom-overlay";
        overlay.setAttribute("aria-live", "polite");

        document.documentElement.appendChild(overlay);
    }

    overlay.textContent = Math.round(scale * 100) + "%";

    overlay.style.position = "fixed";
    overlay.style.top = "50%";
    overlay.style.left = "50%";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.background = "black"; 
    overlay.style.color = "white";
    overlay.style.zIndex = "2147483647";
    overlay.style.opacity = "1";
    overlay.style.fontSize = "56px";

    clearTimeout(overlay.hideTimeout);
    overlay.hideTimeout = setTimeout(() => {
        overlay.style.opacity = "0";
    }, 1500);
}
