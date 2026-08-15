// COPYRIGHT (c) 2018,19 Austin George
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* exported Toolbar */

// Thin compatibility shim to keep the "activity/toolbar" module path working.
// Explicitly depends on activity/toolbar-ui to ensure correct load ordering via RequireJS.
if (typeof define === "function" && define.amd) {
    define(["activity/toolbar-ui"], function (ToolbarUI) {
        window.Toolbar = ToolbarUI;
        return ToolbarUI;
    });
} else if (typeof module !== "undefined" && module.exports) {
    const ToolbarUI = require("./toolbar-ui");
    module.exports = ToolbarUI;
    module.exports.FocusCycleManager = ToolbarUI.FocusCycleManager;
}
