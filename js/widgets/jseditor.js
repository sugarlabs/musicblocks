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

        this.widgetWindow =
            window.widgetWindows.windowFor(this, "JavaScript Editor", "JavaScript Editor");
        this.widgetWindow.clear();
        this.widgetWindow.show();
        this.widgetWindow.setPosition(160, 160);

        let that = this;
        this.widgetWindow.onClose = function() {
            that.isOpen = false;
            this.destroy();
        };

        // Position the widget and make it visible
        this._editor = document.createElement("div");

        // Give the DOM time to create the div
        setTimeout(() => this.setup(), 100);
    }

    setup() {
        this._editor.style.width = "35rem";
        this._editor.style.height = "40rem";
        this._editor.style.display = "flex";
        this._editor.style.flexDirection = "column";

        let menubar = document.createElement("div");
            menubar.id = "js_editor_menu";
            menubar.style.width = "100%";
            menubar.style.height = "3rem";
            menubar.style.display = "flex";
            menubar.style.flexDirection = "row";
            menubar.style.justifyContent = "end";
            menubar.style.alignItems = "center";
            menubar.style.background = "#1e88e5";
            menubar.style.color = "white";

            let generateBtn = document.createElement("span");
                generateBtn.classList.add("material-icons");
                generateBtn.style.borderRadius = "50%";
                generateBtn.style.padding = ".25rem";
                generateBtn.style.marginLeft = ".75rem";
                generateBtn.style.fontSize = "2rem";
                generateBtn.style.background = "#2196f3";
                generateBtn.style.cursor = "pointer";
                generateBtn.innerHTML = "autorenew";
                generateBtn.onclick = this.generateCode;
            menubar.appendChild(generateBtn);

            let runBtn = document.createElement("span");
                runBtn.classList.add("material-icons");
                runBtn.style.borderRadius = "50%";
                runBtn.style.padding = ".25rem";
                runBtn.style.marginLeft = ".75rem";
                runBtn.style.fontSize = "2rem";
                runBtn.style.background = "#2196f3";
                runBtn.style.cursor = "pointer";
                runBtn.innerHTML = "play_arrow";
                runBtn.onclick = this.runCode;
            menubar.appendChild(runBtn);
        this._editor.appendChild(menubar);

        let codebox = document.createElement("textarea");
            codebox.id = "js_editor_codebox";
            codebox.name = "codebox";
            codebox.style.width = "100%";
            codebox.style.height = "calc(100% - 3rem)";
            codebox.style.boxSizing = "border-box";
            codebox.style.padding = ".25rem";
            codebox.style.resize = "none";
        this._editor.appendChild(codebox);

        this.widgetWindow.getWidgetBody().append(this._editor);

        this.widgetWindow.takeFocus();
    }

    runCode() {
        console.log("Run JavaScript");
        let codebox = docById("js_editor_codebox");
        try {
            new Function(codebox.value)();
        } catch (e) {
            console.error(e);
        }
    }

    generateCode() {
        console.log("Generate JavaScript");
    }
}
