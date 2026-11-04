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

// Integration tests for piemenus.js with the real vendored Raphael and wheelnav,
// so they exercise the hover redraw that moves a selected item's nodes, not a
// stand-in for it. They live apart from piemenus.test.js because that suite
// replaces window, document and wheelnav with mocks for every test.

const fs = require("fs");
const path = require("path");

let piemenuVoicesGrid;

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
    global._ = text => text;
    global.DEFAULTVOICE = "voice-one";
    global.DEFAULTVOLUME = 0.5;
    global.platformColor = { piemenuVoicesColors: ["#123456", "#654321"] };
    global.getDrumName = jest.fn().mockReturnValue(null);
    global.getVoiceSynthName = jest.fn(value => `synth-${value}`);
    global.getDrumSynthName = jest.fn(value => `drum-${value}`);
    global.Singer = { setSynthVolume: jest.fn() };
    ({ piemenuVoicesGrid } = require("../piemenus"));
});

afterEach(() => {
    document.body.replaceChildren();
    jest.useRealTimers();
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

    const makeVoiceBlock = () => {
        const turtle = { singer: { instrumentNames: [] } };
        return {
            blocks: { stageClick: false, activeBlock: {} },
            value: "voice-one",
            text: { text: "One" },
            container: { children: [], setChildIndex: jest.fn() },
            updateCache: jest.fn(),
            activity: {
                logo: {
                    synth: {
                        loadSynth: jest.fn(),
                        createDefaultSynth: jest.fn(),
                        trigger: jest.fn(),
                        start: jest.fn()
                    }
                },
                turtles: {
                    ithTurtle: jest.fn(() => turtle)
                }
            }
        };
    };

    const openVoiceGrid = block => {
        piemenuVoicesGrid(
            block,
            ["One", "Two"],
            ["voice-one", "voice-two"],
            [0, 1],
            ["voices", "other"],
            "voice-one"
        );
    };

    test("uses dark text for light instrument category colors", () => {
        const colors = global.platformColor.piemenuVoicesColors;
        global.platformColor.piemenuVoicesColors = ["#123456", "#60bfbc"];
        try {
            openVoiceGrid(makeVoiceBlock());

            const tiles = [...document.querySelectorAll("#voiceGrid button")];
            expect(tiles.find(tile => tile.textContent === "One").style.color).toBe(
                "rgb(255, 255, 255)"
            );
            expect(tiles.find(tile => tile.textContent === "Two").style.color).toBe("rgb(0, 0, 0)");
        } finally {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
            global.platformColor.piemenuVoicesColors = colors;
        }
    });

    describe("voice grid lifecycle", () => {
        test("selects and previews a tile without closing the grid", () => {
            jest.useFakeTimers();
            const block = makeVoiceBlock();
            openVoiceGrid(block);

            const tile = [...document.querySelectorAll("#voiceGrid button")].find(
                button => button.textContent === "Two"
            );
            tile.click();

            expect(block.value).toBe("voice-two");
            expect(block.text.text).toBe("Two");
            expect(tile.style.outline).toBe("3px solid #000");
            expect(document.getElementById("voiceGrid")).not.toBeNull();
            expect(block.activity.logo.synth.loadSynth).toHaveBeenCalledWith(0, "synth-voice-two");

            jest.advanceTimersByTime(499);
            expect(block.activity.logo.synth.trigger).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1);
            expect(block.activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                "G4",
                1 / 4,
                "voice-two",
                null,
                null,
                false
            );
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });

        test.each([
            [
                "Escape",
                () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
            ],
            ["close button", () => document.querySelector("#voiceGrid button").click()],
            [
                "outside click",
                () => document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
            ]
        ])("%s closes the grid and clears the active block", (dismiss, dismissGrid) => {
            const block = makeVoiceBlock();
            openVoiceGrid(block);

            dismissGrid();

            expect(document.getElementById("voiceGrid")).toBeNull();
            expect(block._piemenuExitTime).toEqual(expect.any(Number));
            expect(block.blocks.activeBlock).toBeNull();
        });

        test("opening click does not immediately dismiss the grid", () => {
            const block = makeVoiceBlock();
            const opener = document.createElement("button");
            opener.addEventListener("click", () => openVoiceGrid(block));
            document.body.appendChild(opener);

            opener.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(document.getElementById("voiceGrid")).not.toBeNull();
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });

        test("keys pressed inside the grid do not reach document shortcuts", () => {
            const spy = jest.fn();
            document.addEventListener("keydown", spy);
            openVoiceGrid(makeVoiceBlock());

            document
                .querySelector("#voiceGrid button")
                .dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

            expect(spy).not.toHaveBeenCalled();
            document.removeEventListener("keydown", spy);
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });

        test("Alt+S inside the grid still reaches the global stop shortcut", () => {
            const spy = jest.fn();
            document.addEventListener("keydown", spy);
            openVoiceGrid(makeVoiceBlock());

            document.querySelector("#voiceGrid button").dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "s",
                    code: "KeyD",
                    keyCode: 83,
                    altKey: true,
                    bubbles: true
                })
            );

            expect(spy).toHaveBeenCalled();
            document.removeEventListener("keydown", spy);
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });

        test("reopening closes the prior grid and cancels its pending preview", () => {
            jest.useFakeTimers();
            const previousBlock = makeVoiceBlock();
            openVoiceGrid(previousBlock);
            document.querySelectorAll("#voiceGrid button")[1].click();

            const nextBlock = makeVoiceBlock();
            openVoiceGrid(nextBlock);
            jest.advanceTimersByTime(500);

            expect(document.querySelectorAll("#voiceGrid")).toHaveLength(1);
            expect(previousBlock._piemenuExitTime).toEqual(expect.any(Number));
            expect(previousBlock.blocks.activeBlock).toBeNull();
            expect(previousBlock.activity.logo.synth.trigger).not.toHaveBeenCalled();
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });
    });
});
