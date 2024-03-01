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
 * @class
 * @classdesc pertains to setting up all features of the JavsScript Editor for writing and reviewing
 * corresponding JavaScript code for Music Blocks programs.
 *
 * Private members' names begin with underscore '_".
 */

/* global docById, MusicBlocks, hljs, CodeJar, JSGenerate, JS_API */

/* exported JSEditor */

class JSEditor {
    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;
        this._showingHelp = false;

        this.widgetWindow = window.widgetWindows.windowFor(
            this,
            "JavaScript Editor",
            "JavaScript Editor"
        );
        this.widgetWindow.clear();
        this.widgetWindow.show();
        this.widgetWindow.setPosition(160, 132);

        /** topmost DOM container for the widget contents */
        this._editor = document.createElement("div");

        /** stores CodeJar object for the editor */
        this._jar = null;
        /** code to be displayed in the editor */
        this._code = null;
        /** actual code backup up when help is shown */
        this._codeBck = null;

        // setup editor window styles
        this._currentStyle = 0;
        this._styles = ["dracula", "github", "railscasts", "vs"].map((name) => {
            const link = document.createElement("link");
            link.href = `././lib/codejar/styles/${name}.min.css`;
            link.rel = "stylesheet";
            link.disabled = "true";
            document.head.appendChild(link);
            return link;
        });
        this._styles[this._currentStyle].removeAttribute("disabled");

        this._setup();
        this._setLinesCount(this._code);
    }

    /**
     * Renders the editor and all the subcomponents in the DOM.
     * Sets up CodeJar.
     * @returns {void}
     */

    _setup() {
        this.widgetWindow.onmaximize = () => {
            const editor = this.widgetWindow.getWidgetBody().childNodes[0];
            editor.style.width = this.widgetWindow._maximized ? "100%" : "39rem";
            editor.style.height = this.widgetWindow._maximized
                ? `calc(100vh - ${64 + 33}px)`
                : `${docById("overlayCanvas").height - 33 - 128 - 12}px`;
        };

        this._editor.style.width = "39rem";
        this._editor.style.height = `${docById("overlayCanvas").height - 33 - 128 - 12}px`;
        this._editor.style.display = "flex";
        this._editor.style.flexDirection = "column";

        const menubar = document.createElement("div");
        menubar.style.width = "100%";
        menubar.style.height = "3rem";
        menubar.style.display = "flex";
        menubar.style.flexDirection = "row";
        menubar.style.justifyContent = "space-between";
        menubar.style.background = "#1e88e5";
        menubar.style.color = "white";

        const menuLeft = document.createElement("div");
        menuLeft.style.height = "3rem";
        menuLeft.style.display = "flex";
        menuLeft.style.flexDirection = "row";
        menuLeft.style.justifyContent = "end";
        menuLeft.style.alignItems = "center";

        function generateTooltip(targetButton, tooltipText, positionOfTooltip = "bottom") {
            const tooltipBox = document.createElement("div");
            const tooltip = document.createElement("div");

            tooltipBox.appendChild(tooltip);

            document.body.appendChild(tooltipBox);

            targetButton.addEventListener("mouseover", () => {
                const rect = targetButton.getBoundingClientRect();

                tooltip.style.position = "absolute";
                tooltip.style.visibility = "visible";
                tooltip.style.opacity = "1";
                tooltip.style.transition = "opacity 0.2s ease-in-out";
                tooltip.style.marginTop = "-10px";
                tooltip.style.background = "#333";
                tooltip.style.color = "#fff";
                tooltip.style.padding = "0.5rem";
                tooltip.style.borderRadius = "10px";
                tooltip.style.zIndex = "99999";
                tooltip.style.fontSize = "1rem";
                tooltip.style.whiteSpace = "nowrap";
                tooltip.textContent = tooltipText;

                tooltip.style.top = `${
                    rect.bottom + window.scrollY + (positionOfTooltip !== "bottom" ? -30 : 20)
                }px`;
                tooltip.style.left = `${
                    rect.left + window.scrollX + (positionOfTooltip !== "bottom" ? -135 : 0)
                }px`;
            });

            targetButton.addEventListener("mouseout", () => {
                tooltip.style.opacity = "0";
                setTimeout(() => {
                    tooltip.style.visibility = "hidden";
                }, 250);
            });

            return tooltip;
        }

        const helpBtn = document.createElement("span");
        helpBtn.id = "js_editor_help_btn";
        helpBtn.classList.add("material-icons");
        helpBtn.style.borderRadius = "50%";
        helpBtn.style.padding = ".25rem";
        helpBtn.style.marginLeft = ".75rem";
        helpBtn.style.fontSize = "2rem";
        helpBtn.style.background = "#2196f3";
        helpBtn.style.cursor = "pointer";
        helpBtn.innerHTML = "help_outline";
        helpBtn.onclick = this._toggleHelp.bind(this);
        menuLeft.appendChild(helpBtn);
        generateTooltip(helpBtn, "Help");

        const generateBtn = document.createElement("span");
        generateBtn.classList.add("material-icons");
        generateBtn.style.borderRadius = "50%";
        generateBtn.style.padding = ".25rem";
        generateBtn.style.marginLeft = ".75rem";
        generateBtn.style.fontSize = "2rem";
        generateBtn.style.background = "#2196f3";
        generateBtn.style.cursor = "pointer";
        generateBtn.innerHTML = "autorenew";
        generateBtn.onclick = this._generateCode.bind(this);
        menuLeft.appendChild(generateBtn);
        generateTooltip(generateBtn, "Reset Code");

        const runBtn = document.createElement("span");
        runBtn.classList.add("material-icons");
        runBtn.style.borderRadius = "50%";
        runBtn.style.padding = ".25rem";
        runBtn.style.marginLeft = ".75rem";
        runBtn.style.fontSize = "2rem";
        runBtn.style.background = "#2196f3";
        runBtn.style.cursor = "pointer";
        runBtn.innerHTML = "play_arrow";
        runBtn.onclick = this._runCode.bind(this);
        menuLeft.appendChild(runBtn);
        menubar.appendChild(menuLeft);
        generateTooltip(runBtn, "Play");

        const menuRight = document.createElement("div");
        menuRight.style.height = "3rem";
        menuRight.style.display = "flex";
        menuRight.style.flexDirection = "row";
        menuRight.style.justifyContent = "end";
        menuRight.style.alignItems = "center";

        const styleBtn = document.createElement("span");
        styleBtn.classList.add("material-icons");
        styleBtn.style.borderRadius = "50%";
        styleBtn.style.padding = ".25rem";
        styleBtn.style.marginRight = ".75rem";
        styleBtn.style.fontSize = "2rem";
        styleBtn.style.background = "#2196f3";
        styleBtn.style.cursor = "pointer";
        styleBtn.innerHTML = "invert_colors";
        styleBtn.onclick = this._changeStyle.bind(this);
        menuRight.appendChild(styleBtn);
        menubar.appendChild(menuRight);
        this._editor.appendChild(menubar);
        generateTooltip(styleBtn, "Change Theme", "left");

        const editorContainer = document.createElement("div");
        editorContainer.id = "editor_container";
        editorContainer.style.width = "100%";
        editorContainer.style.height = "calc(100% - 11rem)";
        editorContainer.style.position = "relative";
        editorContainer.style.background = "#1e88e5";
        editorContainer.style.color = "white";

        const codeLines = document.createElement("div");
        codeLines.id = "editorLines";
        codeLines.style.width = "2rem";
        codeLines.style.height = "100%";
        codeLines.style.position = "absolute";
        codeLines.style.top = "0";
        codeLines.style.left = "0";
        codeLines.style.zIndex = "99";
        codeLines.style.overflow = "hidden";
        codeLines.style.boxSizing = "border-box";
        codeLines.style.padding = ".25rem .5rem";
        codeLines.style.fontFamily = '"PT Mono", monospace';
        codeLines.style.fontSize = "14px";
        codeLines.style.fontWeight = "400";
        codeLines.style.letterSpacing = "normal";
        codeLines.style.lineHeight = "20px";
        codeLines.style.background = "rgba(255, 255, 255, 0.075)";
        codeLines.style.color = "rgba(255, 255, 255, 0.7)";
        codeLines.style.textAlign = "right";
        editorContainer.appendChild(codeLines);

        const codebox = document.createElement("div");
        codebox.classList.add("editor");
        codebox.classList.add("language-js");
        codebox.style.width = "100%";
        codebox.style.height = "100%";
        codebox.style.position = "absolute";
        codebox.style.top = "0";
        codebox.style.left = "0";
        codebox.style.boxSizing = "border-box";
        codebox.style.padding = ".25rem .25rem .25rem 2.75rem";
        codebox.style.fontFamily = '"PT Mono", monospace';
        codebox.style.fontSize = "14px";
        codebox.style.fontWeight = "400";
        codebox.style.letterSpacing = "normal";
        codebox.style.lineHeight = "20px";
        codebox.style.tabSize = "4";
        codebox.style.cursor = "text";
        editorContainer.appendChild(codebox);
        this._editor.appendChild(editorContainer);

        codebox.onscroll = () => {
            codeLines.scrollTop = codebox.scrollTop;
        };

        const consolelabel = document.createElement("div");
        consolelabel.id = "console_label";
        consolelabel.style.width = "100%";
        consolelabel.style.height = "2rem";
        consolelabel.style.boxSizing = "border-box";
        consolelabel.style.borderTop = "1px solid gray";
        consolelabel.style.borderBottom = "1px solid gray";
        consolelabel.style.padding = ".25rem";
        consolelabel.style.fontFamily = '"PT Mono", monospace';
        consolelabel.style.fontSize = "14px";
        consolelabel.style.fontWeight = "700";
        consolelabel.style.letterSpacing = "normal";
        consolelabel.style.lineHeight = "20px";
        consolelabel.style.color = "indigo";
        consolelabel.style.background = "white";
        consolelabel.style.display = "flex";
        consolelabel.style.justifyContent = "space-between";
        consolelabel.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;CONSOLE";
        this._editor.appendChild(consolelabel);

        const editorconsole = document.createElement("div");
        editorconsole.id = "editorConsole";
        editorconsole.style.width = "100%";
        editorconsole.style.height = "8.25rem";
        editorconsole.style.overflow = "auto";
        editorconsole.style.boxSizing = "border-box";
        editorconsole.style.padding = ".25rem";
        editorconsole.style.fontFamily = '"PT Mono", monospace';
        editorconsole.style.fontSize = "14px";
        editorconsole.style.fontWeight = "400";
        editorconsole.style.letterSpacing = "normal";
        editorconsole.style.lineHeight = "20px";
        codebox.style.resize = "none !important";
        editorconsole.style.background = "lightcyan";
        editorconsole.style.cursor = "text";
        this._editor.appendChild(editorconsole);

        const arrowBtn = document.createElement("span");
        arrowBtn.id = "editor_console_btn";
        arrowBtn.classList.add("material-icons");
        arrowBtn.style.padding = ".25rem";
        arrowBtn.style.fontSize = "2rem";
        arrowBtn.style.cursor = "pointer";
        arrowBtn.style.lineHeight = "0.75rem";
        arrowBtn.style.marginLeft = "0";
        arrowBtn.innerHTML = "keyboard_arrow_down";
        arrowBtn.onclick = this._toggleConsole.bind(this);
        consolelabel.appendChild(arrowBtn);
        generateTooltip(arrowBtn, "Toggle Console","left");

        const highlight = (editor) => {
            // editor.textContent = editor.textContent;
            hljs.highlightBlock(editor);
        };

        this._jar = new CodeJar(codebox, highlight);

        this._generateCode();

        codebox.className = "editor language-js";
        this._jar.updateCode(this._code);
        this._jar.updateOptions({
            tab: " ".repeat(4), // default is '\t'
            indentOn: /[(]$/, // default is /{$/
            spellcheck: false, // default is false
            addClosing: true // default is true
        });
        this._jar.onUpdate((code) => {
            if (!this._showingHelp) this._code = code;
            this._setLinesCount(this._code);
        });

        this.widgetWindow.getWidgetBody().append(this._editor);

        this.widgetWindow.takeFocus();
    }

    /**
     * Logs a message to the console of the JSEditor widget.
     *
     * @static
     * @param {String} message
     * @param {String} color - text color
     * @returns {void}
     */
    static logConsole(message, color) {
        if (color === undefined) color = "midnightblue";
        if (docById("editorConsole")) {
            if (docById("editorConsole").innerHTML !== "")
                docById("editorConsole").innerHTML += "</br>";
            docById("editorConsole").innerHTML += `<span style="color: ${color}">${message}</span>`;
        } else {
            // console.error("EDITOR MISSING!");
        }
        // eslint-disable-next-line
        console.log("%c" + message, `color: ${color}`);
    }

    /**
     * Triggerred when the "run" button on the widget is pressed.
     * Runs the JavaScript code that is in the editor.
     *
     * @returns {void}
     */
    _runCode() {
        if (this._showingHelp) return;

        if (docById("editorConsole")) docById("editorConsole").innerHTML = "";

        try {
            MusicBlocks.init(true);
            new Function(this._code)();
        } catch (e) {
            JSEditor.logConsole(e, "maroon");
        }
    }

    /**
     * Triggered when the widget is opened or when the "generate" button is pressed.
     * Interfaces with JSGenerate to generate JavaScript code from the blocks stacks.
     *
     * @returns {void}
     */
    _generateCode() {
        JSGenerate.run(true);
        this._code = JSGenerate.code;
        this._jar.updateCode(this._code);
        this._setLinesCount(this._code);
        const helpBtn = docById("js_editor_help_btn");
        if (helpBtn) {
            helpBtn.style.color = "white";
        }
        this._showingHelp = false;
    }

    /**
     * Refreshes the line numbers by the code in the editor.
     *
     * @param {String} code - corresponding code (to find the number of lines)
     * @returns {void}
     */
    _setLinesCount(code) {
        if (!docById("editorLines")) return;

        const linesCount = code.replace(/\n+$/, "\n").split("\n").length + 1;
        let text = "";
        for (let i = 1; i < linesCount; i++) {
            text += `${i}\n`;
        }
        docById("editorLines").innerText = text;
    }

    /**
     * Triggered when the help button is played.
     * Toggle help (guide) display.
     *
     * @returns {void}
     */
    _toggleHelp() {
        this._showingHelp = !this._showingHelp;
        const helpBtn = docById("js_editor_help_btn");

        if (this._showingHelp) {
            helpBtn.style.color = "gold";
            this._codeBck = this._code;
            this._jar.updateCode(JS_API);
            this._setLinesCount(JS_API);
        } else {
            helpBtn.style.color = "white";
            this._jar.updateCode(this._codeBck);
            this._setLinesCount(this._codeBck);
            this._code = this._codeBck;
        }
    }

    /**
     * Triggered when the "change-style" button is pressed.
     * Changes to the next editor style.
     *
     * @param {Object} event
     * @returns {void}
     */
    _changeStyle(event) {
        event.preventDefault();

        this._styles[this._currentStyle].setAttribute("disabled", "true");
        this._currentStyle = (this._currentStyle + 1) % this._styles.length;
        this._styles[this._currentStyle].removeAttribute("disabled");
    }

    /**
     * Triggered when the console arrow button is pressed.
     * Toggle console display.
     *
     * @returns {void}
     */
    _toggleConsole() {
        const consoleContainer = docById("editorConsole");
        const consoleLabel = docById("console_label");
        const editorContainer = docById("editor_container");
        const arrowBtn = docById("editor_console_btn");
        if (this.isOpen) {
            this.isOpen = false;
            consoleContainer.style.display = "none";
            consoleLabel.style.bottom = "0";
            editorContainer.style.height = "calc(100% - 2.75rem)";
            if (arrowBtn) arrowBtn.innerHTML = "keyboard_arrow_up";
        } else {
            this.isOpen = true;
            consoleContainer.style.display = "block";
            consoleLabel.style.display = "flex";
            editorContainer.style.height = "calc(100% - 11rem)";
            if (arrowBtn) arrowBtn.innerHTML = "keyboard_arrow_down";
        }
    }
}
