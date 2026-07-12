/**
 * MusicBlocks v3.4.1
 *
 * @author Sapnil Biswas
 *
 * @copyright 2026 Music Blocks contributors
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

// Mock globals used by helper.js
global._ = jest.fn(str => str);

// Mock jQuery ($) — helper.js calls $(document).ready(…) and $("selector").modal()
const jqMock = jest.fn(() => ({
    modal: jest.fn(),
    material_select: jest.fn(),
    ready: jest.fn(fn => fn())
}));
global.$ = jqMock;

// Create required DOM elements before loading helper.js
function setupHelperDOM() {
    document.body.innerHTML = `
        <div id="publisher"></div>
        <div id="deleter"></div>
        <div id="projectviewer"></div>
        <input id="global-search" value="" />
        <div id="search-close" style="display:none;"></div>
        <div id="local-tab"></div>
        <div id="global-tab"></div>
        <div id="searchcontainer" style="display:block;"></div>
        <div id="view-more-chips">Show more tags ▼</div>
        <div id="morechips" class="flexchips"></div>
    `;
}

// We need to set up DOM before requiring helper.js because it has $(document).ready
setupHelperDOM();

const {
    getCookie,
    setCookie,
    toggleText,
    toggleExpandable,
    hideOnClickOutside,
    updateCheckboxes
} = require("../helper");

describe("helper.js", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset DOM
        document.body.innerHTML = "";
    });

    describe("getCookie", () => {
        afterEach(() => {
            // Clear cookies
            document.cookie.split(";").forEach(c => {
                document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970";
            });
        });

        it("should return an empty string when no cookies exist", () => {
            expect(getCookie("nonexistent")).toBe("");
        });

        it("should return the correct value for an existing cookie", () => {
            document.cookie = "testCookie=hello123";
            expect(getCookie("testCookie")).toBe("hello123");
        });

        it("should handle multiple cookies and return the correct one", () => {
            document.cookie = "first=1";
            document.cookie = "second=2";
            document.cookie = "third=3";
            expect(getCookie("second")).toBe("2");
        });

        it("should return empty string for a cookie name that does not exist among others", () => {
            document.cookie = "alpha=a";
            document.cookie = "beta=b";
            expect(getCookie("gamma")).toBe("");
        });

        it("should handle cookies with leading spaces", () => {
            document.cookie = "spacedCookie=spaceValue";
            expect(getCookie("spacedCookie")).toBe("spaceValue");
        });

        it("should handle cookies with encoded characters in the value", () => {
            document.cookie = "encoded=hello%20world";
            // getCookie uses decodeURIComponent, so %20 is decoded to a space
            expect(getCookie("encoded")).toBe("hello world");
        });

        it("should not partially match cookie names", () => {
            document.cookie = "testCookieLong=longvalue";
            // Searching for "testCookie" should not match "testCookieLong"
            // (depends on exact match behavior)
            expect(getCookie("testCookie")).toBe("");
        });
    });

    describe("setCookie", () => {
        afterEach(() => {
            document.cookie.split(";").forEach(c => {
                document.cookie = c.trim().split("=")[0] + "=;expires=Thu, 01 Jan 1970";
            });
        });

        it("should set a cookie with the given name and value", () => {
            setCookie("myKey", "myValue", 1);
            expect(getCookie("myKey")).toBe("myValue");
        });

        it("should overwrite an existing cookie with the same name", () => {
            setCookie("overwrite", "first", 1);
            setCookie("overwrite", "second", 1);
            expect(getCookie("overwrite")).toBe("second");
        });

        it("should set a cookie that can be retrieved", () => {
            setCookie("retrievable", "data123", 30);
            expect(getCookie("retrievable")).toBe("data123");
        });
    });

    describe("toggleExpandable", () => {
        it("should toggle from base class to open class", () => {
            document.body.innerHTML = '<div id="myEl" class="myClass"></div>';
            toggleExpandable("myEl", "myClass");
            expect(document.getElementById("myEl").className).toBe("myClass open");
        });

        it("should toggle from open class back to base class", () => {
            document.body.innerHTML = '<div id="myEl" class="myClass open"></div>';
            toggleExpandable("myEl", "myClass");
            expect(document.getElementById("myEl").className).toBe("myClass");
        });

        it("should toggle back and forth correctly", () => {
            document.body.innerHTML = '<div id="toggle" class="cls"></div>';
            const el = document.getElementById("toggle");

            toggleExpandable("toggle", "cls");
            expect(el.className).toBe("cls open");

            toggleExpandable("toggle", "cls");
            expect(el.className).toBe("cls");

            toggleExpandable("toggle", "cls");
            expect(el.className).toBe("cls open");
        });
    });

    describe("toggleText", () => {
        it("should toggle the visible text without parsing HTML", () => {
            document.body.innerHTML = '<div id="view-more-chips">Show more tags ▼</div>';

            toggleText("view-more-chips", "Show more tags ▼", "Show fewer tags ▲");
            expect(document.getElementById("view-more-chips").textContent).toBe(
                "Show fewer tags ▲"
            );

            toggleText("view-more-chips", "Show more tags ▼", "Show fewer tags ▲");
            expect(document.getElementById("view-more-chips").textContent).toBe("Show more tags ▼");
        });

        it("should not interpret malicious HTML when toggling text", () => {
            document.body.innerHTML = '<div id="view-more-chips"></div>';
            const el = document.getElementById("view-more-chips");

            el.textContent = "Show more tags ▼<img src=x onerror=alert(1)>";

            toggleText("view-more-chips", "Show more tags ▼", "Show fewer tags ▲");

            expect(el.querySelector("img")).toBe(null);
            expect(el.textContent).toBe("Show fewer tags ▲<img src=x onerror=alert(1)>");
        });
    });

    describe("hideOnClickOutside", () => {
        it("should hide the target element when clicking outside", () => {
            document.body.innerHTML = `
                <div id="container"><div id="inner">Inside</div></div>
                <div id="target" style="display:block;">Target</div>
                <div id="outside">Outside</div>
            `;

            const container = document.getElementById("container");
            hideOnClickOutside([container], "target");

            // Simulate a click outside
            const outsideEl = document.getElementById("outside");
            const event = new Event("click", { bubbles: true });

            // Mock composedPath to return a path that does NOT include the container
            event.composedPath = () => [outsideEl, document.body, document];
            document.dispatchEvent(event);

            expect(document.getElementById("target").style.display).toBe("none");
        });

        it("should not hide the target element when clicking inside", () => {
            document.body.innerHTML = `
                <div id="container"><div id="inner">Inside</div></div>
                <div id="target" style="display:block;">Target</div>
            `;

            const container = document.getElementById("container");
            hideOnClickOutside([container], "target");

            const inner = document.getElementById("inner");
            const event = new Event("click", { bubbles: true });
            event.composedPath = () => [inner, container, document.body, document];
            document.dispatchEvent(event);

            expect(document.getElementById("target").style.display).toBe("block");
        });
    });

    describe("updateCheckboxes", () => {
        it("should build URL from checked checkboxes", () => {
            document.body.innerHTML = `
                <div id="sharebox">
                    <input type="text" data-originalurl="https://example.com?id=123" />
                    <input type="checkbox" name="run" checked />
                    <input type="checkbox" name="show" />
                    <input type="checkbox" name="collapse" checked />
                </div>
            `;

            updateCheckboxes("sharebox");

            const urlInput = document.querySelector("#sharebox input[type=text]");
            expect(urlInput.value).toBe("https://example.com?id=123&run=True&collapse=True");
        });

        it("should return just the original URL when no checkboxes are checked", () => {
            document.body.innerHTML = `
                <div id="sharebox">
                    <input type="text" data-originalurl="https://example.com?id=456" />
                    <input type="checkbox" name="run" />
                    <input type="checkbox" name="show" />
                </div>
            `;

            updateCheckboxes("sharebox");

            const urlInput = document.querySelector("#sharebox input[type=text]");
            expect(urlInput.value).toBe("https://example.com?id=456");
        });

        it("should include all checked checkboxes in the URL", () => {
            document.body.innerHTML = `
                <div id="sharebox">
                    <input type="text" data-originalurl="https://example.com" />
                    <input type="checkbox" name="a" checked />
                    <input type="checkbox" name="b" checked />
                    <input type="checkbox" name="c" checked />
                </div>
            `;

            updateCheckboxes("sharebox");

            const urlInput = document.querySelector("#sharebox input[type=text]");
            expect(urlInput.value).toBe("https://example.com&a=True&b=True&c=True");
        });
    });
});
