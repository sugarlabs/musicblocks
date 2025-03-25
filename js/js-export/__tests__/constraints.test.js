/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
 *
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

global.JSInterface = { _methodArgConstraints: {} };
require("../constraints.js");

describe("JSInterface._methodArgConstraints", () => {
    const validateConstraints = (methodName, args) => {
        const constraints = JSInterface._methodArgConstraints[methodName];
        if (!constraints) {
            throw new Error(`Method ${methodName} not found in constraints`);
        }

        args.forEach((arg, index) => {
            const constraint = constraints[index];
            if (!constraint) {
                throw new Error(`Constraint for argument ${index} not found`);
            }

            if (typeof arg !== constraint.type) {
                throw new Error(`Argument ${index} is not of type ${constraint.type}`);
            }

            if (constraint.constraints) {
                if (constraint.constraints.min !== undefined && arg < constraint.constraints.min) {
                    throw new Error(`Argument ${index} is less than the minimum value ${constraint.constraints.min}`);
                }
                if (constraint.constraints.max !== undefined && arg > constraint.constraints.max) {
                    throw new Error(`Argument ${index} is greater than the maximum value ${constraint.constraints.max}`);
                }
                if (constraint.constraints.integer !== undefined && constraint.constraints.integer && !Number.isInteger(arg)) {
                    throw new Error(`Argument ${index} is not an integer`);
                }
                if (constraint.constraints.async !== undefined && constraint.constraints.async && typeof arg !== "function") {
                    throw new Error(`Argument ${index} is not an async function`);
                }
                if (constraint.constraints.type === "solfegeorletter" && typeof arg !== "string") {
                    throw new Error(`Argument ${index} is not a valid solfege or letter`);
                }
                if (constraint.constraints.type === "accidental" && typeof arg !== "string") {
                    throw new Error(`Argument ${index} is not a valid accidental`);
                }
                if (constraint.constraints.type === "synth" && typeof arg !== "string") {
                    throw new Error(`Argument ${index} is not a valid synth`);
                }
                if (constraint.constraints.type === "drum" && typeof arg !== "string") {
                    throw new Error(`Argument ${index} is not a valid drum`);
                }
                if (constraint.constraints.type === "noise" && typeof arg !== "string") {
                    throw new Error(`Argument ${index} is not a valid noise`);
                }
                if (constraint.constraints.type === "letterkey" && typeof arg !== "string") {
                    throw new Error(`Argument ${index} is not a valid letter key`);
                }
                if (constraint.constraints.type === "oneof" && !constraint.constraints.values.includes(arg)) {
                    throw new Error(`Argument ${index} is not one of the allowed values`);
                }
            }
        });
    };

    it("should validate setMeter arguments", () => {
        expect(() => validateConstraints("setMeter", [8, 500])).not.toThrow();
        expect(() => validateConstraints("setMeter", [0, 500])).toThrow();
        expect(() => validateConstraints("setMeter", [17, 500])).toThrow();
        expect(() => validateConstraints("setMeter", [8, -1])).toThrow();
    });

    it("should validate PICKUP arguments", () => {
        expect(() => validateConstraints("PICKUP", [500])).not.toThrow();
        expect(() => validateConstraints("PICKUP", [-1])).toThrow();
        expect(() => validateConstraints("PICKUP", [1001])).toThrow();
    });

    it("should validate setBPM arguments", () => {
        expect(() => validateConstraints("setBPM", [120, 5])).not.toThrow();
        expect(() => validateConstraints("setBPM", [39, 5])).toThrow();
        expect(() => validateConstraints("setBPM", [209, 5])).toThrow();
        expect(() => validateConstraints("setBPM", [120, -1])).toThrow();
    });

    it("should validate setMasterBPM arguments", () => {
        expect(() => validateConstraints("setMasterBPM", [120, 5])).not.toThrow();
        expect(() => validateConstraints("setMasterBPM", [39, 5])).toThrow();
        expect(() => validateConstraints("setMasterBPM", [209, 5])).toThrow();
        expect(() => validateConstraints("setMasterBPM", [120, -1])).toThrow();
    });

    it("should validate onEveryNoteDo arguments", () => {
        expect(() => validateConstraints("onEveryNoteDo", ["action"])).not.toThrow();
        expect(() => validateConstraints("onEveryNoteDo", [123])).toThrow();
    });

    it("should validate onEveryBeatDo arguments", () => {
        expect(() => validateConstraints("onEveryBeatDo", ["action"])).not.toThrow();
        expect(() => validateConstraints("onEveryBeatDo", [123])).toThrow();
    });

    it("should validate onStrongBeatDo arguments", () => {
        expect(() => validateConstraints("onStrongBeatDo", [8, "action"])).not.toThrow();
        expect(() => validateConstraints("onStrongBeatDo", [0, "action"])).toThrow();
        expect(() => validateConstraints("onStrongBeatDo", [17, "action"])).toThrow();
        expect(() => validateConstraints("onStrongBeatDo", [8, 123])).toThrow();
    });

    it("should validate onWeakBeatDo arguments", () => {
        expect(() => validateConstraints("onWeakBeatDo", ["action"])).not.toThrow();
        expect(() => validateConstraints("onWeakBeatDo", [123])).toThrow();
    });

    it("should validate getNotesPlayed arguments", () => {
        expect(() => validateConstraints("getNotesPlayed", [500])).not.toThrow();
        expect(() => validateConstraints("getNotesPlayed", [-1])).toThrow();
        expect(() => validateConstraints("getNotesPlayed", [1001])).toThrow();
    });

    it("should validate playPitch arguments", () => {
        expect(() => validateConstraints("playPitch", ["action", 4])).not.toThrow();
        expect(() => validateConstraints("playPitch", [123, 4])).toThrow();
        expect(() => validateConstraints("playPitch", ["action", 0])).toThrow();
    });

    it("should validate stepPitch arguments", () => {
        expect(() => validateConstraints("stepPitch", [3])).not.toThrow();
        expect(() => validateConstraints("stepPitch", [-8])).toThrow();
        expect(() => validateConstraints("stepPitch", [8])).toThrow();
    });

    it("should validate playNthModalPitch arguments", () => {
        expect(() => validateConstraints("playNthModalPitch", [3, 4])).not.toThrow();
        expect(() => validateConstraints("playNthModalPitch", [-8, 4])).toThrow();
        expect(() => validateConstraints("playNthModalPitch", [8, 4])).toThrow();
        expect(() => validateConstraints("playNthModalPitch", [3, 0])).toThrow();
    });

    it("should validate playPitchNumber arguments", () => {
        expect(() => validateConstraints("playPitchNumber", [5])).not.toThrow();
        expect(() => validateConstraints("playPitchNumber", [-4])).toThrow();
        expect(() => validateConstraints("playPitchNumber", [13])).toThrow();
    });

    it("should validate playHertz arguments", () => {
        expect(() => validateConstraints("playHertz", [440])).not.toThrow();
        expect(() => validateConstraints("playHertz", [19])).toThrow();
        expect(() => validateConstraints("playHertz", [20001])).toThrow();
    });

    it("should validate setRegister arguments", () => {
        expect(() => validateConstraints("setRegister", [2])).not.toThrow();
        expect(() => validateConstraints("setRegister", [-4])).toThrow();
        expect(() => validateConstraints("setRegister", [4])).toThrow();
    });

    it("should validate invert arguments", () => {
        expect(() => validateConstraints("invert", ["C", 4, "even"])).not.toThrow();
        expect(() => validateConstraints("invert", [123, 4, "even"])).toThrow();
        expect(() => validateConstraints("invert", ["C", 0, "even"])).toThrow();
        expect(() => validateConstraints("invert", ["C", 4, "invalid"])).toThrow();
    });

    it("should validate setPitchNumberOffset arguments", () => {
        expect(() => validateConstraints("setPitchNumberOffset", ["C", 4])).not.toThrow();
        expect(() => validateConstraints("setPitchNumberOffset", [123, 4])).toThrow();
        expect(() => validateConstraints("setPitchNumberOffset", ["C", 0])).toThrow();
    });

    it("should validate numToPitch arguments", () => {
        expect(() => validateConstraints("numToPitch", [50])).not.toThrow();
        expect(() => validateConstraints("numToPitch", [-1])).toThrow();
        expect(() => validateConstraints("numToPitch", [101])).toThrow();
    });

    it("should validate numToOctave arguments", () => {
        expect(() => validateConstraints("numToOctave", [50])).not.toThrow();
        expect(() => validateConstraints("numToOctave", [-1])).toThrow();
        expect(() => validateConstraints("numToOctave", [101])).toThrow();
    });

    it("should validate setKey arguments", () => {
        expect(() => validateConstraints("setKey", ["C", "major"])).not.toThrow();
        expect(() => validateConstraints("setKey", [123, "major"])).toThrow();
        expect(() => validateConstraints("setKey", ["C", "invalid"])).toThrow();
    });

    it("should validate MOVABLEDO arguments", () => {
        expect(() => validateConstraints("MOVABLEDO", [true])).not.toThrow();
        expect(() => validateConstraints("MOVABLEDO", [false])).not.toThrow();
        expect(() => validateConstraints("MOVABLEDO", [123])).toThrow();
    });

    it("should validate PANNING arguments", () => {
        expect(() => validateConstraints("PANNING", [50])).not.toThrow();
        expect(() => validateConstraints("PANNING", [-101])).toThrow();
        expect(() => validateConstraints("PANNING", [101])).toThrow();
    });

    it("should validate MASTERVOLUME arguments", () => {
        expect(() => validateConstraints("MASTERVOLUME", [50])).not.toThrow();
        expect(() => validateConstraints("MASTERVOLUME", [-1])).toThrow();
        expect(() => validateConstraints("MASTERVOLUME", [101])).toThrow();
    });

    it("should validate setSynthVolume arguments", () => {
        expect(() => validateConstraints("setSynthVolume", ["synth", 50])).not.toThrow();
        expect(() => validateConstraints("setSynthVolume", [123, 50])).toThrow();
        expect(() => validateConstraints("setSynthVolume", ["synth", -1])).toThrow();
    });

    it("should validate getSynthVolume arguments", () => {
        expect(() => validateConstraints("getSynthVolume", ["synth"])).not.toThrow();
        expect(() => validateConstraints("getSynthVolume", [123])).toThrow();
    });

    it("should validate playDrum arguments", () => {
        expect(() => validateConstraints("playDrum", ["drum"])).not.toThrow();
        expect(() => validateConstraints("playDrum", [123])).toThrow();
    });

    it("should validate playNoise arguments", () => {
        expect(() => validateConstraints("playNoise", ["noise"])).not.toThrow();
        expect(() => validateConstraints("playNoise", [123])).toThrow();
    });

    it("should validate goForward arguments", () => {
        expect(() => validateConstraints("goForward", [50000])).not.toThrow();
        expect(() => validateConstraints("goForward", [-100001])).toThrow();
        expect(() => validateConstraints("goForward", [100001])).toThrow();
    });

    it("should validate goBackward arguments", () => {
        expect(() => validateConstraints("goBackward", [50000])).not.toThrow();
        expect(() => validateConstraints("goBackward", [-100001])).toThrow();
        expect(() => validateConstraints("goBackward", [100001])).toThrow();
    });

    it("should validate turnRight arguments", () => {
        expect(() => validateConstraints("turnRight", [180])).not.toThrow();
        expect(() => validateConstraints("turnRight", [-361])).toThrow();
        expect(() => validateConstraints("turnRight", [361])).toThrow();
    });

    it("should validate turnLeft arguments", () => {
        expect(() => validateConstraints("turnLeft", [180])).not.toThrow();
        expect(() => validateConstraints("turnLeft", [-361])).toThrow();
        expect(() => validateConstraints("turnLeft", [361])).toThrow();
    });

    it("should validate setXY arguments", () => {
        expect(() => validateConstraints("setXY", [50000, 50000])).not.toThrow();
        expect(() => validateConstraints("setXY", [-100001, 50000])).toThrow();
        expect(() => validateConstraints("setXY", [100001, 50000])).toThrow();
    });

    it("should validate setHeading arguments", () => {
        expect(() => validateConstraints("setHeading", [180])).not.toThrow();
        expect(() => validateConstraints("setHeading", [-361])).toThrow();
        expect(() => validateConstraints("setHeading", [361])).toThrow();
    });

    it("should validate drawArc arguments", () => {
        expect(() => validateConstraints("drawArc", [180, 50000])).not.toThrow();
        expect(() => validateConstraints("drawArc", [-361, 50000])).toThrow();
        expect(() => validateConstraints("drawArc", [361, 50000])).toThrow();
        expect(() => validateConstraints("drawArc", [180, -1])).toThrow();
    });

    it("should validate drawBezier arguments", () => {
        expect(() => validateConstraints("drawBezier", [50000, 50000])).not.toThrow();
        expect(() => validateConstraints("drawBezier", [-100001, 50000])).toThrow();
        expect(() => validateConstraints("drawBezier", [100001, 50000])).toThrow();
    });

    it("should validate setBezierControlPoint1 arguments", () => {
        expect(() => validateConstraints("setBezierControlPoint1", [50000, 50000])).not.toThrow();
        expect(() => validateConstraints("setBezierControlPoint1", [-100001, 50000])).toThrow();
        expect(() => validateConstraints("setBezierControlPoint1", [100001, 50000])).toThrow();
    });

    it("should validate scrollXY arguments", () => {
        expect(() => validateConstraints("scrollXY", [50000, 50000])).not.toThrow();
        expect(() => validateConstraints("scrollXY", [-100001, 50000])).toThrow();
        expect(() => validateConstraints("scrollXY", [100001, 50000])).toThrow();
    });

    it("should validate setColor arguments", () => {
        expect(() => validateConstraints("setColor", [50])).not.toThrow();
        expect(() => validateConstraints("setColor", [-1])).toThrow();
        expect(() => validateConstraints("setColor", [101])).toThrow();
    });

    it("should validate setGrey arguments", () => {
        expect(() => validateConstraints("setGrey", [50])).not.toThrow();
        expect(() => validateConstraints("setGrey", [-1])).toThrow();
        expect(() => validateConstraints("setGrey", [101])).toThrow();
    });

    it("should validate setShade arguments", () => {
        expect(() => validateConstraints("setShade", [50])).not.toThrow();
        expect(() => validateConstraints("setShade", [-1])).toThrow();
        expect(() => validateConstraints("setShade", [101])).toThrow();
    });

    it("should validate setHue arguments", () => {
        expect(() => validateConstraints("setHue", [50])).not.toThrow();
        expect(() => validateConstraints("setHue", [-1])).toThrow();
        expect(() => validateConstraints("setHue", [101])).toThrow();
    });

    it("should validate setTranslucency arguments", () => {
        expect(() => validateConstraints("setTranslucency", [50])).not.toThrow();
        expect(() => validateConstraints("setTranslucency", [-1])).toThrow();
        expect(() => validateConstraints("setTranslucency", [101])).toThrow();
    });

    it("should validate setPensize arguments", () => {
        expect(() => validateConstraints("setPensize", [50])).not.toThrow();
        expect(() => validateConstraints("setPensize", [-1])).toThrow();
        expect(() => validateConstraints("setPensize", [101])).toThrow();
    });
});
