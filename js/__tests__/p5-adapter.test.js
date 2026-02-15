/**
 * @license
 * MusicBlocks v3.4.1
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

let factory;
const mockP5 = { version: "1.0" };

beforeAll(() => {
    global.define = jest.fn((deps, fn) => {
        factory = fn;
    });
    require("../p5-adapter");
});

afterAll(() => {
    delete global.define;
});

describe("p5-adapter", () => {
    beforeEach(() => {
        delete window.p5;
        delete window.OriginalTone;
        delete window.Tone;
        delete window.OriginalAudioContext;
        delete window.AudioContext;
        delete window.OriginalWebkitAudioContext;
        delete window.webkitAudioContext;
        delete window.AudioNode;
        delete window.OriginalAudioNodeConnect;
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("define registers factory with p5.min dependency", () => {
        expect(typeof factory).toBe("function");
    });

    test("assigns p5 to window when window.p5 is absent", () => {
        factory(mockP5);
        expect(window.p5).toBe(mockP5);
    });

    test("does not overwrite existing window.p5", () => {
        const existing = { version: "0.9" };
        window.p5 = existing;
        factory(mockP5);
        expect(window.p5).toBe(existing);
    });

    test("saves window.Tone as OriginalTone when present", () => {
        const tone = { name: "Tone" };
        window.Tone = tone;
        factory(mockP5);
        expect(window.OriginalTone).toBe(tone);
    });

    test("warns when window.Tone is missing", () => {
        factory(mockP5);
        expect(console.warn).toHaveBeenCalledWith("p5-adapter: window.Tone not found!");
    });

    test("saves AudioContext when present", () => {
        const ac = jest.fn();
        window.AudioContext = ac;
        factory(mockP5);
        expect(window.OriginalAudioContext).toBe(ac);
    });

    test("saves webkitAudioContext when present", () => {
        const wac = jest.fn();
        window.webkitAudioContext = wac;
        factory(mockP5);
        expect(window.OriginalWebkitAudioContext).toBe(wac);
    });

    test("saves AudioNode.prototype.connect when present", () => {
        const connect = jest.fn();
        window.AudioNode = { prototype: { connect } };
        factory(mockP5);
        expect(window.OriginalAudioNodeConnect).toBe(connect);
    });

    test("skips AudioNode save when AudioNode is absent", () => {
        factory(mockP5);
        expect(window.OriginalAudioNodeConnect).toBeUndefined();
    });

    test("returns p5 from factory", () => {
        expect(factory(mockP5)).toBe(mockP5);
    });
});
