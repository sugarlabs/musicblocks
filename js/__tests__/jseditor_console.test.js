const { JSEditor } = require("../widgets/jseditor");

describe("JSEditor console rendering", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="editorConsole"></div>';
        global.docById = jest.fn(id => document.getElementById(id));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders messages as plain text with line breaks", () => {
        JSEditor.logConsole("<b>hello</b>", "red");
        JSEditor.logConsole("second", "blue");

        const consoleEl = document.getElementById("editorConsole");

        expect(consoleEl.textContent).toBe("<b>hello</b>second");
        expect(consoleEl.querySelector("b")).toBeNull();
        expect(consoleEl.querySelectorAll("br").length).toBe(1);
    });

    it("clears console content", () => {
        JSEditor.logConsole("message", "red");
        JSEditor.clearConsole();

        const consoleEl = document.getElementById("editorConsole");
        expect(consoleEl.textContent).toBe("");
        expect(consoleEl.childNodes.length).toBe(0);
    });
});
