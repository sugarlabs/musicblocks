/**
 * Displays a temporary overlay showing the current zoom percentage.
 * The overlay appears in the center of the screen and automatically
 * disappears after a short delay.
 *
 * @param {number} scale - Current block scale value (e.g., 1, 1.5, 2).
 */
function showZoomOverlay(scale) {

    let overlay = document.getElementById("zoomOverlay");

    // If it doesn't exist, create it and append it to the document body
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "zoomOverlay";

        overlay.classList.add("zoom-overlay");

        overlay.setAttribute("aria-live", "polite");

        // Add overlay to the page
        document.body.appendChild(overlay);
    }

    // Convert scale value to percentage and display it
    overlay.textContent = Math.round(scale * 100) + "%";

    overlay.classList.add("visible");

    clearTimeout(overlay.hideTimeout);

    // Hide the overlay after 1.5 seconds
    overlay.hideTimeout = setTimeout(() => {
        overlay.classList.remove("visible");
    }, 1500);
}