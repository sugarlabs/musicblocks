const { renderChatMarkdown } = require("../ai-markdown");

describe("ai-markdown", () => {
    it("renders paragraphs, line breaks, bold, italic and code", () => {
        const html = renderChatMarkdown("Use **repeat** and *pitch*.\nThen `start`.\n\nNext part");
        expect(html).toBe(
            "<p>Use <strong>repeat</strong> and <em>pitch</em>.<br>Then <code>start</code>.</p>" +
                "<p>Next part</p>"
        );
    });

    it("renders bullet and numbered lists", () => {
        expect(renderChatMarkdown("- one\n- two")).toBe("<ul><li>one</li><li>two</li></ul>");
        expect(renderChatMarkdown("1. one\n2. two")).toBe("<ol><li>one</li><li>two</li></ol>");
    });

    it("keeps step numbers when a numbered list is split by blank lines or bullets", () => {
        expect(renderChatMarkdown("1. one\n\n2. two")).toBe(
            '<ol><li>one</li></ol><ol start="2"><li>two</li></ol>'
        );
        expect(renderChatMarkdown("1. one\n- detail\n2. two")).toContain('<ol start="2">');
    });

    it("turns headings into bold lines", () => {
        expect(renderChatMarkdown("## What you made")).toBe(
            '<p class="ai-chat-heading"><strong>What you made</strong></p>'
        );
    });

    it("keeps code blocks as written", () => {
        expect(renderChatMarkdown("```\nstart\n  repeat 2\n```")).toBe(
            "<pre><code>start\n  repeat 2</code></pre>"
        );
    });

    it("escapes HTML from the model", () => {
        const html = renderChatMarkdown('<img src=x onerror="alert(1)"> **hi**');
        expect(html).not.toContain("<img");
        expect(html).toContain("&lt;img");
        expect(html).toContain("<strong>hi</strong>");
    });

    it("links only http and https addresses", () => {
        expect(renderChatMarkdown("[guide](https://musicblocks.sugarlabs.org)")).toContain(
            '<a href="https://musicblocks.sugarlabs.org" target="_blank"'
        );
        expect(renderChatMarkdown("[bad](javascript:alert(1))")).not.toContain("<a");
    });

    it("keeps a reply that contains the code span marker readable", () => {
        const marker = String.fromCharCode(0xe000);
        expect(renderChatMarkdown(`${marker}0${marker} and \`start\``)).toBe(
            "<p>0 and <code>start</code></p>"
        );
    });
});
