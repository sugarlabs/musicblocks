// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

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
