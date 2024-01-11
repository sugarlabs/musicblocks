/**
 * Initializes the application when the DOM is ready.
 * @function
 * @global
 */
$(document).ready(function() {
    /**
     * The user's selected mode, stored in local storage.
     * @type {string}
     */
    var mode;
    try {
        mode = localStorage.getItem("beginnerMode") || "true";
    } catch (error) {
        console.error("Error accessing localStorage:", error);
       
        mode = "true"; 
    }


    /**
     * The icon element that displays the user's current mode.
     * @type {HTMLElement}
     */
    var modeIcon = document.getElementById("mode");

    /**
     * The text element that displays the tooltip for the mode icon.
     * @type {HTMLElement}
     */
    var modeText = document.getElementById("modeText");

    // Set the mode icon and tooltip based on the user's selected mode.
    if (mode === null || mode === "true") {
        modeIcon.innerHTML = "star_border";
        modeText.setAttribute("data-tooltip", "Switch to advanced mode");
    } else {
        modeIcon.innerHTML = "star";
        modeText.setAttribute("data-tooltip", "Switch to beginner mode");
    }

    // Initialize Materialize tooltips.
    $(".tooltipped").tooltip();

    // Initialize Materialize dropdowns.
    $(".materialize-iso, .dropdown-trigger").dropdown({
        constrainWidth: false,
        hover: false, // Activate on click
        belowOrigin: true, // Displays dropdown below the button
    });
});
