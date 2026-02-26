/**
 * MusicBlocks
 *
 * @author kh-ub-ayb
 *
 * @copyright 2026 kh-ub-ayb
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Set up globals required by jseditor.js
global._ = str => str;
global.docById = jest.fn(id => document.getElementById(id));

// Mock CodeJar
global.CodeJar = jest.fn().mockImplementation(() => ({
    updateCode: jest.fn(),
    updateOptions: jest.fn(),
    onUpdate: jest.fn()
}));

// Mock hljs
global.hljs = {
    configure: jest.fn(),
    highlightElement: jest.fn(),
    highlightBlock: jest.fn()
};

// Mock acorn
global.acorn = {
    parse: jest.fn()
};

// Mock JSGenerate
global.JSGenerate = {
    run: jest.fn(),
    code: 'console.log("hello");'
};

// Mock MusicBlocks
global.MusicBlocks = {
    init: jest.fn()
};

// Mock JS_API (help text)
global.JS_API =
    "// Music Blocks JavaScript API\n// Available functions:\n// playNote()\n// setTempo()";

/**
 * Creates a mock widgetWindow object with all required methods.
 * The widget body is appended to document.body so getElementById works.
 * @returns {Object} Mock widget window.
 */
function createMockWidgetWindow() {
    const widgetBody = document.createElement("div");
    widgetBody.id = "mockWidgetBody";
    document.body.appendChild(widgetBody);

    const widgetFrame = document.createElement("div");
    widgetFrame.style.position = "absolute";
    document.body.appendChild(widgetFrame);

    return {
        clear: jest.fn(),
        show: jest.fn(),
        onclose: null,
        onmaximize: null,
        addButton: jest.fn(() => {
            const btn = document.createElement("div");
            const img = document.createElement("img");
            btn.appendChild(img);
            return btn;
        }),
        sendToCenter: jest.fn(),
        getWidgetBody: jest.fn(() => widgetBody),
        getWidgetFrame: jest.fn(() => widgetFrame),
        isMaximized: jest.fn(() => false),
        destroy: jest.fn(),
        updateTitle: jest.fn(),
        takeFocus: jest.fn(),
        setPosition: jest.fn(),
        _widgetBody: widgetBody,
        _frame: widgetFrame,
        _body: widgetBody,
        _maximized: false
    };
}

let mockWidgetWindow;

// Set up overlayCanvas needed by _setup
const overlayCanvas = document.createElement("canvas");
overlayCanvas.id = "overlayCanvas";
overlayCanvas.height = 600;
document.body.appendChild(overlayCanvas);

// Load JSEditor — it has a CommonJS export
beforeEach(() => {
    document.body.innerHTML = "";
    // Re-create overlayCanvas
    const canvas = document.createElement("canvas");
    canvas.id = "overlayCanvas";
    canvas.height = 600;
    document.body.appendChild(canvas);

    mockWidgetWindow = createMockWidgetWindow();
    window.widgetWindows = {
        openWindows: {},
        _posCache: {},
        windowFor: jest.fn(() => mockWidgetWindow),
        isOpen: jest.fn(() => false)
    };

    // Reset mocks
    jest.clearAllMocks();
    global.JSGenerate.code = 'console.log("hello");';
    global.acorn.parse = jest.fn();
    global.CodeJar = jest.fn().mockImplementation(() => ({
        updateCode: jest.fn(),
        updateOptions: jest.fn(),
        onUpdate: jest.fn()
    }));
});

const { JSEditor } = require("../jseditor.js");

/**
 * Creates a mock activity object for JSEditor.
 * @returns {Object} A mock activity.
 */
function createMockActivity() {
    return {
        logo: {
            statusMatrix: null,
            inStatusMatrix: false
        },
        blocks: {
            protoBlockDict: {},
            palettes: {
                getProtoNameAndPalette: jest.fn(() => ["proto", "palette", "name"]),
                showPalette: jest.fn(),
                dict: {}
            },
            moveBlock: jest.fn(),
            loadNewBlocks: jest.fn()
        },
        stage: {
            removeAllEventListeners: jest.fn(),
            addEventListener: jest.fn()
        },
        sendAllToTrash: jest.fn()
    };
}

/**
 * Creates a JSEditor instance with mocked dependencies.
 * @returns {JSEditor} The editor instance.
 */
function createEditor() {
    const activity = createMockActivity();
    return new JSEditor(activity);
}

describe("JSEditor", () => {
    describe("constructor and widget setup", () => {
        test("sets activity reference", () => {
            const editor = createEditor();

            expect(editor.activity).toBeDefined();
        });

        test("initializes isOpen to true", () => {
            const editor = createEditor();

            expect(editor.isOpen).toBe(true);
        });

        test("initializes _showingHelp to false", () => {
            const editor = createEditor();

            expect(editor._showingHelp).toBe(false);
        });

        test("sets widgetWindow reference", () => {
            const editor = createEditor();

            expect(editor.widgetWindow).toBe(mockWidgetWindow);
        });

        test("calls widgetWindow.clear", () => {
            createEditor();

            expect(mockWidgetWindow.clear).toHaveBeenCalled();
        });

        test("calls widgetWindow.show", () => {
            createEditor();

            expect(mockWidgetWindow.show).toHaveBeenCalled();
        });

        test("calls widgetWindow.setPosition", () => {
            createEditor();

            expect(mockWidgetWindow.setPosition).toHaveBeenCalledWith(160, 132);
        });

        test("creates _editor div element", () => {
            const editor = createEditor();

            expect(editor._editor).toBeDefined();
            expect(editor._editor.tagName).toBe("DIV");
        });

        test("initializes _jar to a CodeJar instance", () => {
            const editor = createEditor();

            expect(editor._jar).toBeDefined();
        });

        test("initializes _code from JSGenerate", () => {
            const editor = createEditor();

            expect(editor._code).toBe('console.log("hello");');
        });

        test("initializes _codeBck to null", () => {
            const editor = createEditor();

            expect(editor._codeBck).toBeNull();
        });

        test("initializes _currentStyle to 0", () => {
            const editor = createEditor();

            expect(editor._currentStyle).toBe(0);
        });

        test("creates 4 editor styles", () => {
            const editor = createEditor();

            expect(editor._styles).toHaveLength(4);
        });

        test("calls windowFor with correct arguments", () => {
            createEditor();

            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                expect.anything(),
                "JavaScript Editor",
                "JavaScript Editor"
            );
        });

        test("calls takeFocus after setup", () => {
            createEditor();

            expect(mockWidgetWindow.takeFocus).toHaveBeenCalled();
        });

        test("sets window.jsEditor to self", () => {
            const editor = createEditor();

            expect(window.jsEditor).toBe(editor);
        });

        test("calls JSGenerate.run during setup", () => {
            createEditor();

            expect(JSGenerate.run).toHaveBeenCalledWith(true);
        });

        test("appends editor to widget body", () => {
            const editor = createEditor();

            expect(mockWidgetWindow.getWidgetBody().contains(editor._editor)).toBe(true);
        });
    });

    describe("code editing functions", () => {
        test("_generateCode calls JSGenerate.run", () => {
            const editor = createEditor();
            JSGenerate.run.mockClear();

            editor._generateCode();

            expect(JSGenerate.run).toHaveBeenCalledWith(true);
        });

        test("_generateCode updates _code from JSGenerate", () => {
            const editor = createEditor();
            JSGenerate.code = "const x = 42;";

            editor._generateCode();

            expect(editor._code).toBe("const x = 42;");
        });

        test("_generateCode updates jar with new code", () => {
            const editor = createEditor();
            JSGenerate.code = "const y = 99;";

            editor._generateCode();

            expect(editor._jar.updateCode).toHaveBeenCalledWith("const y = 99;");
        });

        test("_generateCode sets _showingHelp to false", () => {
            const editor = createEditor();
            editor._showingHelp = true;

            editor._generateCode();

            expect(editor._showingHelp).toBe(false);
        });

        test("_setLinesCount generates correct line numbers", () => {
            const editor = createEditor();

            editor._setLinesCount("line1\nline2\nline3\n");

            const linesEl = document.getElementById("editorLines");
            expect(linesEl).not.toBeNull();
            expect(linesEl.innerText).toContain("1");
            expect(linesEl.innerText).toContain("2");
            expect(linesEl.innerText).toContain("3");
        });

        test("_setLinesCount does nothing when editorLines missing", () => {
            const editor = createEditor();

            // Should not throw
            expect(() => editor._setLinesCount("some code")).not.toThrow();
        });

        test("_toggleHelp toggles _showingHelp flag", () => {
            const editor = createEditor();
            const helpBtn = document.createElement("span");
            helpBtn.id = "js_editor_help_btn";
            document.body.appendChild(helpBtn);

            expect(editor._showingHelp).toBe(false);

            editor._toggleHelp();
            expect(editor._showingHelp).toBe(true);

            editor._toggleHelp();
            expect(editor._showingHelp).toBe(false);
        });

        test("_toggleHelp saves code backup when showing help", () => {
            const editor = createEditor();
            const helpBtn = document.createElement("span");
            helpBtn.id = "js_editor_help_btn";
            document.body.appendChild(helpBtn);

            editor._code = "my code";
            editor._toggleHelp();

            expect(editor._codeBck).toBe("my code");
        });

        test("_toggleHelp shows JS_API when toggling on", () => {
            const editor = createEditor();
            const helpBtn = document.createElement("span");
            helpBtn.id = "js_editor_help_btn";
            document.body.appendChild(helpBtn);

            editor._toggleHelp();

            expect(editor._jar.updateCode).toHaveBeenCalledWith(JS_API);
        });

        test("_toggleHelp restores code backup when toggling off", () => {
            const editor = createEditor();
            const helpBtn = document.createElement("span");
            helpBtn.id = "js_editor_help_btn";
            document.body.appendChild(helpBtn);

            editor._code = "original code";
            editor._toggleHelp(); // on
            editor._toggleHelp(); // off

            expect(editor._code).toBe("original code");
        });

        test("_toggleHelp changes help button color to gold when on", () => {
            const editor = createEditor();

            // _setup() already created js_editor_help_btn
            const helpBtn = document.getElementById("js_editor_help_btn");
            expect(helpBtn).not.toBeNull();

            editor._toggleHelp();

            expect(helpBtn.style.color).toBe("gold");
        });

        test("_toggleHelp changes help button color to white when off", () => {
            const editor = createEditor();

            const helpBtn = document.getElementById("js_editor_help_btn");
            expect(helpBtn).not.toBeNull();

            editor._toggleHelp();
            editor._toggleHelp();

            expect(helpBtn.style.color).toBe("white");
        });

        test("_toggleConsole hides console and changes arrow", () => {
            const editor = createEditor();

            // _setup() already created editorConsole and editor_console_btn
            const consoleEl = document.getElementById("editorConsole");
            const arrowBtn = document.getElementById("editor_console_btn");
            expect(consoleEl).not.toBeNull();
            expect(arrowBtn).not.toBeNull();

            editor._toggleConsole();

            expect(editor.isOpen).toBe(false);
            expect(consoleEl.style.display).toBe("none");
            expect(arrowBtn.innerHTML).toBe("keyboard_arrow_up");
        });

        test("_toggleConsole shows console and changes arrow back", () => {
            const editor = createEditor();

            const consoleEl = document.getElementById("editorConsole");
            const arrowBtn = document.getElementById("editor_console_btn");

            editor._toggleConsole(); // hide
            editor._toggleConsole(); // show

            expect(editor.isOpen).toBe(true);
            expect(consoleEl.style.display).toBe("block");
            expect(arrowBtn.innerHTML).toBe("keyboard_arrow_down");
        });

        test("_markErrorSpan inserts error span into editor", () => {
            const editor = createEditor();
            const editorEl = document.createElement("div");
            editorEl.textContent = "const x = ;";

            editor._markErrorSpan(editorEl, 10, 11, "Unexpected token");

            expect(editorEl.innerHTML).toContain('class="error"');
            expect(editorEl.innerHTML).toContain('title="Unexpected token"');
        });

        test("_markErrorSpan preserves text before and after error", () => {
            const editor = createEditor();
            const editorEl = document.createElement("div");
            editorEl.textContent = "abcdefghij";

            editor._markErrorSpan(editorEl, 3, 7, "Error");

            expect(editorEl.innerHTML).toContain("abc");
            expect(editorEl.innerHTML).toContain("hij");
            expect(editorEl.innerHTML).toContain("defg");
        });

        test("_addDebuggerToLine inserts debugger statement", () => {
            const editor = createEditor();

            editor._code = "const x = 1;\nconst y = 2;\nconst z = 3;";

            // lineNumber is 1-based (insertIndex = lineNumber - 1)
            editor._addDebuggerToLine(1);

            expect(editor._code).toContain("debugger;");
        });

        test("_removeDebuggerFromLine removes debugger statement", () => {
            const editor = createEditor();

            editor._code = "const x = 1;\ndebugger;\nconst y = 2;";

            editor._removeDebuggerFromLine(1);

            expect(editor._code).not.toContain("debugger;");
        });
    });

    describe("export/run functionality", () => {
        test("_runCode does nothing when _showingHelp is true", () => {
            const editor = createEditor();
            editor._showingHelp = true;

            editor._runCode();

            expect(MusicBlocks.init).not.toHaveBeenCalled();
        });

        test("_runCode clears old console output and logs new output", () => {
            const editor = createEditor();

            // The constructor's _setup() already created editorConsole
            const consoleEl = document.getElementById("editorConsole");
            expect(consoleEl).not.toBeNull();
            consoleEl.textContent = "previous output";

            editor._code = "const a = 1;";

            editor._runCode();

            // Old content should be gone (clearConsole was called)
            expect(consoleEl.textContent).not.toContain("previous output");
        });

        test("_runCode calls MusicBlocks.init on valid code", () => {
            const editor = createEditor();
            const consoleEl = document.createElement("div");
            consoleEl.id = "editorConsole";
            document.body.appendChild(consoleEl);

            editor._code = "const a = 1;";
            acorn.parse.mockImplementation(() => ({}));

            editor._runCode();

            expect(MusicBlocks.init).toHaveBeenCalledWith(true);
        });

        test("_runCode logs syntax error on parse failure", () => {
            const editor = createEditor();

            const consoleEl = document.getElementById("editorConsole");
            expect(consoleEl).not.toBeNull();

            editor._code = "const = ;";
            acorn.parse.mockImplementation(() => {
                throw new SyntaxError("Unexpected token");
            });

            editor._runCode();

            expect(consoleEl.textContent).toContain("Syntax Error");
        });

        test("_runCode does not call MusicBlocks.init on syntax error", () => {
            const editor = createEditor();
            const consoleEl = document.createElement("div");
            consoleEl.id = "editorConsole";
            document.body.appendChild(consoleEl);

            editor._code = "invalid!!!";
            acorn.parse.mockImplementation(() => {
                throw new SyntaxError("Bad");
            });

            editor._runCode();

            expect(MusicBlocks.init).not.toHaveBeenCalled();
        });

        test("logConsole appends message to console element", () => {
            const consoleEl = document.createElement("div");
            consoleEl.id = "editorConsole";
            document.body.appendChild(consoleEl);

            JSEditor.logConsole("Test message");

            expect(consoleEl.textContent).toContain("Test message");
        });

        test("logConsole uses default midnightblue color", () => {
            const consoleEl = document.createElement("div");
            consoleEl.id = "editorConsole";
            document.body.appendChild(consoleEl);

            JSEditor.logConsole("Msg");

            const span = consoleEl.querySelector("span");
            expect(span.style.color).toBe("midnightblue");
        });

        test("logConsole uses specified color", () => {
            const consoleEl = document.createElement("div");
            consoleEl.id = "editorConsole";
            document.body.appendChild(consoleEl);

            JSEditor.logConsole("Error msg", "red");

            const span = consoleEl.querySelector("span");
            expect(span.style.color).toBe("red");
        });

        test("logConsole adds line break between messages", () => {
            const consoleEl = document.createElement("div");
            consoleEl.id = "editorConsole";
            document.body.appendChild(consoleEl);

            JSEditor.logConsole("First");
            JSEditor.logConsole("Second");

            const brs = consoleEl.querySelectorAll("br");
            expect(brs.length).toBeGreaterThanOrEqual(1);
        });

        test("logConsole does nothing when console element missing", () => {
            // No console element in DOM
            expect(() => JSEditor.logConsole("msg")).not.toThrow();
        });

        test("clearConsole clears console content", () => {
            const consoleEl = document.createElement("div");
            consoleEl.id = "editorConsole";
            consoleEl.textContent = "some output";
            document.body.appendChild(consoleEl);

            JSEditor.clearConsole();

            expect(consoleEl.textContent).toBe("");
        });

        test("clearConsole does nothing when console element missing", () => {
            expect(() => JSEditor.clearConsole()).not.toThrow();
        });

        test("_changeStyle cycles through styles", () => {
            const editor = createEditor();
            const event = { preventDefault: jest.fn() };
            const initial = editor._currentStyle;

            editor._changeStyle(event);

            expect(editor._currentStyle).toBe((initial + 1) % editor._styles.length);
        });

        test("_changeStyle calls event.preventDefault", () => {
            const editor = createEditor();
            const event = { preventDefault: jest.fn() };

            editor._changeStyle(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        test("_changeStyle wraps around to 0 at end", () => {
            const editor = createEditor();
            const event = { preventDefault: jest.fn() };

            // Cycle through all styles
            for (let i = 0; i < editor._styles.length; i++) {
                editor._changeStyle(event);
            }

            expect(editor._currentStyle).toBe(0);
        });
    });
});
