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

        it("should remove previous listener when hideOnClickOutside is called again for the same anchor element", () => {
            document.body.innerHTML = `
                <div id="container"><div id="inner">Inside</div></div>
                <div id="target" style="display:block;">Target</div>
            `;

            const container = document.getElementById("container");
            const spyRemove = jest.spyOn(document, "removeEventListener");

            hideOnClickOutside([container], "target");
            hideOnClickOutside([container], "target");
            hideOnClickOutside([container], "target");

            expect(spyRemove).toHaveBeenCalledTimes(2);

            spyRemove.mockRestore();
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
    describe("responsive Planet search", () => {
        let originalRequestAnimationFrame;
        let localTitleTop;
        let globalTitleTop;

        beforeEach(() => {
            jest.resetModules();

            document.body.innerHTML = `
                <div id="publisher"></div>
                <div id="deleter"></div>
                <div id="projectviewer"></div>

                <nav id="main-nav">
                    <a id="planet-new-project"></a>
                    <div id="planet-search-slot"></div>

                    <ul id="localglobal">
                        <li><a id="local-tab"></a></li>
                        <li><a id="global-tab"></a></li>
                    </ul>
                </nav>

                <div id="view-more-chips">Show more tags ▼</div>
                <div id="morechips" class="flexchips"></div>

                <div id="local" style="display:block;">
                    <div class="projects-title-row">
                        <h3 id="localtitle">My Projects</h3>
                        <div class="project-search-preview">
                            <input id="local-search" value="" />
                            <label class="project-search-icon"></label>
                        </div>
                    </div>
                </div>

                <div id="global" style="display:none;">
                    <div class="projects-title-row">
                        <h3 id="globaltitle">Explore Projects</h3>
                        <div class="project-search-preview">
                            <input id="global-search" value="" />
                            <label class="project-search-icon"></label>
                            <span id="search-close"></span>
                        </div>
                    </div>
                </div>
            `;

            originalRequestAnimationFrame = window.requestAnimationFrame;

            window.requestAnimationFrame = callback => {
                callback();
                return 1;
            };

            const navbar = document.getElementById("main-nav");

            navbar.getBoundingClientRect = jest.fn(() => ({
                top: 0,
                bottom: 64,
                height: 64
            }));

            localTitleTop = 20;
            globalTitleTop = 20;

            document.querySelector("#local .projects-title-row").getBoundingClientRect = jest.fn(
                () => ({
                    top: localTitleTop,
                    bottom: localTitleTop + 90,
                    height: 90
                })
            );

            document.querySelector("#global .projects-title-row").getBoundingClientRect = jest.fn(
                () => ({
                    top: globalTitleTop,
                    bottom: globalTitleTop + 90,
                    height: 90
                })
            );

            jest.isolateModules(() => {
                require("../helper");
            });
        });

        afterEach(() => {
            window.requestAnimationFrame = originalRequestAnimationFrame;
        });

        it("should dock the active Local search into the navbar slot", () => {
            const slot = document.getElementById("planet-search-slot");
            const search = document.getElementById("local-search").parentElement;

            expect(slot.contains(search)).toBe(true);
            expect(search.classList.contains("project-search-docked")).toBe(true);
        });

        it("should restore the search above the docking threshold", () => {
            const titleRow = document.querySelector("#local .projects-title-row");
            const search = document.getElementById("local-search").parentElement;

            localTitleTop = 100;
            window.dispatchEvent(new Event("scroll"));

            expect(titleRow.contains(search)).toBe(true);
            expect(search.classList.contains("project-search-docked")).toBe(false);
        });

        it("should switch the docked search when the active tab changes", () => {
            const slot = document.getElementById("planet-search-slot");

            const localSection = document.getElementById("local");
            const globalSection = document.getElementById("global");

            const localTitleRow = localSection.querySelector(".projects-title-row");
            const localSearch = document.getElementById("local-search").parentElement;
            const globalSearch = document.getElementById("global-search").parentElement;

            localSection.style.display = "none";
            globalSection.style.display = "block";

            document
                .getElementById("global-tab")
                .dispatchEvent(new Event("click", { bubbles: true }));

            expect(localTitleRow.contains(localSearch)).toBe(true);
            expect(slot.contains(globalSearch)).toBe(true);
            expect(globalSearch.classList.contains("project-search-docked")).toBe(true);
        });

        it("should preserve input focus while docking and restoring the search", () => {
            const slot = document.getElementById("planet-search-slot");
            const titleRow = document.querySelector("#local .projects-title-row");
            const input = document.getElementById("local-search");
            const search = input.parentElement;

            localTitleTop = 100;
            window.dispatchEvent(new Event("scroll"));

            expect(titleRow.contains(search)).toBe(true);

            input.focus();
            expect(document.activeElement).toBe(input);

            const focusSpy = jest.spyOn(input, "focus");

            localTitleTop = 20;
            window.dispatchEvent(new Event("scroll"));

            expect(slot.contains(search)).toBe(true);
            expect(document.activeElement).toBe(input);
            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

            localTitleTop = 100;
            window.dispatchEvent(new Event("scroll"));

            expect(titleRow.contains(search)).toBe(true);
            expect(document.activeElement).toBe(input);
            expect(focusSpy).toHaveBeenCalledTimes(2);
        });

        it("should recalculate docking on resize", () => {
            const titleRow = document.querySelector("#local .projects-title-row");
            const search = document.getElementById("local-search").parentElement;

            localTitleTop = 100;
            window.dispatchEvent(new Event("resize"));

            expect(titleRow.contains(search)).toBe(true);
        });

        it("should defer docking while IME composition is active", () => {
            const slot = document.getElementById("planet-search-slot");
            const titleRow = document.querySelector("#local .projects-title-row");
            const input = document.getElementById("local-search");
            const search = input.parentElement;

            // Start with the search restored in its title row.
            localTitleTop = 100;
            window.dispatchEvent(new Event("scroll"));

            expect(titleRow.contains(search)).toBe(true);

            input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));

            // Crossing the threshold should not move the composing input.
            localTitleTop = 20;
            window.dispatchEvent(new Event("scroll"));

            expect(titleRow.contains(search)).toBe(true);
            expect(slot.contains(search)).toBe(false);

            // Once composition finishes, docking is retried.
            input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));

            expect(slot.contains(search)).toBe(true);
            expect(search.classList.contains("project-search-docked")).toBe(true);
        });
    });
});
