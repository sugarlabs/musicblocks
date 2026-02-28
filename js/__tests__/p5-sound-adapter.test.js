/**
 * @license
 * MusicBlocks v3.4.1
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

describe("p5-sound-adapter", () => {
    let adapterFunction;

    beforeEach(() => {
        jest.resetModules();

        global.define = jest.fn((deps, callback) => {
            adapterFunction = callback;
        });
        window.OriginalAudioContext = "mock-original-audio";
        window.AudioContext = "broken-audio";
        window.OriginalWebkitAudioContext = "mock-original-webkit";
        window.webkitAudioContext = "broken-webkit";
        window.OriginalTone = "mock-original-tone";
        window.Tone = "broken-tone";

        window.AudioNode = {
            prototype: {
                connect: jest.fn().mockReturnValue(undefined)
            }
        };

        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        delete global.define;
        delete window.OriginalAudioContext;
        delete window.AudioContext;
        delete window.OriginalWebkitAudioContext;
        delete window.webkitAudioContext;
        delete window.OriginalTone;
        delete window.Tone;
        delete window.AudioNode;

        jest.restoreAllMocks();
    });

    it("restores AudioContext, webkitAudioContext, and Tone", () => {
        require("../p5-sound-adapter");
        adapterFunction();
        expect(window.AudioContext).toBe("mock-original-audio");
        expect(window.webkitAudioContext).toBe("mock-original-webkit");
        expect(window.Tone).toBe("mock-original-tone");
    });

    it("patches AudioNode.prototype.connect to return destination if undefined", () => {
        require("../p5-sound-adapter");
        adapterFunction();

        const patchedConnect = window.AudioNode.prototype.connect;
        expect(patchedConnect.isP5AdapterPatched).toBe(true);

        const mockDestination = "destination-node";
        const result = patchedConnect(mockDestination);

        expect(result).toBe(mockDestination);
    });
    it("returns original result from connect if it is NOT undefined", () => {
        window.AudioNode.prototype.connect = jest.fn().mockReturnValue("valid-connection");

        require("../p5-sound-adapter");
        adapterFunction();

        const patchedConnect = window.AudioNode.prototype.connect;
        const result = patchedConnect("destination-node");

        expect(result).toBe("valid-connection");
    });

    it("warns if OriginalTone is missing", () => {
        window.OriginalTone = undefined;
        require("../p5-sound-adapter");
        adapterFunction();

        expect(console.warn).toHaveBeenCalledWith("p5-sound-adapter: No OriginalTone to restore!");
    });

    it("does not double-patch AudioNode.prototype.connect", () => {
        require("../p5-sound-adapter");

        adapterFunction();
        const patchedConnect = window.AudioNode.prototype.connect;

        adapterFunction();

        expect(window.AudioNode.prototype.connect).toBe(patchedConnect);
        expect(console.log).toHaveBeenCalledWith(
            "p5-sound-adapter: AudioNode.prototype.connect already patched"
        );
    });
});
