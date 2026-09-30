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

// These tests run the real vendored Raphael and wheelnav, so they exercise the
// hover redraw that moves a selected item's nodes, not a stand-in for it.

const fs = require("fs");
const path = require("path");

const loadVendored = file => {
    window.eval(fs.readFileSync(path.join(__dirname, "../../lib", file), "utf8"));
};

beforeAll(() => {
    // jsdom has no SVG geometry. Raphael only needs these to exist.
    const matrix = () => ({
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
        multiply: matrix,
        inverse: matrix,
        translate: matrix,
        scale: matrix,
        rotate: matrix
    });
    window.SVGSVGElement.prototype.createSVGMatrix = matrix;
    window.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 });

    loadVendored("raphael.min.js");
    loadVendored("wheelnav.js");

    global.docById = id => document.getElementById(id);
    require("../piemenus");
});

afterEach(() => {
    document.body.replaceChildren();
});

let menuCount = 0;

// Builds a menu the way the widgets do: a wheel in its own holder, plus an exit
// wheel drawn on the same Raphael paper.
const makeMenu = (holderId = `menu${menuCount++}`) => {
    const holder = document.createElement("div");
    holder.id = holderId;
    document.body.append(holder);

    const wheel = new window.wheelnav(holderId, null, 200, 200);
    wheel.animatetime = 0;
    wheel.clickModeRotate = false;
    wheel.createWheel(["a", "b", "c"]);

    const exitWheel = new window.wheelnav(`${holderId}Exit`, wheel.raphael);
    exitWheel.createWheel(["×", " "]);

    return { holder, wheel, exitWheel };
};

const titleOf = (wheel, index) => document.getElementById(wheel.getTitleId(index));

// Hovers an item and returns the ids of the nodes wheelnav removed and
// re-inserted while doing it.
const hover = async (wheel, index) => {
    const moved = [];
    const observer = new MutationObserver(records => {
        for (const record of records) {
            for (const node of record.removedNodes) {
                moved.push(node.id);
            }
        }
    });
    observer.observe(wheel.raphael.canvas, { childList: true, subtree: true });
    titleOf(wheel, index).dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await Promise.resolve();
    observer.disconnect();
    return moved;
};

describe("selected item hover in pie menus", () => {
    test("wheelnav re-inserts the selected item's nodes on mouseover", async () => {
        const { wheel } = makeMenu();

        expect(wheel.selectedNavItemIndex).toBe(0);
        const moved = await hover(wheel, 0);

        expect(moved).toEqual(expect.arrayContaining([wheel.getSliceId(0), wheel.getTitleId(0)]));
    });

    test("in a menu set up with configureExitWheel, the selected item stays put", async () => {
        const { wheel, exitWheel } = makeMenu();
        window.configureExitWheel(exitWheel);

        expect(await hover(wheel, 0)).toEqual([]);
        expect(titleOf(wheel, 0).isConnected).toBe(true);
    });

    test("wheels added to that menu after configureExitWheel are covered too", async () => {
        const { wheel, exitWheel } = makeMenu();
        window.configureExitWheel(exitWheel);

        const octaves = new window.wheelnav("octaves", wheel.raphael);
        octaves.animatetime = 0;
        octaves.clickModeRotate = false;
        octaves.createWheel(["1", "2", "3"]);
        octaves.navigateWheel(1);

        expect(await hover(octaves, 1)).toEqual([]);
    });

    test("the other items in that menu still get their hover effect", async () => {
        const { wheel, exitWheel } = makeMenu();
        window.configureExitWheel(exitWheel);

        await hover(wheel, 1);

        expect(wheel.navItems[1].hovered).toBe(true);
    });

    test("wheels outside those menus keep wheelnav's own behaviour", async () => {
        const menu = makeMenu();
        window.configureExitWheel(menu.exitWheel);

        // Like the Mode or Meter widget wheels, which never call configureExitWheel.
        const other = makeMenu();
        const moved = await hover(other.wheel, 0);

        expect(moved).toEqual(expect.arrayContaining([other.wheel.getTitleId(0)]));
    });

    describe("clicking the selected item", () => {
        // wheelDivptm is one of the containers handleOutsideClick watches.
        const openMenu = async () => {
            const menu = makeMenu("wheelDivptm");
            menu.holder.style.display = "";
            const picked = jest.fn();
            menu.wheel.navItems[0].navigateFunction = picked;
            const closed = jest.fn();
            menu.exitWheel.navItems[0].navigateFunction = closed;

            window.configureExitWheel(menu.exitWheel);
            // configureExitWheel starts listening for outside clicks after 50ms.
            await new Promise(resolve => setTimeout(resolve, 60));
            return { ...menu, picked, closed };
        };

        test("a press on the item itself picks it and leaves the menu open", async () => {
            const { wheel, picked, closed } = await openMenu();
            const title = titleOf(wheel, 0);

            title.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            title.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

            expect(closed).not.toHaveBeenCalled();
            expect(picked).toHaveBeenCalledTimes(1);
        });

        test("a press reported on the bare svg closes the menu", async () => {
            // This is what the browser reports when the pressed node has just been
            // moved by the hover redraw. jsdom can't retarget the event itself, so
            // it is dispatched on the <svg> directly.
            const { wheel, picked, closed } = await openMenu();

            wheel.raphael.canvas.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

            expect(closed).toHaveBeenCalledTimes(1);
            expect(picked).not.toHaveBeenCalled();
        });
    });
});
