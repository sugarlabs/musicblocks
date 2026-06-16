const { extractProjectDataFromHTML } = require("../utils/utils");

describe("extractProjectDataFromHTML", () => {
    it("extracts project data from valid HTML with id=codeBlock", () => {
        const html = '<div class="code" id="codeBlock">{"blocks":[]}</div>';
        const result = extractProjectDataFromHTML(html);
        expect(result).toBe('{"blocks":[]}');
    });

    it("extracts project data from valid HTML without id", () => {
        const html = '<div class="code">{"blocks":[]}</div>';
        const result = extractProjectDataFromHTML(html);
        expect(result).toBe('{"blocks":[]}');
    });

    it("returns null for HTML without any code div", () => {
        const html = "<html><body>hello world</body></html>";
        const result = extractProjectDataFromHTML(html);
        expect(result).toBeNull();
    });

    it("returns null for empty code div — prevents empty string reaching JSON.parse", () => {
        // matchResult[1] = "" (falsy) when div exists but has no content.
        // Empty string passed to JSON.parse() throws SyntaxError.
        const html = '<div class="code"></div>';
        const result = extractProjectDataFromHTML(html);
        expect(result).toBeNull();
    });

    it("returns null for HTML containing 'html' keyword but no code div", () => {
        // Simulates: file that passes includes("html") check but lacks project data.
        const html = "<!DOCTYPE html><html><head></head><body></body></html>";
        const result = extractProjectDataFromHTML(html);
        expect(result).toBeNull();
    });

    it("extracts multiline project data correctly", () => {
        // [\s\S] regex handles newlines inside the div
        const html = '<div class="code">{"blocks":[\n{"name":"start"}\n]}</div>';
        const result = extractProjectDataFromHTML(html);
        expect(result).toBe('{"blocks":[\n{"name":"start"}\n]}');
    });
});
