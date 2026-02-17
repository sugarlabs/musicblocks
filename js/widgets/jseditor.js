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
        this._styles = ["dracula", "github", "railscasts", "vs"].map(name => {
            const link = document.createElement("link");
            link.href = `././lib/codejar/styles/${name}.min.css`;
            link.rel = "stylesheet";
            link.disabled = "true";
            document.head.appendChild(link);
            return link;
        });
        this._styles[this._currentStyle].removeAttribute("disabled");
        this._addErrorStyles();

        this._setup();
        this._setLinesCount(this._code);
    }

    /**
     * Adds CSS styles for error highlighting
     * @returns {void}
     */
    _addErrorStyles() {
        if (document.getElementById("js-error-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "js-error-styles";
        style.textContent = `
            .error {
                background-color: #ff4444 !important;
                color: white !important;
                border-radius: 2px;
                padding: 1px 2px;
                position: relative;
            }
            
            .hljs-keyword {
                color: #007acc !important;
                font-weight: bold;
            }
            
            .hljs-built_in {
                color: #00d4aa !important;
            }
            
            .hljs-title.function_ {
                color: #ffcc00 !important;
            }
            
            .hljs-number {
                color: #4ec9b0 !important;
            }
            
            .hljs-string {
                color: #ff8c00 !important;
            }
            
            .hljs-subst {
                color: #ff8c00 !important;
                background-color: rgba(255, 140, 0, 0.1) !important;
            }
            
            .hljs-comment {
                color: #57a64a !important;
                font-style: italic;
            }
            
            .hljs-title.class_ {
                color: #c586c0 !important;
            }
            
            .hljs-variable {
                color: #4fc1ff !important;
            }
            
            .hljs-params {
                color: #4fc1ff !important;
            }
            
            .hljs-property {
                color: #ff79c6 !important;
            }
            
            .hljs-literal {
                color: #007acc !important;
            }
            
            .hljs-type {
                color: #00d4aa !important;
            }
            
            .hljs-operator {
                color: #ffffff !important;
            }
            
            .hljs-punctuation {
                color: #cccccc !important;
            }
            
            .hljs-regexp {
                color: #ff5555 !important;
            }
            
            .hljs-symbol {
                color: #ffcc00 !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Highlights syntax errors in the editor
     * @param {HTMLElement} editor - the editor element
     * @returns {void}
     */
    _highlightErrors(editor) {
        const existingErrors = editor.querySelectorAll(".error");
        existingErrors.forEach(el => {
            const text = el.textContent;
            el.replaceWith(text);
        });

        try {
            const code = editor.textContent;
            acorn.parse(code, { ecmaVersion: 2020 });
        } catch (error) {
            if (error.pos !== undefined) {
                this._markErrorAtPosition(editor, error.pos, error.message);
            }

            JSEditor.logConsole(`Syntax Error at position ${error.pos}: ${error.message}`);
        }
    }

    /**
     * Marks an error at a specific position in the editor
     * @param {HTMLElement} editor - the editor element
     * @param {Number} position - the character position of the error
     * @param {String} message - the error message
     * @returns {void}
     */
    _markErrorAtPosition(editor, position, message) {
        const text = editor.textContent;

        let errorStart = position;
        let errorEnd = position;

        while (errorStart > 0) {
            const char = text.charAt(errorStart - 1);
            if (
                char === " " ||
                char === "\n" ||
                char === "\t" ||
                char === ";" ||
                char === "{" ||
                char === "}" ||
                char === "(" ||
                char === ")" ||
                char === ","
            ) {
                break;
            }
            errorStart--;
        }

        while (errorEnd < text.length) {
            const char = text.charAt(errorEnd);
            if (
                char === " " ||
                char === "\n" ||
                char === "\t" ||
                char === ";" ||
                char === "{" ||
                char === "}" ||
                char === "(" ||
                char === ")" ||
                char === ","
            ) {
                break;
            }
            errorEnd++;
        }

        if (errorStart === errorEnd) {
            errorEnd = Math.min(errorStart + 1, text.length);
        }

        this._markErrorSpan(editor, errorStart, errorEnd, message);
    }

    /**
     * Marks an error span in the editor with a simple approach
     * @param {HTMLElement} editor - the editor element
     * @param {Number} start - the start position of the error
     * @param {Number} end - the end position of the error
     * @param {String} message - the error message
     * @returns {void}
     */
    _markErrorSpan(editor, start, end, message) {
        const text = editor.textContent;
        const errorText = text.substring(start, end);

        const beforeError = text.substring(0, start);
        const afterError = text.substring(end);

        const highlightedHTML =
            beforeError + `<span class="error" title="${message}">${errorText}</span>` + afterError;

        editor.innerHTML = highlightedHTML;
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
        generateTooltip(helpBtn, _("Help"));

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
        generateTooltip(generateBtn, _("Reset Code"));

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
        generateTooltip(runBtn, _("Play"));

        const convertBtn = document.createElement("span");
        convertBtn.classList.add("material-icons");
        convertBtn.style.borderRadius = "50%";
        convertBtn.style.padding = ".25rem";
        convertBtn.style.marginLeft = ".75rem";
        convertBtn.style.fontSize = "2rem";
        convertBtn.style.background = "#2196f3";
        convertBtn.style.cursor = "pointer";
        convertBtn.innerHTML = "transform";
        convertBtn.onclick = this._codeToBlocks.bind(this);
        menuLeft.appendChild(convertBtn);
        menubar.appendChild(menuLeft);
        generateTooltip(convertBtn, _("Convert JavaScript to Blocks"));

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
        generateTooltip(styleBtn, _("Change theme"), "left");
        this._editor.appendChild(menubar);

        const editorContainer = document.createElement("div");
        editorContainer.id = "editor_container";
        editorContainer.style.width = "100%";
        editorContainer.style.flex = "2 1 auto";
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

        const debugButtons = document.createElement("div");
        debugButtons.id = "debugButtons";
        debugButtons.style.width = "1.5rem";
        debugButtons.style.height = "100%";
        debugButtons.style.position = "absolute";
        debugButtons.style.top = "0";
        debugButtons.style.left = "2rem";
        debugButtons.style.zIndex = "98";
        debugButtons.style.overflow = "hidden";
        debugButtons.style.boxSizing = "border-box";
        debugButtons.style.padding = ".25rem .25rem";
        debugButtons.style.fontFamily = '"PT Mono", monospace';
        debugButtons.style.fontSize = "12px";
        debugButtons.style.fontWeight = "400";
        debugButtons.style.letterSpacing = "normal";
        debugButtons.style.lineHeight = "20px";
        debugButtons.style.background = "rgba(255, 255, 255, 0.05)";
        debugButtons.style.color = "rgba(255, 255, 255, 0.5)";
        debugButtons.style.textAlign = "center";
        debugButtons.style.pointerEvents = "none";
        editorContainer.appendChild(debugButtons);

        const codebox = document.createElement("div");
        codebox.classList.add("editor");
        codebox.classList.add("language-javascript");
        codebox.style.width = "100%";
        codebox.style.height = "100%";
        codebox.style.position = "absolute";
        codebox.style.top = "0";
        codebox.style.left = "0";
        codebox.style.boxSizing = "border-box";
        codebox.style.padding = ".25rem .25rem .25rem 4.25rem";
        codebox.style.fontFamily = '"PT Mono", monospace';
        codebox.style.fontSize = "14px";
        codebox.style.fontWeight = "400";
        codebox.style.letterSpacing = "normal";
        codebox.style.lineHeight = "20px";
        codebox.style.tabSize = "4";
        codebox.style.cursor = "text";
        editorContainer.appendChild(codebox);
        this._editor.appendChild(editorContainer);

        const divider = document.createElement("div");
        divider.id = "editor_divider";
        divider.style.width = "100%";
        divider.style.height = "5px";
        divider.style.cursor = "row-resize";
        divider.style.background = "gray";
        divider.style.position = "relative";
        this._editor.appendChild(divider);

        const consolelabel = document.createElement("div");
        consolelabel.id = "console_label";
        consolelabel.style.width = "100%";
        consolelabel.style.flex = "0 0 auto";
        consolelabel.style.boxSizing = "border-box";
        consolelabel.style.borderTop = "1px solid gray";
        consolelabel.style.borderBottom = "1px solid gray";
        consolelabel.style.padding = ".25rem";
        consolelabel.style.fontFamily = '"PT Mono", monospace';
        consolelabel.style.fontSize = "14px";
        consolelabel.style.fontWeight = "700";
        consolelabel.style.lineHeight = "20px";
        consolelabel.style.color = "indigo";
        consolelabel.style.background = "white";
        consolelabel.style.display = "flex";
        consolelabel.style.justifyContent = "space-between";
        consolelabel.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;CONSOLE";
        this._editor.appendChild(consolelabel);

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
        generateTooltip(arrowBtn, _("Toggle Console"), "left");

        const editorconsole = document.createElement("div");
        editorconsole.id = "editorConsole";
        editorconsole.style.width = "100%";
        editorconsole.style.flex = "1 1 auto";
        editorconsole.style.overflow = "auto";
        editorconsole.style.boxSizing = "border-box";
        editorconsole.style.padding = ".25rem";
        editorconsole.style.fontFamily = '"PT Mono", monospace';
        editorconsole.style.fontSize = "14px";
        editorconsole.style.fontWeight = "400";
        editorconsole.style.lineHeight = "20px";
        editorconsole.style.background = "lightcyan";
        editorconsole.style.cursor = "text";
        this._editor.appendChild(editorconsole);

        const highlight = editor => {
            // Apply syntax highlighting if highlight.js is available
            if (window.hljs) {
                try {
                    // Remove any existing highlighting classes to ensure clean re-highlighting
                    editor.removeAttribute("data-highlighted");

                    // Configure highlight.js for JavaScript
                    hljs.configure({
                        languages: ["javascript"]
                    });

                    // Try modern API first (v11+), fallback to legacy API (v9-10)
                    if (typeof hljs.highlightElement === "function") {
                        hljs.highlightElement(editor);
                    } else if (typeof hljs.highlightBlock === "function") {
                        // Legacy API for older highlight.js versions
                        hljs.highlightBlock(editor);
                    }
                } catch (e) {
                    // Silently handle highlighting errors to prevent editor crashes
                    console.warn("Syntax highlighting failed:", e);
                }
            }

            // Always add error highlighting (works independently of hljs)
            this._highlightErrors(editor);
        };

        this._jar = new CodeJar(codebox, highlight);

        this._generateCode();

        this._jar.updateCode(this._code);
        this._jar.updateOptions({
            tab: " ".repeat(4), // default is '\t'
            indentOn: /[(]$/, // default is /{$/
            spellcheck: false, // default is false
            addClosing: true // default is true
        });
        this._jar.onUpdate(code => {
            if (!this._showingHelp) this._code = code;
            this._setLinesCount(this._code);
        });

        this.widgetWindow.getWidgetBody().append(this._editor);

        this.widgetWindow.takeFocus();

        this._setupDividerResize(divider, editorContainer, editorconsole, consolelabel);
        this._setupWindowResize();

        window.jsEditor = this;

        this._setupScrollSync();
    }

    /**
     * Setup the draggable divider for resizing the editor and console areas.
     * @param {HTMLElement} divider
     * @param {HTMLElement} editorContainer
     * @param {HTMLElement} editorconsole
     * @param {HTMLElement} consolelabel
     */
    _setupDividerResize(divider, editorContainer, editorconsole, consolelabel) {
        let isResizing = false;

        const onMouseMove = e => {
            if (!isResizing) return;
            const parentRect = this._editor.getBoundingClientRect();
            const menubarHeight = this._menubar ? this._menubar.offsetHeight : 0;
            const availableHeight = this._editor.clientHeight - menubarHeight;
            const dynamicTop = parentRect.top + menubarHeight;

            const newEditorHeight = e.clientY - dynamicTop;
            const dividerHeight = divider.offsetHeight;
            const consoleHeaderHeight = consolelabel.offsetHeight;
            const newConsoleHeight =
                availableHeight - newEditorHeight - dividerHeight - consoleHeaderHeight;

            editorContainer.style.flexBasis = `${newEditorHeight}px`;
            editorconsole.style.flexBasis = `${newConsoleHeight}px`;
        };

        const onMouseUp = () => {
            isResizing = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        divider.addEventListener("mousedown", e => {
            isResizing = true;
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
            e.preventDefault();
        });
    }

    /**
     * Setup resize handles for the entire editor window.
     * Allows users to resize by dragging edges (left, right, bottom) and corners.
     * @returns {void}
     */
    _setupWindowResize() {
        const windowFrame = this.widgetWindow._frame;
        const windowBody = this.widgetWindow._body;

        // Create resize handles
        const createHandle = (position, cursor) => {
            const handle = document.createElement("div");
            handle.className = `resize-handle resize-handle-${position}`;
            handle.style.position = "absolute";
            handle.style.zIndex = "1000";

            // Common styles for all handles
            const handleStyles = {
                "right": {
                    top: "32px",
                    right: "0",
                    width: "5px",
                    height: "calc(100% - 32px)",
                    cursor: "ew-resize"
                },
                "left": {
                    top: "32px",
                    left: "0",
                    width: "5px",
                    height: "calc(100% - 32px)",
                    cursor: "ew-resize"
                },
                "bottom": {
                    bottom: "0",
                    left: "0",
                    width: "100%",
                    height: "5px",
                    cursor: "ns-resize"
                },
                "bottom-right": {
                    bottom: "0",
                    right: "0",
                    width: "15px",
                    height: "15px",
                    cursor: "nwse-resize"
                },
                "bottom-left": {
                    bottom: "0",
                    left: "0",
                    width: "15px",
                    height: "15px",
                    cursor: "nesw-resize"
                }
            };

            Object.assign(handle.style, handleStyles[position]);
            handle.style.background = "transparent";
            handle.style.transition = "background 0.2s";

            // Visual feedback on hover
            handle.addEventListener("mouseenter", () => {
                handle.style.background = "rgba(33, 150, 243, 0.3)";
            });
            handle.addEventListener("mouseleave", () => {
                handle.style.background = "transparent";
            });

            return handle;
        };

        // Add handles to window frame
        const handles = {
            right: createHandle("right"),
            left: createHandle("left"),
            bottom: createHandle("bottom"),
            bottomRight: createHandle("bottom-right"),
            bottomLeft: createHandle("bottom-left")
        };

        Object.values(handles).forEach(handle => windowFrame.appendChild(handle));

        // Resize logic
        let isResizing = false;
        let resizeDirection = null;
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        const startResize = (e, direction) => {
            if (this.widgetWindow._maximized) return; // Don't resize when maximized

            isResizing = true;
            resizeDirection = direction;
            startX = e.clientX;
            startY = e.clientY;

            const rect = windowFrame.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;
            startLeft = rect.left;
            startTop = rect.top;

            e.preventDefault();
            e.stopPropagation();
        };

        const doResize = e => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;

            // Calculate new dimensions based on direction
            if (resizeDirection.includes("right")) {
                newWidth = Math.max(400, startWidth + deltaX);
            }
            if (resizeDirection.includes("left")) {
                const widthDelta = startWidth - deltaX;
                if (widthDelta >= 400) {
                    newWidth = widthDelta;
                    newLeft = startLeft + deltaX;
                }
            }
            if (resizeDirection.includes("bottom")) {
                newHeight = Math.max(300, startHeight + deltaY);
            }

            // Apply new dimensions
            windowFrame.style.width = newWidth + "px";
            windowFrame.style.height = newHeight + "px";

            if (resizeDirection.includes("left")) {
                windowFrame.style.left = newLeft + "px";
            }

            // Update editor content size
            const editorDiv = this._editor;
            if (editorDiv) {
                editorDiv.style.width = newWidth + "px";
                editorDiv.style.height = newHeight - 32 + "px"; // Subtract title bar height
            }
        };

        const stopResize = () => {
            if (!isResizing) return;
            isResizing = false;
            resizeDirection = null;
        };

        // Attach event listeners
        handles.right.addEventListener("mousedown", e => startResize(e, "right"));
        handles.left.addEventListener("mousedown", e => startResize(e, "left"));
        handles.bottom.addEventListener("mousedown", e => startResize(e, "bottom"));
        handles.bottomRight.addEventListener("mousedown", e => startResize(e, "bottom-right"));
        handles.bottomLeft.addEventListener("mousedown", e => startResize(e, "bottom-left"));

        document.addEventListener("mousemove", doResize);
        document.addEventListener("mouseup", stopResize);
    }

    /**
     * Sets up scroll synchronization between line numbers and debug buttons
     * @returns {void}
     */
    _setupScrollSync() {
        const codebox = document.querySelector(".editor");
        const codeLines = docById("editorLines");
        const debugButtons = docById("debugButtons");

        if (codebox && codeLines && debugButtons) {
            codebox.addEventListener("scroll", () => {
                codeLines.scrollTop = codebox.scrollTop;
                debugButtons.scrollTop = codebox.scrollTop;
            });
        }
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
        const consoleEl = docById("editorConsole");
        if (consoleEl) {
            if (consoleEl.childNodes.length > 0) {
                consoleEl.appendChild(document.createElement("br"));
            }
            const line = document.createElement("span");
            line.style.color = color;
            line.textContent = message;
            consoleEl.appendChild(line);
        } else {
            // console.error("EDITOR MISSING!");
        }
    }

    static clearConsole() {
        const consoleEl = docById("editorConsole");
        if (consoleEl) {
            consoleEl.textContent = "";
        }
    }

    /**
     * Triggerred when the "run" button on the widget is pressed.
     * Runs the JavaScript code that is in the editor.
     *
     * @returns {void}
     */
    _runCode() {
        if (this._showingHelp) return;

        JSEditor.clearConsole();

        try {
            acorn.parse(this._code, { ecmaVersion: 2020 });
        } catch (e) {
            JSEditor.logConsole(`Syntax Error: ${e.message}`, "red");
            return;
        }

        try {
            MusicBlocks.init(true);
            new Function(this._code)();
            JSEditor.logConsole("Code executed successfully!", "green");
        } catch (e) {
            JSEditor.logConsole(`Runtime Error: ${e.message}`, "maroon");
            if (e.stack) {
                JSEditor.logConsole(`Stack trace: ${e.stack}`, "maroon");
            }
        }
    }

    /**
     * Update the blocks on canvas based on the JS code in editor.
     *
     * @returns {Void}
     */
    _codeToBlocks() {
        JSEditor.clearConsole();

        try {
            let ast = acorn.parse(this._code, { ecmaVersion: 2020 });
            let blockList = AST2BlockList.toBlockList(ast, ast2blocklist_config);
            const activity = this.activity;
            // Wait for the old blocks to be removed, then load new blocks.
            const __listener = event => {
                activity.blocks.loadNewBlocks(blockList);
                activity.stage.removeAllEventListeners("trashsignal");
            };
            activity.stage.removeAllEventListeners("trashsignal");
            activity.stage.addEventListener("trashsignal", __listener, false);
            // Clear the canvas but leave the JS editor open
            activity.sendAllToTrash(false, false, false);
        } catch (e) {
            JSEditor.logConsole(
                "message" in e ? e.message : e.prefix + this._code.substring(e.start, e.end),
                "red"
            );
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

        const linesCount = code.replace(/\n+$/, "\n").split("\n").length;
        let text = "";
        for (let i = 1; i < linesCount; i++) {
            text += `${i}\n`;
        }
        docById("editorLines").innerText = text;

        // Update debug buttons
        this._updateDebugButtons(code);
    }

    /**
     * Updates debug buttons for each line of code
     *
     * @param {String} code - the code to create debug buttons for
     * @returns {void}
     */
    _updateDebugButtons(code) {
        if (!docById("debugButtons")) return;
        const lines = code.replace(/\n+$/, "\n").split("\n");
        let buttonsHTML = "";
        for (let i = 0; i < lines.length; i++) {
            const lineNumber = i;
            const lineContent = lines[i].trim();
            const hasDebugger = lineContent === "debugger;" || lineContent.includes("debugger;");
            if (lineContent === "") {
                buttonsHTML += "<div style='height: 20px; line-height: 20px;'>&nbsp;</div>";
            } else if (hasDebugger) {
                buttonsHTML += `<div style="height: 20px; line-height: 20px; cursor: pointer; opacity: 1; pointer-events: auto; border-radius: 4px;" \
                    onclick="window.jsEditor._removeDebuggerFromLine(${lineNumber})" \
                    title="Remove debugger from line ${lineNumber + 1}">🔴</div>`;
            } else {
                buttonsHTML += `<div style="height: 20px; line-height: 20px; cursor: pointer; opacity: 0; transition: opacity 0.2s ease-in-out; pointer-events: auto;" \
                    onmouseenter="this.style.opacity='1'" \
                    onmouseleave="this.style.opacity='0'"\
                    onclick="window.jsEditor._addDebuggerToLine(${lineNumber})" \
                    title="Add breakpoint to line ${lineNumber + 1}">🔴</div>`;
            }
        }
        docById("debugButtons").innerHTML = buttonsHTML;
    }

    /**
     * Adds a debugger statement to a specific line
     *
     * @param {Number} lineNumber - the line number to add debugger to
     * @returns {void}
     */
    _addDebuggerToLine(lineNumber) {
        const lines = this._code.split("\n");
        const insertIndex = lineNumber - 1;

        // Check if the line ends with '{' or ';'
        const currentLine = lines[insertIndex].trim();
        if (!currentLine.endsWith("{") && !currentLine.endsWith(";")) {
            JSEditor.logConsole(
                `Cannot add breakpoint to line ${
                    lineNumber + 1
                }. Breakpoints can only be added after lines ending with '{' or ';'`,
                "red"
            );
            return;
        }

        // Prevent adding two breakpoints right next to each other
        if (
            (lines[insertIndex] && lines[insertIndex].trim() === "debugger;") ||
            (lines[insertIndex + 1] && lines[insertIndex + 1].trim() === "debugger;")
        ) {
            JSEditor.logConsole(
                `Cannot add breakpoint to line ${
                    lineNumber + 1
                } because there is already a breakpoint on an adjacent line.`,
                "red"
            );
            return;
        }

        let indent = "";
        let extraIndent = "";
        if (insertIndex >= 0 && lines[insertIndex]) {
            const match = lines[insertIndex].match(/^(\s*)/);
            if (match) indent = match[1];
            if (lines[insertIndex].trim().endsWith("{")) {
                extraIndent = "\t";
            }
        } else if (lines.length > 0) {
            const match = lines[0].match(/^(\s*)/);
            if (match) indent = match[1];
        }
        // Insert debugger statement after the specified line, with matching indentation
        lines.splice(insertIndex + 1, 0, indent + extraIndent + "debugger;");
        this._code = lines.join("\n");
        this._jar.updateCode(this._code);
        this._setLinesCount(this._code);
        JSEditor.logConsole(`Debugger added to line ${lineNumber + 1}`, "green");
    }

    /**
     * Removes a debugger statement from a specific line
     *
     * @param {Number} lineNumber - the line number to remove debugger from
     * @returns {void}
     */
    _removeDebuggerFromLine(lineNumber) {
        // Allow removing breakpoints at any time
        const lines = this._code.split("\n");
        const currentLine = lines[lineNumber].trim();
        if (currentLine === "debugger;") {
            lines.splice(lineNumber, 1);
        }
        this._code = lines.join("\n");
        this._jar.updateCode(this._code);
        this._setLinesCount(this._code);
        JSEditor.logConsole(`Debugger removed from line ${lineNumber + 1}`, "orange");
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

        const editorLines = docById("editorLines");
        switch (this._styles[this._currentStyle].href.split("/").pop().split(".")[0]) {
            case "dracula":
                editorLines.style.color = "#ffffff";
                editorLines.style.background = "#5a5a5a";
                break;
            case "github":
                editorLines.style.color = "#000000";
                editorLines.style.background = "#eaeaea";
                break;
            case "railscasts":
                editorLines.style.color = "#ffffff";
                editorLines.style.background = "#2b2b2b";
                break;
            case "vs":
                editorLines.style.color = "#000000";
                editorLines.style.background = "#f2f2f2";
                break;
            default:
                editorLines.style.color = "#ffffff";
                editorLines.style.background = "#000000";
                break;
        }
    }

    /**
     * Triggered when the console arrow button is pressed.
     * Toggle console display.
     *
     * @returns {void}
     */
    _toggleConsole() {
        const editorconsole = docById("editorConsole");
        const arrowBtn = docById("editor_console_btn");
        if (this.isOpen) {
            this.isOpen = false;
            editorconsole.style.display = "none";
            if (arrowBtn) arrowBtn.innerHTML = "keyboard_arrow_up";
        } else {
            this.isOpen = true;
            editorconsole.style.display = "block";
            if (arrowBtn) arrowBtn.innerHTML = "keyboard_arrow_down";
        }
    }

    /**
     * Triggered when the status button is pressed.
     * Opens the status window.
     *
     * @returns {void}
     */
    _triggerStatusWindow() {
        // Check if status window is already open
        if (window.widgetWindows.isOpen("status")) {
            JSEditor.logConsole("Status window is already open.", "blue");
            return;
        }

        if (this.activity.logo.statusMatrix === null) {
            this.activity.logo.statusMatrix = new StatusMatrix();
        }

        this.activity.logo.statusMatrix.init(this.activity);
        // this.activity.logo.statusFields = [];
        this.activity.logo.inStatusMatrix = true;

        JSEditor.logConsole("Status window opened.", "green");
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { JSEditor };
}
