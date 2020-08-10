/**
 * @file This contains the prototype of the JavaScript Editor Widget.
 * @author Anindya Kundu
 *
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
*/

/**
 * Class pertaining to all features of the JavsScript Editor for writing and reviewing corresponding
 * JavaScript code for Music Blocks programs.
 *
 * @class
 *
 * Private methods' names begin with underscore '_".
 * Unused methods' names begin with double underscore '__'.
 * Internal functions' names are in PascalCase.
 */
class JSEditor {
    init() {
        this.isOpen = true;

        let widgetWindow = window.widgetWindows.windowFor(this, "JavaScript Editor", "JavaScript Editor");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        let that = this;
        widgetWindow.onClose = function() {
            that.isOpen = false;
            this.destroy();
        };

        // Position the widget and make it visible
        this._editor = document.createElement("div");

        // Give the DOM time to create the div
        setTimeout(() => this.setup(), 100);
    }

    setup() {
        this._editor.style.width = "30rem";
        this._editor.style.height = "30rem";
        this._editor.style.background = "#0984e3";

        this._editor.innerHTML = "ALL THE CODE GOES IN HERE";

        this.widgetWindow.getWidgetBody().append(this._editor);

        this.widgetWindow.takeFocus();
    }
}
