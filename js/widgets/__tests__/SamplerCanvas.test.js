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

const SamplerCanvas = require("../SamplerCanvas.js");

const METHODS = ["_scale", "makeCanvas"];
const DEPS = {
    SAMPLEWIDTH: 800,
    SAMPLEHEIGHT: 400,
    EXPORTACCIDENTALNAMES: ["𝄫", "♭", "", "♯", "𝄪"],
    SOLFEGENAMES: ["do", "re", "mi", "fa", "sol", "la", "ti", "do"],
    SAMPLEOSCCOLORS: ["#3030FF", "#FF3050"]
};

const makeWidget = (deps = DEPS) => {
    const widget = {};
    SamplerCanvas.install.call(widget, deps);
    return widget;
};

describe("SamplerCanvas", () => {
    test("install adds exactly the methods moved out of SampleWidget", () => {
        expect(Object.keys(makeWidget()).sort()).toEqual([...METHODS].sort());
    });

    test("each widget gets its own methods", () => {
        const first = makeWidget();
        const second = makeWidget();
        for (const name of METHODS) {
            expect(typeof first[name]).toBe("function");
            expect(first[name]).not.toBe(second[name]);
        }
    });

    describe("_scale", () => {
        const scaledWidget = (maximized, deps) => {
            const widget = makeWidget(deps);
            const body = document.createElement("div");
            widget.widgetWindow = {
                isMaximized: () => maximized,
                getWidgetBody: () => body,
                getWidgetFrame: () => ({ getBoundingClientRect: () => ({ height: 600 }) })
            };
            body.getBoundingClientRect = () => ({ width: 1200 });
            widget.drawVisualIDs = [5];
            widget.makeCanvas = jest.fn();
            widget.reconnectSynthsToAnalyser = jest.fn();
            return widget;
        };

        beforeEach(() => {
            global.cancelAnimationFrame = jest.fn();
        });

        test("uses the injected sample size in a normal window", () => {
            const widget = scaledWidget(false, { ...DEPS, SAMPLEWIDTH: 640, SAMPLEHEIGHT: 320 });
            widget._scale();
            expect(widget.makeCanvas).toHaveBeenCalledWith(640, 320, 0, true);
            expect(widget.reconnectSynthsToAnalyser).toHaveBeenCalled();
        });

        test("fills the window when maximized", () => {
            const widget = scaledWidget(true);
            widget._scale();
            expect(widget.makeCanvas).toHaveBeenCalledWith(1200, 530, 0, true);
        });

        test("stops the old draw loop before starting a new one", () => {
            const widget = scaledWidget(false);
            widget._scale();
            expect(global.cancelAnimationFrame).toHaveBeenCalledWith(5);
            expect(widget.drawVisualIDs[0]).toBeNull();
        });
    });
});
