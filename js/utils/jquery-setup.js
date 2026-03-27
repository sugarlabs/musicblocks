/*
 * jQuery/jQuery-UI/Materialize post-load setup.
 *
 * This file is loaded with "defer" after jQuery, jQuery-UI, and
 * Materialize so that those three libraries can also be deferred
 * (removing ~550 KB of render-blocking JavaScript).
 *
 * Contents were previously inline <script> blocks in index.html.
 */

// Bridge jQuery-UI autocomplete with Materialize so both coexist.
jQuery(document).ready(function () {
    if (jQuery.ui && jQuery.ui.autocomplete) {
        jQuery.fn.materializeAutocomplete = jQuery.fn.autocomplete;
        jQuery.widget.bridge("autocomplete", jQuery.ui.autocomplete);
    }
});

// Fix autocomplete dropdown position to stay anchored to the search input.
jQuery(document).ready(function () {
    const fixAutocompletePosition = function () {
        const $search = jQuery("#search");
        if ($search.length && $search.data("ui-autocomplete")) {
            const instance = $search.autocomplete("instance");
            if (instance) {
                const originalRenderMenu = instance._renderMenu;
                instance._renderMenu = function (ul, items) {
                    originalRenderMenu.call(this, ul, items);
                    setTimeout(() => {
                        const searchInput = document.querySelector("#search");
                        const dropdown = ul[0];
                        if (searchInput && dropdown) {
                            const rect = searchInput.getBoundingClientRect();
                            dropdown.style.position = "fixed";
                            dropdown.style.left = rect.left + "px";
                            dropdown.style.top = rect.bottom + 2 + "px";
                            dropdown.style.width = rect.width + "px";
                        }
                    }, 0);
                };
            }
        } else {
            setTimeout(fixAutocompletePosition, 500);
        }
    };
    setTimeout(fixAutocompletePosition, 1000);
});
