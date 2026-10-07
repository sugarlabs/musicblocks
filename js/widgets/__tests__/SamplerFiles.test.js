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

const SamplerFiles = require("../SamplerFiles.js");

const METHODS = [
    "getSampleLength",
    "displayRecordingStartMessage",
    "displayRecordingStopMessage",
    "showSampleTypeError",
    "handleFiles",
    "_dragOverHandler",
    "_dropHandler",
    "drag_and_drop",
    "_addSample"
];
const DEPS = undefined;

const makeWidget = (deps = DEPS) => {
    const widget = {};
    SamplerFiles.install.call(widget, deps);
    return widget;
};

describe("SamplerFiles", () => {
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

    beforeEach(() => {
        global._ = text => text;
    });

    test("getSampleLength warns only about samples over 1MB", () => {
        const widget = makeWidget();
        widget.activity = { errorMsg: jest.fn() };
        widget.timbreBlock = 7;

        widget.sampleData = "x".repeat(10);
        widget.getSampleLength();
        expect(widget.activity.errorMsg).not.toHaveBeenCalled();

        widget.sampleData = "x".repeat(1333334);
        widget.getSampleLength();
        expect(widget.activity.errorMsg).toHaveBeenCalledWith(
            "Warning: Sample is bigger than 1MB.",
            7
        );
    });

    test("showSampleTypeError reports a non-wav upload on the timbre block", () => {
        const widget = makeWidget();
        widget.activity = { errorMsg: jest.fn() };
        widget.timbreBlock = 3;
        widget.showSampleTypeError();
        expect(widget.activity.errorMsg).toHaveBeenCalledWith(
            "Upload failed: Sample is not a .wav file.",
            3
        );
    });
});
