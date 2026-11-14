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

    test.each([
        ["audio/wav", true],
        ["audio/wave", true],
        ["audio/x-wav", true],
        ["audio/x-pn-wav", true],
        ["audio/mpeg", false]
    ])("handles a sample labelled %s", async (type, accepted) => {
        const originalFileReader = global.FileReader;
        global.FileReader = class {
            readAsDataURL(file) {
                this.result = `data:${file.type};base64,UklGRg==`;
                queueMicrotask(() => this.onload());
            }
        };
        try {
            const widget = makeWidget();
            widget.activity = { errorMsg: jest.fn() };
            widget._addSample = jest.fn();
            widget.handleFiles({ name: "sample.wav", type });
            await Promise.resolve();

            if (accepted) {
                expect(widget.sampleName).toBe("sample.wav");
                expect(widget._addSample).toHaveBeenCalledTimes(1);
                expect(widget.activity.errorMsg).not.toHaveBeenCalled();
            } else {
                expect(widget._addSample).not.toHaveBeenCalled();
                expect(widget.activity.errorMsg).toHaveBeenCalledWith(
                    "Upload failed: Sample is not a .wav file.",
                    undefined
                );
            }
        } finally {
            global.FileReader = originalFileReader;
        }
    });

    describe("upload ordering and read failures", () => {
        let originalFileReader;
        let readers;

        beforeEach(() => {
            originalFileReader = global.FileReader;
            readers = [];
            global.FileReader = class {
                constructor() {
                    readers.push(this);
                }

                readAsDataURL() {}
            };
        });

        afterEach(() => {
            global.FileReader = originalFileReader;
        });

        const makeUploadWidget = () => {
            const widget = makeWidget();
            widget.activity = { errorMsg: jest.fn() };
            widget._addSample = jest.fn();
            return widget;
        };

        test("ignores a slower earlier upload that finishes after a newer one", () => {
            const widget = makeUploadWidget();

            widget.handleFiles({ name: "old.wav", type: "audio/wav" });
            widget.handleFiles({ name: "new.wav", type: "audio/wav" });
            expect(readers).toHaveLength(2);

            // The newer selection finishes first.
            readers[1].result = "data:audio/wav;base64,TkVX";
            readers[1].onload();

            // The older read finishes last and must not overwrite it.
            readers[0].result = "data:audio/wav;base64,T0xE";
            readers[0].onload();

            expect(widget.sampleName).toBe("new.wav");
            expect(widget.sampleData).toBe("data:audio/wav;base64,TkVX");
            expect(widget._addSample).toHaveBeenCalledTimes(1);
        });

        test("reports a failed read without changing the current sample", () => {
            const widget = makeUploadWidget();
            widget.sampleName = "keep.wav";
            widget.sampleData = "data:audio/wav;base64,S0VFUA==";

            widget.handleFiles({ name: "broken.wav", type: "audio/wav" });
            readers[0].onerror();

            expect(widget.activity.errorMsg).toHaveBeenCalledWith(
                "Upload failed: Could not read the sample file.",
                undefined
            );
            expect(widget.sampleName).toBe("keep.wav");
            expect(widget._addSample).not.toHaveBeenCalled();
        });

        test("reports an aborted read", () => {
            const widget = makeUploadWidget();

            widget.handleFiles({ name: "cancelled.wav", type: "audio/wav" });
            readers[0].onabort();

            expect(widget.activity.errorMsg).toHaveBeenCalledWith(
                "Upload failed: Reading the sample file was aborted.",
                undefined
            );
            expect(widget._addSample).not.toHaveBeenCalled();
        });

        test("ignores errors from an upload superseded by a newer selection", () => {
            const widget = makeUploadWidget();

            widget.handleFiles({ name: "old.wav", type: "audio/wav" });
            widget.handleFiles({ name: "new.wav", type: "audio/wav" });

            readers[0].onerror();
            readers[0].onabort();

            expect(widget.activity.errorMsg).not.toHaveBeenCalled();
        });
    });
});
