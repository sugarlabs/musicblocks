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
        this._showingHelp = false;

        this.widgetWindow =
            window.widgetWindows.windowFor(this, "JavaScript Editor", "JavaScript Editor");
        this.widgetWindow.clear();
        this.widgetWindow.show();
        this.widgetWindow.setPosition(160, 132);

        // Position the widget and make it visible
        this._editor = document.createElement("div");

        this._jar = null;
        this._code = null;
        this._codeBck = null;

        this.currentStyle = 0;
        this.styles = [
            "dracula",
            "github",
            "railscasts",
            "vs",
        ].map((name) => {
            const link = document.createElement("link");
            link.href = `././lib/codejar/styles/${name}.min.css`;
            link.rel = "stylesheet";
            link.disabled = "true";
            document.head.appendChild(link);
            return link;
        });
        this.styles[this.currentStyle].removeAttribute("disabled");

        this.setup();
        this.setLinesCount(this._code);
    }

    setup() {
        this.widgetWindow.onmaximize = () => {
            let editor = this.widgetWindow.getWidgetBody().childNodes[0];
                editor.style.width = this.widgetWindow._maximized ? "100%" : "39rem";
                editor.style.height =
                    this.widgetWindow._maximized ?
                        `calc(100vh - ${64 + 33}px` :
                        `${docById("overlayCanvas").height - 33 - 128 - 12}px`;
        }

        this._editor.style.width = "39rem";
        this._editor.style.height = `${docById("overlayCanvas").height - 33 - 128 - 12}px`;
        this._editor.style.display = "flex";
        this._editor.style.flexDirection = "column";

        let menubar = document.createElement("div");
            menubar.style.width = "100%";
            menubar.style.height = "3rem";
            menubar.style.display = "flex";
            menubar.style.flexDirection = "row";
            menubar.style.justifyContent = "space-between";
            menubar.style.background = "#1e88e5";
            menubar.style.color = "white";

            let menuLeft = document.createElement("div");
                menuLeft.style.height = "3rem";
                menuLeft.style.display = "flex";
                menuLeft.style.flexDirection = "row";
                menuLeft.style.justifyContent = "end";
                menuLeft.style.alignItems = "center";

                let helpBtn = document.createElement("span");
                    helpBtn.id = "js_editor_help_btn";
                    helpBtn.classList.add("material-icons");
                    helpBtn.style.borderRadius = "50%";
                    helpBtn.style.padding = ".25rem";
                    helpBtn.style.marginLeft = ".75rem";
                    helpBtn.style.fontSize = "2rem";
                    helpBtn.style.background = "#2196f3";
                    helpBtn.style.cursor = "pointer";
                    helpBtn.innerHTML = "help_outline";
                    helpBtn.onclick = this.toggleHelp.bind(this);
                menuLeft.appendChild(helpBtn);

                let generateBtn = document.createElement("span");
                    generateBtn.classList.add("material-icons");
                    generateBtn.style.borderRadius = "50%";
                    generateBtn.style.padding = ".25rem";
                    generateBtn.style.marginLeft = ".75rem";
                    generateBtn.style.fontSize = "2rem";
                    generateBtn.style.background = "#2196f3";
                    generateBtn.style.cursor = "pointer";
                    generateBtn.innerHTML = "autorenew";
                    generateBtn.onclick = this.generateCode.bind(this);
                menuLeft.appendChild(generateBtn);

                let runBtn = document.createElement("span");
                    runBtn.classList.add("material-icons");
                    runBtn.style.borderRadius = "50%";
                    runBtn.style.padding = ".25rem";
                    runBtn.style.marginLeft = ".75rem";
                    runBtn.style.fontSize = "2rem";
                    runBtn.style.background = "#2196f3";
                    runBtn.style.cursor = "pointer";
                    runBtn.innerHTML = "play_arrow";
                    runBtn.onclick = this.runCode.bind(this);
                menuLeft.appendChild(runBtn);
            menubar.appendChild(menuLeft);

            let menuRight = document.createElement("div");
                menuRight.style.height = "3rem";
                menuRight.style.display = "flex";
                menuRight.style.flexDirection = "row";
                menuRight.style.justifyContent = "end";
                menuRight.style.alignItems = "center";

                let styleBtn = document.createElement("span");
                    styleBtn.classList.add("material-icons");
                    styleBtn.style.borderRadius = "50%";
                    styleBtn.style.padding = ".25rem";
                    styleBtn.style.marginRight = ".75rem";
                    styleBtn.style.fontSize = "1.5rem";
                    styleBtn.style.background = "#2196f3";
                    styleBtn.style.cursor = "pointer";
                    styleBtn.innerHTML = "invert_colors";
                    styleBtn.onclick = this.changeStyle.bind(this);
                menuRight.appendChild(styleBtn);
            menubar.appendChild(menuRight);
        this._editor.appendChild(menubar);

        let editorContainer = document.createElement("div");
            editorContainer.style.width = "100%";
            editorContainer.style.height = "calc(100% - 11rem)";
            editorContainer.style.position = "relative";
            editorContainer.style.background = "#1e88e5";
            editorContainer.style.color = "white";

            let codeLines = document.createElement("div");
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
                codeLines.style.background = "rgba(255, 255, 255, 0.1)";
                codeLines.style.color = "white";
                codeLines.style.setProperty("mix-blend-mode", "difference");
                codeLines.style.textAlign = "right";
            editorContainer.appendChild(codeLines);

            let codebox = document.createElement("div");
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

        let consolelabel = document.createElement("div");
            consolelabel.style.width = "100%";
            consolelabel.style.height = "1.75rem";
            consolelabel.style.boxSizing = "border-box";
            consolelabel.style.borderTop = "1px solid gray";
            consolelabel.style.borderBottom = "1px solid gray";
            consolelabel.style.padding = ".25rem";
            consolelabel.style.fontFamily = '"PT Mono", monospace';
            consolelabel.style.fontSize = "14px";
            consolelabel.style.fontWeight = "700";
            consolelabel.style.letterSpacing = "normal";
            consolelabel.style.lineHeight = "20px";
            consolelabel.style.color = "indigo"
            consolelabel.style.background = "white";
            consolelabel.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;CONSOLE";
        this._editor.appendChild(consolelabel);

        let editorconsole = document.createElement("div");
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

        const highlight = (editor) => {
            editor.textContent = editor.textContent;
            hljs.highlightBlock(editor);
        };

        this._jar = new CodeJar(codebox, highlight);

        this.generateCode();

        codebox.className = "editor language-js";
        this._jar.updateCode(this._code);
        this._jar.updateOptions({
            tab: ' '.repeat(4), // default is '\t'
            indentOn: /[(\[]$/, // default is /{$/
            spellcheck: false,  // default is false
            addClosing: true    // default is true
        });
        this._jar.onUpdate(code => {
            if (!this._showingHelp)
                this._code = code;
            this.setLinesCount(this._code);
        });

        this.widgetWindow.getWidgetBody().append(this._editor);

        this.widgetWindow.takeFocus();
    }

    static logConsole(message, color) {
        if (color === undefined)
            color = "midnightblue";
        if (docById("editorConsole")) {
            if (docById("editorConsole").innerHTML !== "")
                docById("editorConsole").innerHTML += "</br>";
            docById("editorConsole").innerHTML += `<span style="color: ${color}">${message}</span>`;
        } else {
            console.error("EDITOR MISSING!");
        }
        console.log("%c" + message, `color: ${color}`);
    }

    runCode() {
        if (this._showingHelp)
            return;

        if (docById("editorConsole"))
            docById("editorConsole").innerHTML = "";

        console.debug("Run JavaScript");

        try {
            MusicBlocks.init(true);
            new Function(this._code)();
        } catch (e) {
            JSEditor.logConsole(e, "maroon");
        }
    }

    generateCode() {
        console.debug("Generate JavaScript");

        JSGenerate.run(true);
        this._code = JSGenerate.code;
        this._jar.updateCode(this._code);
    }

    setLinesCount(code) {
        const linesCount = code.replace(/\n+$/, "\n").split("\n").length + 1;
        let text = "";
        for (let i = 1; i < linesCount; i++) {
            text += `${i}\n`;
        }
        docById("editorLines").innerText = text;
    }

    toggleHelp() {
        this._showingHelp = !this._showingHelp;
        let helpBtn = docById("js_editor_help_btn");

        if (this._showingHelp) {
            console.debug("Showing Help");
            helpBtn.style.color = "gold";
            this._codeBck = this._code;
            this._jar.updateCode(JS_API);
            this.setLinesCount(JS_API);
        } else {
            console.debug("Hiding Help");
            helpBtn.style.color = "white";
            this._jar.updateCode(this._codeBck);
            this.setLinesCount(this._codeBck);
            this._code = this._codeBck;
        }
    }

    changeStyle(event) {
        event.preventDefault();

        this.styles[this.currentStyle].setAttribute("disabled", "true");
        this.currentStyle = (this.currentStyle + 1) % this.styles.length;
        this.styles[this.currentStyle].removeAttribute("disabled");
    }
}
