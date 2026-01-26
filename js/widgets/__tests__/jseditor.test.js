/**
 * Tests for JSEditor Widget
 */

global._ = msg => msg;
global.docById = jest.fn();

// Mock dependencies
global.CodeJar = jest.fn().mockImplementation(() => ({
    updateCode: jest.fn(),
    onUpdate: jest.fn(),
    updateOptions: jest.fn()
}));
global.hljs = {
    configure: jest.fn(),
    highlightElement: jest.fn(),
    highlightBlock: jest.fn()
};
global.acorn = { parse: jest.fn() };
global.AST2BlockList = { toBlockList: jest.fn() };
global.JSGenerate = { run: jest.fn(), code: "" };
global.MusicBlocks = { init: jest.fn() };

// Mock DOM
const createMockElement = tagName => ({
    tagName,
    style: {},
    appendChild: jest.fn(),
    innerHTML: "",
    addEventListener: jest.fn(),
    classList: { add: jest.fn() },
    getBoundingClientRect: jest.fn().mockReturnValue({ top: 0, left: 0, bottom: 0, right: 0 }),
    childNodes: []
});

global.document = {
    createElement: jest.fn().mockImplementation(createMockElement),
    head: { appendChild: jest.fn() },
    body: { appendChild: jest.fn() },
    querySelector: jest.fn(),
};

global.window = {
    scrollY: 0,
    scrollX: 0
};

// Mock Widget Window
const mockWidgetWindow = {
    getWidgetBody: jest.fn().mockReturnValue({
        childNodes: [],
        append: jest.fn()
    }),
    takeFocus: jest.fn(),
    onmaximize: null,
    clear: jest.fn(),
    show: jest.fn(),
    setPosition: jest.fn(),
};

global.window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue(mockWidgetWindow)
};
global.docById.mockReturnValue({ height: 500, style: {}, innerText: "", innerHTML: "" });

const JSEditor = require("../jseditor.js"); // Assuming jseditor.js exports the class or sets global. No, it sets window.jsEditor usually?
// Actually jseditor.js content shows "class JSEditor ..." but doesn't show "module.exports".
// It ends with: "window.jsEditor = this;" inside constructor? No, inside _setup.
// And it seems to rely on being loaded as a script. 
// If it's not a module, simple requiring it might not return the class if it doesn't assign to module.exports.
// However, the file content shows "class JSEditor". If it is not exported, we can't import it in Node test.
// We might need to eval it or rely on it setting a global if we require it. 
// Let's assume standard behavior for this codebase. PitchSlider uses `require("../pitchslider.js")`.
// This implies `pitchslider.js` has `module.exports`.
// I'll assume `jseditor.js` also has `module.exports = JSEditor;` at the end (not shown in my view_file output). 
// Let's verify that.

describe("JSEditor Highlight Compatibility", () => {
    let activityMock;

    beforeEach(() => {
        jest.clearAllMocks();
        activityMock = {
            logo: {},
            blocks: {},
            stage: { removeAllEventListeners: jest.fn(), addEventListener: jest.fn() }
        };
    });

    test("should use highlightElement if available (v11+)", () => {
        // Setup v11 env
        global.hljs.highlightElement = jest.fn();
        global.hljs.highlightBlock = jest.fn();

        // Instantiate
        const editor = new JSEditor(activityMock); // This calls _setup, which calls new CodeJar(..., highlight)

        // helper to get the highlight callback passed to CodeJar
        const highlightCallback = global.CodeJar.mock.calls[0][1];

        const mockEditorElem = {
            querySelectorAll: jest.fn().mockReturnValue([]),
            textContent: "code",
            innerHTML: ""
        };
        highlightCallback(mockEditorElem);

        expect(global.hljs.highlightElement).toHaveBeenCalledWith(mockEditorElem);
        expect(global.hljs.highlightBlock).not.toHaveBeenCalled();
    });

    test("should fallback to highlightBlock if highlightElement is missing (v10-)", () => {
        // Setup v10 env
        global.hljs.highlightElement = undefined;
        global.hljs.highlightBlock = jest.fn();

        // Instantiate
        // Note: we need to use a fresh instance or CodeJar mock needs to be reset, but beforeEach does clearAllMocks logic.
        // However, JSEditor constructor calls _setup so new instance is needed.
        const editor = new JSEditor(activityMock);

        const highlightCallback = global.CodeJar.mock.calls[0][1];

        const mockEditorElem = {
            querySelectorAll: jest.fn().mockReturnValue([]),
            textContent: "code",
            innerHTML: ""
        };
        highlightCallback(mockEditorElem);

        expect(global.hljs.highlightBlock).toHaveBeenCalledWith(mockEditorElem);
    });
});
