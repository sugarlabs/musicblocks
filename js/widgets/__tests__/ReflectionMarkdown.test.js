/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
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

const { escapeHTML, isSafeUrl } = require("../../utils/utils");
global.escapeHTML = escapeHTML;
global.isSafeUrl = isSafeUrl;
global._ = text => text;
global.ManagedTimer = require("../../utils/ManagedTimer.js");
global.DOMPurify = require("../../../lib/purify.min.js");

global.ReflectionLifecycle = require("../ReflectionLifecycle.js");
global.ReflectionWindow = require("../ReflectionWindow.js");
global.ReflectionChatLog = require("../ReflectionChatLog.js");
global.ReflectionSession = require("../ReflectionSession.js");
global.ReflectionBackend = require("../ReflectionBackend.js");
global.ReflectionReport = require("../ReflectionReport.js");
global.ReflectionMarkdown = require("../ReflectionMarkdown.js");
const ReflectionMatrix = require("../reflection.js");
global.ReflectionMatrix = ReflectionMatrix;

const ReflectionMarkdown = global.ReflectionMarkdown;
const METHODS = ["sanitizeHTML", "isUnsafeUrl", "mdToHTML"];

describe("ReflectionMarkdown", () => {
    let reflection;

    // The HTML as a detached element, to query.
    const parse = html => {
        const div = document.createElement("div");
        div.innerHTML = html;
        return div;
    };

    beforeEach(() => {
        reflection = new ReflectionMatrix();
    });

    test("holds exactly the Markdown methods", () => {
        const names = Object.getOwnPropertyNames(ReflectionMarkdown.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts each method on the widget", () => {
        for (const name of METHODS) {
            expect(ReflectionMatrix.prototype[name]).toBe(ReflectionMarkdown.prototype[name]);
        }
    });

    describe("mdToHTML", () => {
        test("turns each heading level into its tag", () => {
            const doc = parse(
                reflection.mdToHTML("# One\n## Two\n### Three\n#### Four\n##### Five\n###### Six")
            );

            expect(
                ["h1", "h2", "h3", "h4", "h5", "h6"].map(t => doc.querySelector(t).textContent)
            ).toEqual(["One", "Two", "Three", "Four", "Five", "Six"]);
        });

        test("turns bold and italic marks into tags", () => {
            const doc = parse(reflection.mdToHTML("**strong** and *soft*"));

            expect(doc.querySelector("b").textContent).toBe("strong");
            expect(doc.querySelector("i").textContent).toBe("soft");
        });

        test("turns new lines into line breaks", () => {
            expect(
                parse(reflection.mdToHTML("one\ntwo\nthree")).querySelectorAll("br")
            ).toHaveLength(2);
        });

        test("makes a safe link open in a new tab", () => {
            const link = parse(
                reflection.mdToHTML("[guide](https://example.com/?a=1&b=2)")
            ).firstChild;

            expect(link.tagName).toBe("A");
            expect(link.textContent).toBe("guide");
            expect(link.getAttribute("href")).toBe("https://example.com/?a=1&b=2");
            expect(link.getAttribute("target")).toBe("_blank");
            expect(link.getAttribute("rel")).toBe("noopener noreferrer");
        });

        test("drops the target of an unsafe link", () => {
            const link = parse(reflection.mdToHTML("[click](javascript:alert(1))")).firstChild;

            expect(link.hasAttribute("href")).toBe(false);
            expect(link.hasAttribute("target")).toBe(false);
        });

        test("shows HTML in the reply as text", () => {
            const doc = parse(reflection.mdToHTML("<script>alert(1)</script><img src=x>"));

            expect(doc.querySelector("script")).toBeNull();
            expect(doc.querySelector("img")).toBeNull();
            expect(doc.textContent).toBe("<script>alert(1)</script><img src=x>");
        });
    });

    describe("sanitizeHTML", () => {
        test("removes tags that run code or leave the page", () => {
            const doc = parse(
                reflection.sanitizeHTML(
                    "<p>keep</p><script>x</script><iframe></iframe><object></object>" +
                        "<embed><base href='/'><form></form>"
                )
            );

            expect(doc.innerHTML).toBe("<p>keep</p>");
        });

        test("removes event handlers and form actions", () => {
            const el = parse(
                reflection.sanitizeHTML(
                    "<button onclick='x()' onmouseover='y()' formaction='/z' data='d'>b</button>"
                )
            ).firstChild;

            expect(el.attributes).toHaveLength(0);
        });

        test("keeps a harmless style and drops one that loads or runs anything", () => {
            const doc = parse(
                reflection.sanitizeHTML(
                    "<span style='color: red'>a</span>" +
                        "<span style='background: url(http://x)'>b</span>" +
                        "<span style='width: expression(alert(1))'>c</span>"
                )
            );
            const spans = doc.querySelectorAll("span");

            expect(spans[0].getAttribute("style")).toBe("color: red");
            expect(spans[1].hasAttribute("style")).toBe(false);
            expect(spans[2].hasAttribute("style")).toBe(false);
        });

        test("keeps a safe image source and drops an unsafe one", () => {
            const doc = parse(
                reflection.sanitizeHTML("<img src='https://example.com/a.png'><img src='data:x'>")
            );
            const images = doc.querySelectorAll("img");

            expect(images[0].getAttribute("src")).toBe("https://example.com/a.png");
            expect(images[1].hasAttribute("src")).toBe(false);
        });
    });

    test("isUnsafeUrl is the opposite of isSafeUrl", () => {
        for (const url of ["https://a.b", "http://a.b", "javascript:x", "data:x", "", " "]) {
            expect(reflection.isUnsafeUrl(url)).toBe(!isSafeUrl(url));
        }
    });
});
