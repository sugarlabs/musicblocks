/**
 * Displays a temporary overlay showing the current zoom percentage.
 * The overlay appears in the center of the screen and automatically
 * disappears after a short delay.
 *
 * @param {number} scale - Current block scale value (e.g., 1, 1.5, 2).
 */
function showZoomOverlay(scale) {

    // Check if the zoom overlay already exists in the DOM
    let overlay = document.getElementById("zoomOverlay");

    // If it doesn't exist, create it and append it to the document body
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "zoomOverlay";

        // Apply predefined CSS styling
        overlay.classList.add("zoom-overlay");

        // Accessibility: informs screen readers that this content may update
        overlay.setAttribute("aria-live", "polite");

        // Add overlay to the page
        document.body.appendChild(overlay);
    }

    // Convert scale value to percentage and display it
    overlay.textContent = Math.round(scale * 100) + "%";

    // Make the overlay visible
    overlay.classList.add("visible");

    // Clear any existing hide timeout to prevent overlap
    clearTimeout(overlay.hideTimeout);

    // Hide the overlay after 1.5 seconds
    overlay.hideTimeout = setTimeout(() => {
        overlay.classList.remove("visible");
    }, 1500);
}