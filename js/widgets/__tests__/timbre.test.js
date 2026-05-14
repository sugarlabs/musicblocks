/**
 * MusicBlocks v3.6.2
 *
 * @author Lakshay
 *
 * @copyright 2026 Lakshay
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

// --- Global Mocks (must be set before require) ---
const jsdomDocument = global.document;

global._ = msg => msg;
global.DEFAULTOSCILLATORTYPE = "sine";
global.DEFAULTFILTERTYPE = "lowpass";
global.OSCTYPES = ["sine", "triangle", "sawtooth", "square"];
global.FILTERTYPES = ["lowpass", "highpass", "bandpass"];
global.instrumentsFilters = [{}];
global.instrumentsEffects = [{}];
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorBackgroundHOVER: "#e0e0e0"
};
global.rationalToFraction = jest.fn(n => [n, 1]);
global.oneHundredToFraction = jest.fn(n => n / 100);
global.last = arr => arr[arr.length - 1];
global.Singer = { RhythmActions: { getNoteValue: jest.fn(() => 0.25) } };
global.delayExecution = jest.fn(ms => new Promise(r => setTimeout(r, ms)));
global.docById = jest.fn(() => ({
    style: {},
    innerHTML: "",
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    insertRow: jest.fn(() => ({
        insertCell: jest.fn(() => ({
            style: {},
            innerHTML: "",
            appendChild: jest.fn()
        }))
    }))
}));
global.docByName = jest.fn(() => []);
const ManagedTimer = require("../../utils/ManagedTimer.js");
global.ManagedTimer = ManagedTimer;

global.window = {
    innerWidth: 1200,
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: null }),
            getWidgetBody: jest.fn().mockReturnValue({
                appendChild: jest.fn(),
                append: jest.fn(),
                style: {},
                innerHTML: ""
            }),
            sendToCenter: jest.fn(),
            updateTitle: jest.fn(),
            onclose: null,
            onmaximize: null,
            destroy: jest.fn()
        })
    }
};

global.document = {
    createElement: jest.fn(() => ({
        style: {},
        innerHTML: "",
        appendChild: jest.fn(),
        append: jest.fn(),
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        insertRow: jest.fn(() => ({
            insertCell: jest.fn(() => ({
                style: {},
                innerHTML: "",
                appendChild: jest.fn()
            }))
        }))
    })),
    getElementById: jest.fn(() => ({
        style: {},
        innerHTML: ""
    }))
};

const TimbreWidget = require("../timbre.js");

describe("TimbreWidget", () => {
    let timbre;

    beforeEach(() => {
        global.instrumentsFilters = [{}];
        global.instrumentsEffects = [{}];
        timbre = new TimbreWidget();
    });

    afterEach(() => {
        if (timbre && typeof timbre._clearWidgetTimers === "function") {
            timbre._clearWidgetTimers();
        }
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        test("should initialize with empty notesToPlay", () => {
            expect(timbre.notesToPlay).toEqual([]);
        });

        test("should initialize with empty env", () => {
            expect(timbre.env).toEqual([]);
        });

        test("should initialize with empty ENVs", () => {
            expect(timbre.ENVs).toEqual([]);
        });

        test("should initialize synthVals with sine oscillator", () => {
            expect(timbre.synthVals.oscillator.type).toBe("sine6");
            expect(timbre.synthVals.oscillator.source).toBe(DEFAULTOSCILLATORTYPE);
        });

        test("should initialize synthVals with default envelope", () => {
            expect(timbre.synthVals.envelope.attack).toBe(0.01);
            expect(timbre.synthVals.envelope.decay).toBe(0.5);
            expect(timbre.synthVals.envelope.sustain).toBe(0.6);
            expect(timbre.synthVals.envelope.release).toBe(0.01);
        });

        test("should initialize adsrMap correctly", () => {
            expect(timbre.adsrMap).toEqual(["attack", "decay", "sustain", "release"]);
        });

        test("should initialize amSynthParamvals", () => {
            expect(timbre.amSynthParamvals.harmonicity).toBe(3);
        });

        test("should initialize fmSynthParamvals", () => {
            expect(timbre.fmSynthParamvals.modulationIndex).toBe(10);
        });

        test("should initialize noiseSynthParamvals", () => {
            expect(timbre.noiseSynthParamvals.noise.type).toBe("white");
        });

        test("should initialize duoSynthParamVals", () => {
            expect(timbre.duoSynthParamVals.vibratoAmount).toBe(0.5);
            expect(timbre.duoSynthParamVals.vibratoRate).toBe(5);
        });

        test("should initialize empty effect arrays", () => {
            expect(timbre.fil).toEqual([]);
            expect(timbre.filterParams).toEqual([]);
            expect(timbre.osc).toEqual([]);
            expect(timbre.oscParams).toEqual([]);
            expect(timbre.tremoloEffect).toEqual([]);
            expect(timbre.tremoloParams).toEqual([]);
            expect(timbre.vibratoEffect).toEqual([]);
            expect(timbre.vibratoParams).toEqual([]);
            expect(timbre.chorusEffect).toEqual([]);
            expect(timbre.chorusParams).toEqual([]);
            expect(timbre.phaserEffect).toEqual([]);
            expect(timbre.phaserParams).toEqual([]);
            expect(timbre.distortionEffect).toEqual([]);
            expect(timbre.distortionParams).toEqual([]);
        });

        test("should initialize empty synth arrays", () => {
            expect(timbre.AMSynthesizer).toEqual([]);
            expect(timbre.AMSynthParams).toEqual([]);
            expect(timbre.FMSynthesizer).toEqual([]);
            expect(timbre.FMSynthParams).toEqual([]);
            expect(timbre.NoiseSynthesizer).toEqual([]);
            expect(timbre.NoiseSynthParams).toEqual([]);
            expect(timbre.duoSynthesizer).toEqual([]);
            expect(timbre.duoSynthParams).toEqual([]);
        });

        test("should initialize all activeParams as inactive", () => {
            const expectedParams = [
                "synth",
                "amsynth",
                "fmsynth",
                "noisesynth",
                "duosynth",
                "envelope",
                "oscillator",
                "filter",
                "effects",
                "chorus",
                "vibrato",
                "phaser",
                "distortion",
                "tremolo"
            ];
            expect(timbre.activeParams).toEqual(expectedParams);
            for (const param of expectedParams) {
                expect(timbre.isActive[param]).toBe(false);
            }
        });

        test("should set default instrumentName", () => {
            expect(timbre.instrumentName).toBe("custom");
        });

        test("should set blockNo to null", () => {
            expect(timbre.blockNo).toBeNull();
        });

        test("should initialize instrumentsFilters for custom instrument", () => {
            expect(instrumentsFilters[0]["custom"]).toEqual([]);
        });

        test("should initialize instrumentsEffects for custom instrument", () => {
            expect(instrumentsEffects[0]["custom"]).toEqual([]);
        });

        test("should initialize _eventListeners as empty object", () => {
            expect(timbre._eventListeners).toEqual({});
        });
    });

    describe("timer lifecycle", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        test("should track and clear widget timeouts", () => {
            const callback = jest.fn();

            timbre._setWidgetTimeout(callback, 500);

            expect(timbre._timerManager.activeTimeoutCount).toBe(1);
            expect(timbre._clearWidgetTimers()).toBe(1);

            jest.advanceTimersByTime(500);

            expect(callback).not.toHaveBeenCalled();
            expect(timbre._timerManager.activeTimeoutCount).toBe(0);
        });

        test("_changeBlock should schedule delayed block replacement through widget timers", () => {
            timbre.AMSynthesizer = [4];
            jest.spyOn(timbre, "_blockReplace").mockImplementation();

            timbre._changeBlock(8, "FMSynth", null);

            expect(timbre._timerManager.activeTimeoutCount).toBe(1);

            jest.advanceTimersByTime(500);

            expect(timbre._blockReplace).toHaveBeenCalledWith(4, 8);
            expect(timbre._timerManager.activeTimeoutCount).toBe(0);
        });

        test("_clearWidgetTimers should cancel pending delayed block replacement", () => {
            timbre.AMSynthesizer = [4];
            jest.spyOn(timbre, "_blockReplace").mockImplementation();

            timbre._changeBlock(8, "FMSynth", null);
            timbre._clearWidgetTimers();
            jest.advanceTimersByTime(500);

            expect(timbre._blockReplace).not.toHaveBeenCalled();
            expect(timbre._timerManager.activeTimeoutCount).toBe(0);
        });
    });

    describe("synth parameters", () => {
        test("should allow updating synthVals envelope", () => {
            timbre.synthVals.envelope.attack = 0.1;
            timbre.synthVals.envelope.decay = 0.3;
            timbre.synthVals.envelope.sustain = 0.8;
            timbre.synthVals.envelope.release = 0.2;
            expect(timbre.synthVals.envelope.attack).toBe(0.1);
            expect(timbre.synthVals.envelope.decay).toBe(0.3);
            expect(timbre.synthVals.envelope.sustain).toBe(0.8);
            expect(timbre.synthVals.envelope.release).toBe(0.2);
        });

        test("should allow updating oscillator type", () => {
            timbre.synthVals.oscillator.type = "triangle6";
            expect(timbre.synthVals.oscillator.type).toBe("triangle6");
        });

        test("should allow updating amSynth harmonicity", () => {
            timbre.amSynthParamvals.harmonicity = 5;
            expect(timbre.amSynthParamvals.harmonicity).toBe(5);
        });

        test("should allow updating fmSynth modulationIndex", () => {
            timbre.fmSynthParamvals.modulationIndex = 20;
            expect(timbre.fmSynthParamvals.modulationIndex).toBe(20);
        });

        test("should allow updating noise type", () => {
            timbre.noiseSynthParamvals.noise.type = "pink";
            expect(timbre.noiseSynthParamvals.noise.type).toBe("pink");
        });

        test("should allow updating duoSynth params", () => {
            timbre.duoSynthParamVals.vibratoAmount = 0.8;
            timbre.duoSynthParamVals.vibratoRate = 10;
            expect(timbre.duoSynthParamVals.vibratoAmount).toBe(0.8);
            expect(timbre.duoSynthParamVals.vibratoRate).toBe(10);
        });
    });

    describe("active params management", () => {
        test("should toggle isActive for a parameter", () => {
            expect(timbre.isActive["synth"]).toBe(false);
            timbre.isActive["synth"] = true;
            expect(timbre.isActive["synth"]).toBe(true);
        });

        test("should allow activating multiple params", () => {
            timbre.isActive["envelope"] = true;
            timbre.isActive["filter"] = true;
            expect(timbre.isActive["envelope"]).toBe(true);
            expect(timbre.isActive["filter"]).toBe(true);
            expect(timbre.isActive["effects"]).toBe(false);
        });
    });

    describe("effect arrays", () => {
        test("should allow adding filter entries", () => {
            timbre.fil.push("lowpass");
            timbre.filterParams.push({ frequency: 400 });
            expect(timbre.fil).toHaveLength(1);
            expect(timbre.filterParams[0].frequency).toBe(400);
        });

        test("should allow adding oscillator entries", () => {
            timbre.osc.push("sine");
            timbre.oscParams.push({ partialCount: 6 });
            expect(timbre.osc).toHaveLength(1);
        });

        test("should allow adding effect entries", () => {
            timbre.tremoloEffect.push(true);
            timbre.tremoloParams.push({ frequency: 10, depth: 0.5 });
            timbre.vibratoEffect.push(true);
            timbre.vibratoParams.push({ frequency: 5, depth: 0.3 });
            expect(timbre.tremoloEffect).toHaveLength(1);
            expect(timbre.vibratoEffect).toHaveLength(1);
        });
    });

    describe("notes management", () => {
        test("should allow adding notes to play", () => {
            timbre.notesToPlay.push(["C4", 4]);
            timbre.notesToPlay.push(["D4", 4]);
            expect(timbre.notesToPlay).toHaveLength(2);
        });

        test("should allow clearing notesToPlay", () => {
            timbre.notesToPlay.push(["C4", 4]);
            timbre.notesToPlay = [];
            expect(timbre.notesToPlay).toHaveLength(0);
        });
    });

    describe("DuoSynth selector", () => {
        let mockDocument;
        let mockDocById;
        let mockDocByName;
        let mockDelayExecution;

        const createBlock = (name, connections, value) => ({
            name,
            connections,
            value,
            text: { text: value === undefined ? "" : value.toString() },
            updateCache: jest.fn(),
            isClampBlock: jest.fn(() => false)
        });

        const setupDuoSynthWidget = () => {
            const blocks = {
                blockList: [createBlock("settimbre", [null, null, null])],
                clampBlocksToCheck: [],
                findBottomBlock: jest.fn(() => null),
                adjustDocks: jest.fn(),
                adjustExpandableClampBlock: jest.fn(),
                sendStackToTrash: jest.fn(),
                loadNewBlocks: jest.fn(blockObjs => {
                    const blockOffset = blocks.blockList.length;

                    for (const blockObj of blockObjs) {
                        const blockName = Array.isArray(blockObj[1]) ? blockObj[1][0] : blockObj[1];
                        const value = Array.isArray(blockObj[1]) ? blockObj[1][1].value : undefined;
                        const connections = blockObj[4].map(connection =>
                            connection === null ? null : connection + blockOffset
                        );

                        blocks.blockList.push(createBlock(blockName, connections, value));
                    }
                })
            };

            timbre = new TimbreWidget();
            timbre.blockNo = 0;
            timbre._playNote = jest.fn();
            timbre.activity = {
                blocks,
                logo: {
                    synth: {
                        createSynth: jest.fn()
                    }
                },
                refreshCanvas: jest.fn(),
                saveLocally: jest.fn()
            };
            timbre.timbreTableDiv = jsdomDocument.createElement("div");
            jsdomDocument.body.appendChild(timbre.timbreTableDiv);
        };

        beforeEach(() => {
            mockDocument = global.document;
            mockDocById = global.docById;
            mockDocByName = global.docByName;
            mockDelayExecution = global.delayExecution;

            global.document = jsdomDocument;
            global.docById = id => jsdomDocument.getElementById(id);
            global.docByName = name => jsdomDocument.getElementsByName(name);
            global.delayExecution = jest.fn(() => new Promise(() => {}));
            jsdomDocument.body.textContent = "";

            setupDuoSynthWidget();
        });

        afterEach(() => {
            jsdomDocument.body.textContent = "";
            global.document = mockDocument;
            global.docById = mockDocById;
            global.docByName = mockDocByName;
            global.delayExecution = mockDelayExecution;
        });

        test("renders controls on the first DuoSynth click without waiting", () => {
            timbre._synth();

            const duoRadio = jsdomDocument.querySelector('input[value="DuoSynth"]');
            duoRadio.onclick({ target: duoRadio });

            expect(global.delayExecution).not.toHaveBeenCalled();
            expect(jsdomDocument.getElementById("wrapperS0")).not.toBeNull();
            expect(jsdomDocument.getElementById("wrapperS1")).not.toBeNull();
            expect(timbre.duoSynthesizer).toEqual([1]);
            expect(timbre.duoSynthParamVals.vibratoAmount).toBe(0.06);
            expect(timbre.activity.logo.synth.createSynth).toHaveBeenCalledWith(
                0,
                "custom",
                "duosynth",
                timbre.duoSynthParamVals
            );
        });

        test.each(["AMSynth", "FMSynth"])(
            "renders DuoSynth controls on the first click after %s",
            synthName => {
                timbre._synth();

                const firstRadio = jsdomDocument.querySelector(`input[value="${synthName}"]`);
                firstRadio.onclick({ target: firstRadio });
                expect(jsdomDocument.getElementById("wrapperS0")).not.toBeNull();

                const duoRadio = jsdomDocument.querySelector('input[value="DuoSynth"]');
                duoRadio.onclick({ target: duoRadio });

                expect(global.delayExecution).not.toHaveBeenCalled();
                expect(jsdomDocument.getElementById("chosen").textContent).toBe("DuoSynth");
                expect(jsdomDocument.getElementById("wrapperS0")).not.toBeNull();
                expect(jsdomDocument.getElementById("wrapperS1")).not.toBeNull();
                expect(timbre.duoSynthParamVals.vibratoRate).toBe(10);
                expect(timbre.duoSynthParamVals.vibratoAmount).toBe(0.06);
            }
        );

        test("reuses existing DuoSynth block values without double-normalizing amount", () => {
            timbre.duoSynthesizer.push(1);
            timbre.duoSynthParams.push(10);
            timbre.duoSynthParams.push(20);
            timbre._synth();

            const duoRadio = jsdomDocument.querySelector('input[value="DuoSynth"]');
            duoRadio.onclick({ target: duoRadio });

            expect(jsdomDocument.getElementById("myRangeS0").value).toBe("10");
            expect(jsdomDocument.getElementById("myRangeS1").value).toBe("20");
            expect(timbre.duoSynthParamVals.vibratoRate).toBe(10);
            expect(timbre.duoSynthParamVals.vibratoAmount).toBe(0.2);
        });

        test("updates the matching DuoSynth parameter from each slider", () => {
            timbre._synth();

            const duoRadio = jsdomDocument.querySelector('input[value="DuoSynth"]');
            duoRadio.onclick({ target: duoRadio });

            const changeEvent = new jsdomDocument.defaultView.Event("change", { bubbles: true });
            const rateSlider = jsdomDocument.getElementById("myRangeS0");
            rateSlider.value = "12";
            rateSlider.dispatchEvent(changeEvent);

            const amountSlider = jsdomDocument.getElementById("myRangeS1");
            amountSlider.value = "7";
            amountSlider.dispatchEvent(
                new jsdomDocument.defaultView.Event("change", { bubbles: true })
            );

            expect(timbre.duoSynthParamVals.vibratoRate).toBe(12);
            expect(timbre.duoSynthParamVals.vibratoAmount).toBe(0.07);
            expect(timbre.duoSynthParams).toEqual(["12", "7"]);
            expect(timbre.activity.blocks.blockList[2].value).toBe("12");
            expect(timbre.activity.blocks.blockList[3].value).toBe("7");
        });
    });
});
