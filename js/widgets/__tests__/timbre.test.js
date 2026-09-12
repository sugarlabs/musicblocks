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

    describe("timer fallback without ManagedTimer", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            timbre._timerManager = null;
        });

        test("_setWidgetTimeout tracks the timeout and runs the callback, then stops tracking it", () => {
            const callback = jest.fn();

            const id = timbre._setWidgetTimeout(callback, 500);
            expect(timbre._activeTimeouts.has(id)).toBe(true);

            jest.advanceTimersByTime(500);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(timbre._activeTimeouts.has(id)).toBe(false);
        });

        test("_clearWidgetTimeout returns false for null or undefined ids", () => {
            expect(timbre._clearWidgetTimeout(null)).toBe(false);
            expect(timbre._clearWidgetTimeout(undefined)).toBe(false);
        });

        test("_clearWidgetTimeout cancels a tracked timeout before it fires", () => {
            const callback = jest.fn();
            const id = timbre._setWidgetTimeout(callback, 500);

            expect(timbre._clearWidgetTimeout(id)).toBe(true);
            expect(timbre._activeTimeouts.has(id)).toBe(false);

            jest.advanceTimersByTime(500);
            expect(callback).not.toHaveBeenCalled();
        });

        test("_clearWidgetTimeout returns false for an untracked id", () => {
            expect(timbre._clearWidgetTimeout(999999)).toBe(false);
        });

        test("_clearWidgetTimers cancels tracked timeouts, resets the preview id, and returns the count", () => {
            timbre._setWidgetTimeout(jest.fn(), 500);
            timbre._setWidgetTimeout(jest.fn(), 700);
            timbre._previewTimerId = 123;

            const count = timbre._clearWidgetTimers();

            expect(count).toBe(2);
            expect(timbre._activeTimeouts.size).toBe(0);
            expect(timbre._previewTimerId).toBeNull();
        });
    });

    describe("timer delegation to ManagedTimer", () => {
        test("_setWidgetTimeout delegates to the timer manager", () => {
            const callback = jest.fn();
            timbre._timerManager = {
                setTimeout: jest.fn().mockReturnValue(42),
                clearAll: jest.fn().mockReturnValue(0)
            };

            expect(timbre._setWidgetTimeout(callback, 500)).toBe(42);
            expect(timbre._timerManager.setTimeout).toHaveBeenCalledWith(callback, 500);
        });

        test("_clearWidgetTimeout returns true when the manager clears the timeout", () => {
            timbre._timerManager = {
                clearTimeout: jest.fn().mockReturnValue(true),
                clearAll: jest.fn().mockReturnValue(0)
            };

            expect(timbre._clearWidgetTimeout(5)).toBe(true);
            expect(timbre._timerManager.clearTimeout).toHaveBeenCalledWith(5);
        });
    });

    describe("_changeBlock synth-swap branches", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            timbre.AMSynthesizer = [];
            timbre.FMSynthesizer = [];
            timbre.duoSynthesizer = [];
        });

        test("replaces the most recent FM block when switching away from FMSynth", () => {
            timbre.FMSynthesizer = [9];
            jest.spyOn(timbre, "_blockReplace").mockImplementation();

            timbre._changeBlock(8, "AMSynth", null);
            jest.advanceTimersByTime(500);

            expect(timbre._blockReplace).toHaveBeenCalledWith(9, 8);
            expect(timbre.FMSynthesizer).toEqual([]);
        });

        test("replaces the most recent DuoSynth block when switching away from DuoSynth", () => {
            timbre.duoSynthesizer = [7];
            jest.spyOn(timbre, "_blockReplace").mockImplementation();

            timbre._changeBlock(8, "AMSynth", null);
            jest.advanceTimersByTime(500);

            expect(timbre._blockReplace).toHaveBeenCalledWith(7, 8);
            expect(timbre.duoSynthesizer).toEqual([]);
        });

        test("connects two children when choosing FMSynth with no existing synths", () => {
            jest.spyOn(timbre, "blockConnection").mockImplementation();

            timbre._changeBlock(8, "FMSynth", 99);
            jest.advanceTimersByTime(500);

            expect(timbre.blockConnection).toHaveBeenCalledWith(2, 99);
        });

        test("connects three children for any other synth with no existing synths", () => {
            jest.spyOn(timbre, "blockConnection").mockImplementation();

            timbre._changeBlock(8, "DuoSynth", 99);
            jest.advanceTimersByTime(500);

            expect(timbre.blockConnection).toHaveBeenCalledWith(3, 99);
        });
    });

    describe("_setDuoSynthParamVals", () => {
        test("stores the absolute vibrato rate and the amount as a fraction", () => {
            timbre._setDuoSynthParamVals(5, 50);

            expect(timbre.duoSynthParamVals.vibratoRate).toBe(5);
            expect(timbre.duoSynthParamVals.vibratoAmount).toBe(0.5);
        });

        test("normalizes negative inputs to their absolute values", () => {
            timbre._setDuoSynthParamVals(-5, -50);

            expect(timbre.duoSynthParamVals.vibratoRate).toBe(5);
            expect(timbre.duoSynthParamVals.vibratoAmount).toBe(0.5);
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

    describe("phaser defaults", () => {
        test("should keep UI, block, and cached defaults in sync for Phaser", async () => {
            const originalDocById = global.docById;
            const originalDocByName = global.docByName;
            const originalGetElementById = global.document.getElementById;
            const originalDelayExecution = global.delayExecution;
            const createNode = () => ({
                style: {},
                value: "",
                textContent: "",
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
            });

            const nodeById = {};
            const getNode = id => {
                if (!nodeById[id]) {
                    nodeById[id] = createNode();
                }
                return nodeById[id];
            };

            const effectsRadios = ["Tremolo", "Vibrato", "Chorus", "Phaser", "Distortion"].map(
                value => ({ value, onclick: null })
            );

            global.docById.mockImplementation(getNode);
            global.docByName.mockImplementation(name =>
                name === "effectsName" ? effectsRadios : []
            );
            global.document.getElementById = jest.fn(getNode);
            global.delayExecution.mockImplementation(() => Promise.resolve());

            timbre.activity = {
                blocks: {
                    blockList: [{ connections: [null, null, null] }],
                    loadNewBlocks: jest.fn()
                },
                logo: {
                    synth: {
                        createSynth: jest.fn()
                    }
                }
            };
            timbre.blockNo = 0;
            timbre.clampConnection = jest.fn();

            try {
                timbre._effects();
                await effectsRadios[3].onclick({ target: { value: "Phaser" } });

                expect(getNode("myRangeFx2").value).toBe(100);
                expect(getNode("myspanFx2").textContent).toBe("100");
                expect(timbre.phaserParams).toEqual([5, 3, 100]);
                expect(instrumentsEffects[0][timbre.instrumentName]["baseFrequency"]).toBe(100);

                const phaserBlock = timbre.activity.blocks.loadNewBlocks.mock.calls[0][0];
                expect(phaserBlock[3][1][1].value).toBe(100);
            } finally {
                global.docById = originalDocById;
                global.docByName = originalDocByName;
                global.document.getElementById = originalGetElementById;
                global.delayExecution = originalDelayExecution;
            }
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

        test("updates envelope parameter when wrapperEnv range changes", () => {
            timbre.isActive["envelope"] = true;
            jest.spyOn(timbre, "_update").mockImplementation();
            jest.spyOn(timbre, "_playNote").mockImplementation();
            jest.spyOn(timbre.activity.logo.synth, "createSynth").mockImplementation();

            timbre._envelope(false);

            const changeEvent = new jsdomDocument.defaultView.Event("change", { bubbles: true });
            const envSlider = jsdomDocument.getElementById("myRange0");
            envSlider.value = "50";

            envSlider.dispatchEvent(changeEvent);

            expect(timbre.synthVals.envelope.attack).toBe(0.5);
            expect(timbre._update).toHaveBeenCalled();
            expect(timbre.activity.logo.synth.createSynth).toHaveBeenCalled();
            expect(timbre._playNote).toHaveBeenCalledWith("G4", 1 / 8);
        });
    });

    describe("init / toolbar buttons", () => {
        let originalWidgetWindows;
        let mockWidgetWindow;
        let addButtonCalls;
        let mockActivity;

        const freshButton = () => ({ style: {}, onclick: null, id: "" });
        const getButton = icon => addButtonCalls.find(call => call.icon === icon).btn;

        beforeEach(() => {
            addButtonCalls = [];
            mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest.fn(icon => {
                    const btn = freshButton();
                    addButtonCalls.push({ icon, btn });
                    return btn;
                }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(),
                    style: {}
                }),
                sendToCenter: jest.fn(),
                destroy: jest.fn(),
                onclose: null
            };

            originalWidgetWindows = window.widgetWindows;
            window.widgetWindows = {
                windowFor: jest.fn().mockReturnValue(mockWidgetWindow)
            };

            mockActivity = {
                errorMsg: jest.fn(),
                textMsg: jest.fn(),
                hideMsgs: jest.fn()
            };

            jest.spyOn(timbre, "_play").mockImplementation();
            jest.spyOn(timbre, "_save").mockImplementation();
            jest.spyOn(timbre, "_synth").mockImplementation();
            jest.spyOn(timbre, "_effects").mockImplementation();
            jest.spyOn(timbre, "_addFilter").mockImplementation();
            jest.spyOn(timbre, "_undo").mockImplementation();
            jest.spyOn(timbre, "_clearWidgetTimers").mockImplementation(() => 0);
            jest.spyOn(timbre, "_cleanupEventListeners").mockImplementation();
        });

        afterEach(() => {
            window.widgetWindows = originalWidgetWindows;
        });

        test("creates the widget window and wires onclose cleanup", () => {
            timbre.init(mockActivity);

            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                timbre,
                "timbre",
                "timbre",
                true
            );
            expect(mockWidgetWindow.clear).toHaveBeenCalled();
            expect(mockWidgetWindow.show).toHaveBeenCalled();
            expect(timbre.activity).toBe(mockActivity);
            expect(timbre._playing).toBe(false);
            expect(timbre._delta).toBe(0);

            mockWidgetWindow.onclose();

            expect(timbre._playing).toBe(false);
            expect(timbre._clearWidgetTimers).toHaveBeenCalled();
            expect(timbre._cleanupEventListeners).toHaveBeenCalled();
            expect(mockActivity.hideMsgs).toHaveBeenCalled();
            expect(mockWidgetWindow.destroy).toHaveBeenCalled();
        });

        test("creates all toolbar buttons in order and finalizes the window", () => {
            timbre.init(mockActivity);

            expect(addButtonCalls.map(call => call.icon)).toEqual([
                "play-button.svg",
                "export-chunk.svg",
                "synth.svg",
                "oscillator.svg",
                "envelope.svg",
                "effects.svg",
                "filter.svg",
                "filter+.svg",
                "restore-button.svg"
            ]);
            expect(mockActivity.textMsg).toHaveBeenCalled();
            expect(mockWidgetWindow.sendToCenter).toHaveBeenCalled();
        });

        test("play button triggers _play", () => {
            timbre.init(mockActivity);
            getButton("play-button.svg").onclick();
            expect(timbre._play).toHaveBeenCalled();
        });

        test("save button triggers _save", () => {
            timbre.init(mockActivity);
            getButton("export-chunk.svg").onclick();
            expect(timbre._save).toHaveBeenCalled();
        });

        test("synth button activates the synth panel when no oscillator exists", () => {
            timbre.init(mockActivity);
            getButton("synth.svg").onclick();

            expect(timbre.isActive["synth"]).toBe(true);
            expect(timbre._synth).toHaveBeenCalled();
            expect(mockActivity.errorMsg).not.toHaveBeenCalled();
        });

        test("synth button reports an error when an oscillator already exists", () => {
            timbre.osc.push(1);
            timbre.init(mockActivity);
            getButton("synth.svg").onclick();

            expect(timbre._synth).not.toHaveBeenCalled();
            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Unable to use synth due to existing oscillator.",
                3000
            );
        });

        test("effects button activates the effects panel", () => {
            timbre.init(mockActivity);
            getButton("effects.svg").onclick();

            expect(timbre.isActive["effects"]).toBe(true);
            expect(timbre._effects).toHaveBeenCalled();
        });

        test("undo button triggers _undo", () => {
            timbre.init(mockActivity);
            getButton("restore-button.svg").onclick();
            expect(timbre._undo).toHaveBeenCalled();
        });

        test("add-filter button only triggers _addFilter when the filter panel is active", () => {
            timbre.init(mockActivity);
            const addFilterButton = getButton("filter+.svg");

            addFilterButton.onclick();
            expect(timbre._addFilter).not.toHaveBeenCalled();

            timbre.isActive["filter"] = true;
            addFilterButton.onclick();
            expect(timbre._addFilter).toHaveBeenCalled();
        });

        test("clampConnection, oscillator, envelope, and filter handlers do not throw when timbre block is disposed", async () => {
            mockActivity.blocks = {
                blockList: [],
                findBottomBlock: jest.fn(() => null)
            };
            timbre.init(mockActivity);

            const oscBtn = getButton("oscillator.svg");
            const envBtn = getButton("envelope.svg");
            const filBtn = getButton("filter.svg");

            if (oscBtn && oscBtn.onclick) await oscBtn.onclick();
            if (envBtn && envBtn.onclick) await envBtn.onclick();
            if (filBtn && filBtn.onclick) await filBtn.onclick();

            const res1 = await timbre.clampConnection(1, 0, null);
            const res2 = await timbre.clampConnectionVspace(1, 0, null);
            expect(res1).toBeUndefined();
            expect(res2).toBeUndefined();
        });
    });

    describe("Effects and Envelope Event Listeners (Coverage)", () => {
        let mockDocument;
        let mockDocById;
        let mockDocByName;

        const createBlock = (name, connections, value) => ({
            name,
            connections,
            value,
            text: { text: value === undefined ? "" : value.toString() },
            updateCache: jest.fn(),
            isClampBlock: jest.fn(() => false)
        });

        beforeEach(() => {
            mockDocument = global.document;
            mockDocById = global.docById;
            mockDocByName = global.docByName;

            global.document = jsdomDocument;
            global.docById = id => jsdomDocument.getElementById(id);
            global.docByName = name => jsdomDocument.getElementsByName(name);
            jsdomDocument.body.textContent = "";

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

            timbre.activity = {
                blocks,
                logo: { synth: { createSynth: jest.fn() } },
                refreshCanvas: jest.fn(),
                saveLocally: jest.fn()
            };
            timbre.timbreTableDiv = jsdomDocument.createElement("div");
            timbre.timbreTableDiv.id = "timbreTable";
            jsdomDocument.body.appendChild(timbre.timbreTableDiv);

            timbre.blockNo = 0;
            timbre._update = jest.fn();
            timbre._playNote = jest.fn();
            timbre.clampConnection = jest.fn();
            timbre.clampConnectionVspace = jest.fn();
            timbre.instrumentName = "custom";
            global.instrumentsEffects[0]["custom"] = {};

            jest.useFakeTimers();
        });

        afterEach(() => {
            jsdomDocument.body.textContent = "";
            global.document = mockDocument;
            global.docById = mockDocById;
            global.docByName = mockDocByName;
            jest.useRealTimers();
        });

        const triggerChange = (id, value) => {
            const el = jsdomDocument.getElementById(id);
            if (el) {
                el.value = value;
                el.dispatchEvent(new jsdomDocument.defaultView.Event("change", { bubbles: true }));
            }
        };

        const selectEffect = async name => {
            const r = jsdomDocument.querySelector('input[value="' + name + '"]');
            if (r) {
                r.checked = true;
                const promise = r.onclick({ target: r });
                jest.runAllTimers();
                await promise;
            }
        };

        test("should update Tremolo params", async () => {
            timbre._effects();
            await selectEffect("Tremolo");
            triggerChange("myRangeFx0", "45");
            expect(global.instrumentsEffects[0]["custom"]["tremoloFrequency"]).toBe(45);
            triggerChange("myRangeFx1", "55");
            expect(global.instrumentsEffects[0]["custom"]["tremoloDepth"]).toBe(0.55);
        });

        test("should not throw TypeError if instrumentsEffects gets reset during effect change", async () => {
            timbre._effects();
            await selectEffect("Tremolo");

            // Simulate Logo engine resetting global state
            global.instrumentsEffects[0]["custom"] = undefined;

            // This should not throw a TypeError and should recreate the object
            expect(() => {
                triggerChange("myRangeFx0", "45");
            }).not.toThrow();

            expect(global.instrumentsEffects[0]["custom"]).toBeDefined();
            expect(global.instrumentsEffects[0]["custom"]["tremoloFrequency"]).toBe(45);
        });

        test("should update Vibrato params", async () => {
            timbre._effects();
            await selectEffect("Vibrato");
            triggerChange("myRangeFx0", "30");
            expect(global.instrumentsEffects[0]["custom"]["vibratoIntensity"]).toBe(0.25);
        });

        test("should not throw TypeError if instrumentsEffects gets reset during Vibrato effect change", async () => {
            timbre._effects();
            await selectEffect("Vibrato");
            global.instrumentsEffects[0]["custom"] = undefined;
            expect(() => {
                triggerChange("myRangeFx0", "30");
            }).not.toThrow();
            expect(global.instrumentsEffects[0]["custom"]).toBeDefined();
            expect(global.instrumentsEffects[0]["custom"]["vibratoIntensity"]).toBe(0.25);
        });

        test("should update Chorus params", async () => {
            timbre._effects();
            await selectEffect("Chorus");
            triggerChange("myRangeFx0", "20");
            expect(global.instrumentsEffects[0]["custom"]["chorusRate"]).toBe(20);
            triggerChange("myRangeFx1", "10");
            expect(global.instrumentsEffects[0]["custom"]["delayTime"]).toBe(10);
            triggerChange("myRangeFx2", "50");
            expect(global.instrumentsEffects[0]["custom"]["chorusDepth"]).toBe(0.5);
        });

        test("should not throw TypeError if instrumentsEffects gets reset during Chorus effect change", async () => {
            timbre._effects();
            await selectEffect("Chorus");
            global.instrumentsEffects[0]["custom"] = undefined;
            expect(() => {
                triggerChange("myRangeFx0", "20");
            }).not.toThrow();
            expect(global.instrumentsEffects[0]["custom"]).toBeDefined();
            expect(global.instrumentsEffects[0]["custom"]["chorusRate"]).toBe(20);
        });

        test("should update Phaser params", async () => {
            timbre._effects();
            await selectEffect("Phaser");
            triggerChange("myRangeFx0", "12");
            expect(global.instrumentsEffects[0]["custom"]["rate"]).toBe(12);
            triggerChange("myRangeFx1", "3");
            expect(global.instrumentsEffects[0]["custom"]["octaves"]).toBe(3);
            triggerChange("myRangeFx2", "400");
            expect(global.instrumentsEffects[0]["custom"]["baseFrequency"]).toBe(400);
        });

        test("should not throw TypeError if instrumentsEffects gets reset during Phaser effect change", async () => {
            timbre._effects();
            await selectEffect("Phaser");
            global.instrumentsEffects[0]["custom"] = undefined;
            expect(() => {
                triggerChange("myRangeFx0", "12");
            }).not.toThrow();
            expect(global.instrumentsEffects[0]["custom"]).toBeDefined();
            expect(global.instrumentsEffects[0]["custom"]["rate"]).toBe(12);
        });

        test("should reuse existing Tremolo params", async () => {
            timbre.tremoloEffect.push(1);
            timbre.tremoloParams.push(15);
            timbre.tremoloParams.push(0.2);
            timbre._effects();
            await selectEffect("Tremolo");
            triggerChange("myRangeFx0", "16");
            expect(global.instrumentsEffects[0]["custom"]["tremoloFrequency"]).toBe(16);
        });

        test("should reuse existing Chorus params", async () => {
            timbre.chorusEffect.push(1);
            timbre.chorusParams.push(5);
            timbre.chorusParams.push(5);
            timbre.chorusParams.push(50);
            timbre._effects();
            await selectEffect("Chorus");
            triggerChange("myRangeFx1", "6");
            expect(global.instrumentsEffects[0]["custom"]["delayTime"]).toBe(6);
        });

        test("should reuse existing Phaser params", async () => {
            timbre.phaserEffect.push(1);
            timbre.phaserParams.push(10);
            timbre.phaserParams.push(2);
            timbre.phaserParams.push(200);
            timbre._effects();
            await selectEffect("Phaser");
            triggerChange("myRangeFx2", "250");
            expect(global.instrumentsEffects[0]["custom"]["baseFrequency"]).toBe(250);
        });

        test("should update Distortion params", async () => {
            timbre._effects();
            await selectEffect("Distortion");
            triggerChange("myRangeFx0", "75");
            expect(global.instrumentsEffects[0]["custom"]["distortionAmount"]).toBe(0.75);
        });

        test("should not throw TypeError if instrumentsEffects gets reset during Distortion effect change", async () => {
            timbre._effects();
            await selectEffect("Distortion");
            global.instrumentsEffects[0]["custom"] = undefined;
            expect(() => {
                triggerChange("myRangeFx0", "75");
            }).not.toThrow();
            expect(global.instrumentsEffects[0]["custom"]).toBeDefined();
            expect(global.instrumentsEffects[0]["custom"]["distortionAmount"]).toBe(0.75);
        });

        test("should update Envelope params", async () => {
            timbre._envelope();
            // envelope uses a different delay? actually _envelope has NO delay execution!
            triggerChange("myRange0", "15");
            expect(timbre.synthVals["envelope"]["attack"]).toBe(0.15);
            triggerChange("myRange3", "25");
            expect(timbre.synthVals["envelope"]["release"]).toBe(0.25);
        });
    });

    describe("Deep Unit Coverage for TimbreWidget", () => {
        let mockDocument;
        let mockDocById;
        let mockDocByName;
        let mockBlocks;
        let mockActivity;

        const createBlock = (name, connections = [null, null, null], value = undefined) => ({
            name,
            connections: [...connections],
            value,
            text: { text: value === undefined ? "" : value.toString() },
            updateCache: jest.fn(),
            isClampBlock: jest.fn(() => name === "clamp" || name === "settimbre")
        });

        beforeEach(() => {
            mockDocument = global.document;
            mockDocById = global.docById;
            mockDocByName = global.docByName;

            global.document = jsdomDocument;
            global.docById = id => jsdomDocument.getElementById(id);
            global.docByName = name => jsdomDocument.getElementsByName(name);
            global.Singer = {
                masterVolume: [0.8],
                defaultBPMFactor: 1,
                RhythmActions: { getNoteValue: jest.fn(() => 0.25) }
            };
            global.FILTERTYPES = [
                ["", "lowpass"],
                ["", "highpass"],
                ["bandpass", "bandpass"]
            ];
            global.OSCTYPES = [
                ["", "sine"],
                ["triangle", "triangle"],
                ["sawtooth", "sawtooth"],
                ["square", "square"]
            ];

            jsdomDocument.body.textContent = "";

            mockBlocks = {
                blockList: [
                    createBlock("settimbre", [null, null, 1]),
                    createBlock("number", [0], 10),
                    createBlock("text", [0], "custom")
                ],
                clampBlocksToCheck: [],
                findBottomBlock: jest.fn(id => id),
                adjustDocks: jest.fn(),
                adjustExpandableClampBlock: jest.fn(),
                sendStackToTrash: jest.fn(),
                loadNewBlocks: jest.fn(blockObjs => {
                    const blockOffset = mockBlocks.blockList.length;
                    for (const blockObj of blockObjs) {
                        const blockName = Array.isArray(blockObj[1]) ? blockObj[1][0] : blockObj[1];
                        const value = Array.isArray(blockObj[1]) ? blockObj[1][1].value : undefined;
                        const connections = blockObj[4].map(c =>
                            c === null ? null : c + blockOffset
                        );
                        mockBlocks.blockList.push(createBlock(blockName, connections, value));
                    }
                })
            };

            mockActivity = {
                blocks: mockBlocks,
                logo: {
                    synth: {
                        createSynth: jest.fn(),
                        setMasterVolume: jest.fn(),
                        trigger: jest.fn(),
                        stop: jest.fn()
                    },
                    resetSynth: jest.fn(),
                    parseArg: jest.fn(() => 0.0625)
                },
                refreshCanvas: jest.fn(),
                saveLocally: jest.fn(),
                errorMsg: jest.fn(),
                textMsg: jest.fn(),
                hideMsgs: jest.fn()
            };

            global.instrumentsFilters = [{ custom: [] }];
            global.instrumentsEffects = [{ custom: {} }];

            const mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest.fn((icon, size, label) => {
                    const btn = jsdomDocument.createElement("div");
                    btn.title = label;
                    btn.style = {};
                    jsdomDocument.body.appendChild(btn);
                    return btn;
                }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(),
                    appendChild: jest.fn(),
                    style: {}
                }),
                sendToCenter: jest.fn(),
                destroy: jest.fn()
            };

            const mockWidgetWindows = {
                windowFor: jest.fn().mockReturnValue(mockWidgetWindow)
            };

            window.widgetWindows = mockWidgetWindows;
            if (typeof global.window !== "undefined") {
                global.window.widgetWindows = mockWidgetWindows;
            }

            const buttonIds = [
                "synthButtonCell",
                "oscillatorButtonCell",
                "envelopeButtonCell",
                "effectsButtonCell",
                "filterButtonCell"
            ];
            for (const bId of buttonIds) {
                const btn = jsdomDocument.createElement("div");
                btn.id = bId;
                btn.style = {};
                jsdomDocument.body.appendChild(btn);
            }

            timbre = new TimbreWidget();
            timbre.activity = mockActivity;
            timbre.blockNo = 0;
            jsdomDocument.body.appendChild(timbre.timbreTableDiv);
        });

        afterEach(() => {
            if (timbre && typeof timbre._clearWidgetTimers === "function") {
                timbre._clearWidgetTimers();
            }
            jsdomDocument.body.textContent = "";
            global.document = mockDocument;
            global.docById = mockDocById;
            global.docByName = mockDocByName;
            jest.useRealTimers();
        });

        describe("_update method across all active modules", () => {
            test("updates envelope connections with numeric value", async () => {
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("envelope", [
                        null,
                        bOffset + 1,
                        bOffset + 2,
                        bOffset + 3,
                        bOffset + 4
                    ]),
                    createBlock("number", [bOffset], 1),
                    createBlock("number", [bOffset], 50),
                    createBlock("number", [bOffset], 60),
                    createBlock("number", [bOffset], 1)
                );
                timbre.env = [bOffset];
                timbre.isActive["envelope"] = true;

                await timbre._update(0, 0.45, 1);

                expect(mockBlocks.blockList[bOffset + 2].value).toBe(0.45);
                expect(mockBlocks.blockList[bOffset + 2].text.text).toBe("0.45");
                expect(mockBlocks.blockList[bOffset + 2].updateCache).toHaveBeenCalled();
                expect(mockActivity.refreshCanvas).toHaveBeenCalled();
                expect(mockActivity.saveLocally).toHaveBeenCalled();
            });

            test("updates filter connections with string and numeric values", async () => {
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("filter", [null, bOffset + 1, bOffset + 2, bOffset + 3]),
                    createBlock("filtertype", [bOffset], "lowpass"),
                    createBlock("number", [bOffset], -12),
                    createBlock("number", [bOffset], 392)
                );
                timbre.fil = [bOffset];
                timbre.isActive["filter"] = true;

                await timbre._update(0, "highpass", 0);
                expect(mockBlocks.blockList[bOffset + 1].value).toBe("highpass");

                await timbre._update(0, -24, 1);
                expect(mockBlocks.blockList[bOffset + 2].value).toBe(-24);
            });

            test("updates oscillator connections", async () => {
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("oscillator", [null, bOffset + 1, bOffset + 2]),
                    createBlock("oscillatortype", [bOffset], "sine"),
                    createBlock("number", [bOffset], 6)
                );
                timbre.osc = [bOffset];
                timbre.isActive["oscillator"] = true;

                await timbre._update(0, "sawtooth", 0);
                expect(mockBlocks.blockList[bOffset + 1].value).toBe("sawtooth");

                await timbre._update(0, 8, 1);
                expect(mockBlocks.blockList[bOffset + 2].value).toBe(8);
            });

            test("updates amsynth, fmsynth, noisesynth, and duosynth", async () => {
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("amsynth", [null, bOffset + 1]),
                    createBlock("number", [bOffset], 3),
                    createBlock("fmsynth", [null, bOffset + 3]),
                    createBlock("number", [bOffset + 2], 10),
                    createBlock("noisesynth", [null, bOffset + 5]),
                    createBlock("text", [bOffset + 4], "white"),
                    createBlock("duosynth", [null, bOffset + 7, bOffset + 8]),
                    createBlock("number", [bOffset + 6], 10),
                    createBlock("number", [bOffset + 6], 6)
                );

                timbre.AMSynthesizer = [bOffset];
                timbre.isActive["amsynth"] = true;
                await timbre._update(0, 5, 0);
                expect(mockBlocks.blockList[bOffset + 1].value).toBe(5);

                timbre.isActive["amsynth"] = false;
                timbre.FMSynthesizer = [bOffset + 2];
                timbre.isActive["fmsynth"] = true;
                await timbre._update(0, 15, 0);
                expect(mockBlocks.blockList[bOffset + 3].value).toBe(15);

                timbre.isActive["fmsynth"] = false;
                timbre.NoiseSynthesizer = [bOffset + 4];
                timbre.isActive["noisesynth"] = true;
                await timbre._update(0, "pink", 0);
                expect(mockBlocks.blockList[bOffset + 5].value).toBe("pink");

                timbre.isActive["noisesynth"] = false;
                timbre.duoSynthesizer = [bOffset + 6];
                timbre.isActive["duosynth"] = true;
                await timbre._update(0, 8, 1);
                expect(mockBlocks.blockList[bOffset + 8].value).toBe(8);
            });

            test("updates tremolo, chorus, phaser, and distortion", async () => {
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("tremolo", [null, bOffset + 1, bOffset + 2]),
                    createBlock("number", [bOffset], 10),
                    createBlock("number", [bOffset], 50),
                    createBlock("chorus", [null, bOffset + 4, bOffset + 5, bOffset + 6]),
                    createBlock("number", [bOffset + 3], 2),
                    createBlock("number", [bOffset + 3], 4),
                    createBlock("number", [bOffset + 3], 70),
                    createBlock("phaser", [null, bOffset + 8, bOffset + 9, bOffset + 10]),
                    createBlock("number", [bOffset + 7], 5),
                    createBlock("number", [bOffset + 7], 3),
                    createBlock("number", [bOffset + 7], 100),
                    createBlock("dis", [null, bOffset + 12]),
                    createBlock("number", [bOffset + 11], 40)
                );

                timbre.tremoloEffect = [bOffset];
                timbre.isActive["tremolo"] = true;
                await timbre._update(0, 20, 0);
                expect(mockBlocks.blockList[bOffset + 1].value).toBe(20);

                timbre.isActive["tremolo"] = false;
                timbre.chorusEffect = [bOffset + 3];
                timbre.isActive["chorus"] = true;
                await timbre._update(0, 3, 0);
                expect(mockBlocks.blockList[bOffset + 4].value).toBe(3);

                timbre.isActive["chorus"] = false;
                timbre.phaserEffect = [bOffset + 7];
                timbre.isActive["phaser"] = true;
                await timbre._update(0, 300, 2);
                expect(mockBlocks.blockList[bOffset + 10].value).toBe(300);

                timbre.isActive["phaser"] = false;
                timbre.distortionEffect = [bOffset + 11];
                timbre.isActive["distortion"] = true;
                await timbre._update(0, 80, 0);
                expect(mockBlocks.blockList[bOffset + 12].value).toBe(80);
            });

            test("updates vibrato when divBlock is divide with number children", async () => {
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("vibrato", [null, bOffset + 1, bOffset + 2]),
                    createBlock("number", [bOffset], 5),
                    createBlock("divide", [bOffset, bOffset + 3, bOffset + 4]),
                    createBlock("number", [bOffset + 2], 1),
                    createBlock("number", [bOffset + 2], 16)
                );
                timbre.vibratoEffect = [bOffset];
                timbre.isActive["vibrato"] = true;

                await timbre._update(0, 10, 0);
                expect(mockBlocks.blockList[bOffset + 1].value).toBe(10);
            });

            test("updates vibrato when divBlock needs conversion via rationalToFraction", async () => {
                jest.useFakeTimers();
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("vibrato", [null, bOffset + 1, bOffset + 2]),
                    createBlock("number", [bOffset], 5),
                    createBlock("other", [bOffset])
                );
                timbre.vibratoEffect = [bOffset];
                timbre.isActive["vibrato"] = true;

                const promise = timbre._update(0, 8, 1);
                jest.runAllTimers();
                await promise;

                expect(mockBlocks.loadNewBlocks).toHaveBeenCalled();
            });
        });

        describe("_playNote and _play playback lifecycle", () => {
            test("_playNote triggers with all effect options when active", () => {
                global.instrumentsEffects[0]["custom"] = {
                    vibratoActive: true,
                    vibratoFrequency: 0.1,
                    vibratoIntensity: 0.08,
                    distortionActive: true,
                    distortionAmount: 0.6,
                    tremoloActive: true,
                    tremoloFrequency: 12,
                    tremoloDepth: 0.7,
                    phaserActive: true,
                    rate: 4,
                    octaves: 2,
                    baseFrequency: 450,
                    chorusActive: true,
                    chorusRate: 3,
                    delayTime: 5,
                    chorusDepth: 0.8
                };
                global.instrumentsFilters[0]["custom"] = [
                    { filterType: "lowpass", filterRolloff: -12, filterFrequency: 400 }
                ];

                timbre._playNote("C4", 0.5);

                expect(mockActivity.logo.synth.setMasterVolume).toHaveBeenCalledWith(0.8);
                expect(mockActivity.logo.synth.trigger).toHaveBeenCalledWith(
                    0,
                    "C4",
                    0.5,
                    "custom",
                    expect.objectContaining({
                        doVibrato: true,
                        vibratoFrequency: 0.1,
                        vibratoIntensity: 0.08,
                        doDistortion: true,
                        distortionAmount: 0.6,
                        doTremolo: true,
                        tremoloFrequency: 12,
                        tremoloDepth: 0.7,
                        doPhaser: true,
                        rate: 4,
                        octaves: 2,
                        baseFrequency: 450,
                        doChorus: true,
                        chorusRate: 3,
                        delayTime: 5,
                        chorusDepth: 0.8
                    }),
                    global.instrumentsFilters[0]["custom"]
                );
            });

            test("_playNote handles effect fallbacks when custom properties are omitted", () => {
                global.instrumentsEffects[0]["custom"] = {
                    vibratoActive: true,
                    distortionActive: true,
                    tremoloActive: true,
                    phaserActive: true,
                    chorusActive: true
                };
                timbre.vibratoParams = [8, 16];
                timbre.distortionParams = [70];
                timbre.tremoloParams = [15, 60];
                timbre.phaserParams = [6, 4, 500];
                timbre.chorusParams = [2.5, 4.5, 80];

                timbre._playNote("D4", 0.25);
                expect(mockActivity.logo.synth.trigger).toHaveBeenCalledWith(
                    0,
                    "D4",
                    0.25,
                    "custom",
                    expect.objectContaining({
                        doVibrato: true,
                        vibratoIntensity: 0.08,
                        doDistortion: true,
                        distortionAmount: 0.7,
                        doTremolo: true,
                        tremoloFrequency: 15,
                        tremoloDepth: 0.6,
                        doPhaser: true,
                        rate: 6,
                        octaves: 4,
                        baseFrequency: 500,
                        doChorus: true,
                        chorusRate: 2.5,
                        delayTime: 4.5,
                        chorusDepth: 80
                    }),
                    expect.any(Array)
                );
            });

            test("_playNote falls back when instrument is not in instrumentsFilters", () => {
                delete global.instrumentsFilters[0]["custom"];
                timbre._playNote("E4", 0.5);
                expect(mockActivity.logo.synth.trigger).toHaveBeenCalledWith(
                    0,
                    "E4",
                    0.5,
                    "custom",
                    null,
                    null
                );
            });

            test("_play starts playback, runs play loop, and completes when all notes finish", () => {
                jest.useFakeTimers();
                timbre.playButton = jsdomDocument.createElement("div");
                timbre.notesToPlay = [
                    ["C4", 0.25],
                    ["D4", 0.25]
                ];

                timbre._play();
                expect(timbre._playing).toBe(true);
                expect(mockActivity.logo.resetSynth).toHaveBeenCalledWith(0);

                // Run timers to advance to note 2
                jest.runOnlyPendingTimers();
                // Run timers to finish playback
                jest.runOnlyPendingTimers();

                expect(timbre._playing).toBe(false);
            });

            test("_play stops playback when clicked again during playing", () => {
                jest.useFakeTimers();
                timbre.playButton = jsdomDocument.createElement("div");
                timbre.notesToPlay = [
                    ["C4", 0.25],
                    ["D4", 0.25]
                ];

                timbre._play();
                expect(timbre._playing).toBe(true);

                // Click again to stop
                timbre._play();
                expect(timbre._playing).toBe(false);
                expect(mockActivity.logo.synth.setMasterVolume).toHaveBeenCalledWith(0);
                expect(mockActivity.logo.synth.stop).toHaveBeenCalled();
            });
        });

        describe("_save and _undo methods", () => {
            test("_save loads new settimbre blocks and increments delta", () => {
                timbre._delta = 0;
                timbre._save();
                expect(mockBlocks.loadNewBlocks).toHaveBeenCalled();
                expect(timbre._delta).toBe(42);
            });

            test("_undo for envelope", () => {
                timbre._update = jest.fn();
                timbre.ENVs = [1, 50, 60, 1];
                timbre._envelope(false);
                timbre.isActive["envelope"] = true;
                timbre._undo();
                expect(timbre.synthVals["envelope"]["attack"]).toBe(0.01);
                expect(mockActivity.logo.synth.createSynth).toHaveBeenCalled();
            });

            test("_undo for amsynth, fmsynth, noisesynth, and duosynth", async () => {
                timbre._update = jest.fn();
                timbre._synth();

                const amRadio = jsdomDocument.querySelector('input[value="AMSynth"]');
                await amRadio.onclick({ target: amRadio });
                timbre.isActive["amsynth"] = true;
                timbre.AMSynthParams = ["4"];
                timbre._undo();
                expect(timbre.amSynthParamvals["harmonicity"]).toBe(4);
                expect(mockActivity.logo.synth.createSynth).toHaveBeenCalledWith(
                    0,
                    "custom",
                    "amsynth",
                    expect.any(Object)
                );

                const fmRadio = jsdomDocument.querySelector('input[value="FMSynth"]');
                await fmRadio.onclick({ target: fmRadio });
                timbre.isActive["fmsynth"] = true;
                timbre.FMSynthParams = ["12"];
                timbre._undo();
                expect(timbre.fmSynthParamvals["modulationIndex"]).toBe(12);

                const duoRadio = jsdomDocument.querySelector('input[value="DuoSynth"]');
                await duoRadio.onclick({ target: duoRadio });
                timbre.isActive["duosynth"] = true;
                timbre.duoSynthParams = ["8", "15"];
                timbre._undo();
                expect(timbre.duoSynthParamVals["vibratoRate"]).toBe(8);
            });

            test("_undo for oscillator", () => {
                timbre._update = jest.fn();
                timbre.oscParams = ["sine", 6];
                timbre._oscillator(false);
                timbre.isActive["oscillator"] = true;
                timbre.oscParams = ["triangle", 4];
                timbre._undo();
                expect(timbre.synthVals["oscillator"]["source"]).toBe("sine");
                expect(mockActivity.logo.synth.createSynth).toHaveBeenCalled();
            });

            test("_undo for filter", () => {
                timbre.fil = [1];
                timbre.filterParams = ["highpass", -24, 500];
                global.instrumentsFilters[0]["custom"] = [
                    { filterType: "highpass", filterRolloff: -24, filterFrequency: 500 }
                ];
                timbre._update = jest.fn();
                timbre._filter();
                timbre.isActive["filter"] = true;

                timbre._undo();
                expect(global.instrumentsFilters[0]["custom"][0]["filterType"]).toBe("highpass");
                expect(global.instrumentsFilters[0]["custom"][0]["filterRolloff"]).toBe(-24);
                expect(global.instrumentsFilters[0]["custom"][0]["filterFrequency"]).toBe(500);
            });

            test("_undo for tremolo, vibrato, phaser, chorus, and distortion", async () => {
                timbre._update = jest.fn();
                timbre._effects();

                const tremoloRadio = jsdomDocument.querySelector('input[value="Tremolo"]');
                await tremoloRadio.onclick({ target: tremoloRadio });
                timbre.isActive["tremolo"] = true;
                timbre.tremoloParams = [12, 45];
                timbre._undo();

                const vibratoRadio = jsdomDocument.querySelector('input[value="Vibrato"]');
                await vibratoRadio.onclick({ target: vibratoRadio });
                timbre.isActive["vibrato"] = true;
                timbre.vibratoParams = [8, 20];
                timbre._undo();

                const phaserRadio = jsdomDocument.querySelector('input[value="Phaser"]');
                await phaserRadio.onclick({ target: phaserRadio });
                timbre.isActive["phaser"] = true;
                timbre.phaserParams = [6, 4, 300];
                timbre._undo();

                const chorusRadio = jsdomDocument.querySelector('input[value="Chorus"]');
                await chorusRadio.onclick({ target: chorusRadio });
                timbre.isActive["chorus"] = true;
                timbre.chorusParams = [3, 5, 60];
                timbre._undo();

                const distortionRadio = jsdomDocument.querySelector('input[value="Distortion"]');
                await distortionRadio.onclick({ target: distortionRadio });
                timbre.isActive["distortion"] = true;
                timbre.distortionParams = [80];
                timbre._undo();

                expect(mockActivity.logo.synth.trigger).toHaveBeenCalled();
            });
        });

        describe("Clamp, block connections, and replacement", () => {
            test("clampConnection and clampConnectionVspace connect blocks and adjust clamps", async () => {
                jest.useFakeTimers();
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("clampBlk", [null, null, null, null]),
                    createBlock("vspaceBlk", [null, null])
                );

                const promise1 = timbre.clampConnection(bOffset, 2, 1);
                jest.runAllTimers();
                await promise1;
                expect(mockBlocks.blockList[0].connections[2]).toBe(bOffset);
                expect(mockBlocks.blockList[1].connections[0]).toBe(bOffset);

                const promise2 = timbre.clampConnectionVspace(bOffset, bOffset + 1, 1);
                jest.runAllTimers();
                await promise2;
                expect(mockBlocks.blockList[bOffset + 1].connections[1]).toBe(1);
            });

            test("_blockReplace connects new block, adjusts docks, and trashes old block", () => {
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("oldBlk", [0, null]),
                    createBlock("newBlk", [null, null])
                );
                mockBlocks.blockList[0].connections[2] = bOffset;

                timbre._blockReplace(bOffset, bOffset + 1);

                expect(mockBlocks.blockList[bOffset + 1].connections[0]).toBe(0);
                expect(mockBlocks.sendStackToTrash).toHaveBeenCalledWith(
                    mockBlocks.blockList[bOffset]
                );
                expect(mockActivity.refreshCanvas).toHaveBeenCalled();
            });

            test("blockConnection connects to bottomOfClamp and handles nested hidden blocks", async () => {
                jest.useFakeTimers();
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("hidden", [0, null]),
                    createBlock("newnote", [0, null])
                );

                const promise = timbre.blockConnection(1, bOffset);
                jest.runAllTimers();
                await promise;

                expect(mockBlocks.adjustExpandableClampBlock).toHaveBeenCalled();
                expect(mockBlocks.adjustDocks).toHaveBeenCalled();
            });
        });

        describe("Synth Panel and Slider Interactions", () => {
            test("AMSynth selection and slider change", async () => {
                timbre._update = jest.fn();
                timbre._synth();
                const amRadio = jsdomDocument.querySelector('input[value="AMSynth"]');
                expect(amRadio).not.toBeNull();
                amRadio.checked = true;
                await amRadio.onclick({ target: amRadio });

                const slider = jsdomDocument.getElementById("myRangeS0");
                expect(slider).not.toBeNull();

                slider.value = "5";
                slider.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(timbre.amSynthParamvals["harmonicity"]).toBe(5);
            });

            test("FMSynth selection and slider change", async () => {
                timbre._update = jest.fn();
                timbre._synth();
                const fmRadio = jsdomDocument.querySelector('input[value="FMSynth"]');
                fmRadio.checked = true;
                await fmRadio.onclick({ target: fmRadio });

                const slider = jsdomDocument.getElementById("myRangeS0");
                slider.value = "20";
                slider.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(timbre.fmSynthParamvals["modulationIndex"]).toBe(20);
            });

            test("NoiseSynth selection and slider change", async () => {
                timbre._update = jest.fn();
                timbre._synth();
                const noiseRadio = jsdomDocument.createElement("input");
                noiseRadio.type = "radio";
                noiseRadio.name = "synthsName";
                noiseRadio.value = "NoiseSynth";
                jsdomDocument.body.appendChild(noiseRadio);

                timbre._synth();
                const synths = jsdomDocument.getElementsByName("synthsName");
                for (let i = 0; i < synths.length; i++) {
                    if (synths[i].value === "NoiseSynth") {
                        await synths[i].onclick({ target: synths[i] });
                    }
                }
            });

            test("DuoSynth selection and slider changes", async () => {
                timbre._update = jest.fn();
                timbre._synth();
                const duoRadio = jsdomDocument.querySelector('input[value="DuoSynth"]');
                duoRadio.checked = true;
                await duoRadio.onclick({ target: duoRadio });

                const slider0 = jsdomDocument.getElementById("myRangeS0");
                slider0.value = "12";
                slider0.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(timbre.duoSynthParams[0]).toBe("12");

                const slider1 = jsdomDocument.getElementById("myRangeS1");
                slider1.value = "8";
                slider1.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(timbre.duoSynthParams[1]).toBe("8");
            });
        });

        describe("Oscillator and Envelope UI Interactions", () => {
            test("Oscillator dropdown and partials slider changes", () => {
                timbre._update = jest.fn();
                timbre.oscParams = ["sine", 6];
                timbre._oscillator(true);

                const select = jsdomDocument.getElementById("selOsc1");
                select.value = "sawtooth";
                select.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(timbre.synthVals["oscillator"]["source"]).toBe("sawtooth");

                const slider = jsdomDocument.getElementById("myRangeO0");
                slider.value = "12";
                slider.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(timbre.oscParams[1]).toBe("12");
            });

            test("Envelope all 4 ADSR slider changes", () => {
                timbre._update = jest.fn();
                timbre.ENVs = [1, 50, 60, 1];
                timbre._envelope(true);

                for (let i = 0; i < 4; i++) {
                    const slider = jsdomDocument.getElementById("myRange" + i);
                    slider.value = (20 * (i + 1)).toString();
                    slider.dispatchEvent(
                        new jsdomDocument.defaultView.Event("change", { bubbles: true })
                    );
                }

                expect(timbre.synthVals["envelope"]["attack"]).toBe(0.2);
                expect(timbre.synthVals["envelope"]["decay"]).toBe(0.4);
                expect(timbre.synthVals["envelope"]["sustain"]).toBe(0.6);
                expect(timbre.synthVals["envelope"]["release"]).toBe(0.8);
            });
        });

        describe("Filter and Add Filter UI Interactions", () => {
            test("Filter panel creation and event delegation", () => {
                timbre.fil = [1];
                timbre.filterParams = ["lowpass", -12, 392];
                global.instrumentsFilters[0]["custom"] = [
                    { filterType: "lowpass", filterRolloff: -12, filterFrequency: 392 }
                ];
                timbre._update = jest.fn();

                timbre._filter();

                // Change filter select
                const select = jsdomDocument.getElementById("sel0");
                select.value = "bandpass";
                select.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsFilters[0]["custom"][0]["filterType"]).toBe("bandpass");

                // Click rolloff radio -24
                const radio1 = jsdomDocument.getElementById("radio1");
                radio1.value = "-24";
                radio1.dispatchEvent(
                    new jsdomDocument.defaultView.Event("click", { bubbles: true })
                );
                expect(global.instrumentsFilters[0]["custom"][0]["filterRolloff"]).toBe(-24);

                // Change frequency slider
                const slider = jsdomDocument.getElementById("myRangeF0");
                slider.value = "800";
                slider.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsFilters[0]["custom"][0]["filterFrequency"]).toBe(800);
            });

            test("_addFilter appends new filter and updates UI", async () => {
                jest.useFakeTimers();
                timbre.fil = [1];
                timbre.filterParams = ["lowpass", -12, 392];
                global.instrumentsFilters[0]["custom"] = [
                    { filterType: "lowpass", filterRolloff: -12, filterFrequency: 392 }
                ];
                timbre._update = jest.fn();
                timbre._filter();

                const promise = timbre._addFilter();
                jest.runAllTimers();
                await promise;

                expect(timbre.fil.length).toBe(2);
            });
        });

        describe("Effects Panel Sub-effect Interactions", () => {
            test("Tremolo effect creation and slider changes", async () => {
                timbre._update = jest.fn();
                timbre._effects();
                const tremoloRadio = jsdomDocument.querySelector('input[value="Tremolo"]');
                tremoloRadio.checked = true;
                await tremoloRadio.onclick({ target: tremoloRadio });

                const slider0 = jsdomDocument.getElementById("myRangeFx0");
                slider0.value = "18";
                slider0.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["tremoloFrequency"]).toBe(18);

                const slider1 = jsdomDocument.getElementById("myRangeFx1");
                slider1.value = "65";
                slider1.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["tremoloDepth"]).toBe(0.65);
            });

            test("Vibrato effect creation and slider changes", async () => {
                timbre._update = jest.fn();
                timbre._effects();
                const vibratoRadio = jsdomDocument.querySelector('input[value="Vibrato"]');
                vibratoRadio.checked = true;
                await vibratoRadio.onclick({ target: vibratoRadio });

                const slider0 = jsdomDocument.getElementById("myRangeFx0");
                slider0.value = "10";
                slider0.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["vibratoIntensity"]).toBe(0.1);

                const slider1 = jsdomDocument.getElementById("myRangeFx1");
                slider1.value = "8";
                slider1.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["vibratoFrequency"]).toBeDefined();
            });

            test("Chorus effect creation and slider changes", async () => {
                timbre._update = jest.fn();
                timbre._effects();
                const chorusRadio = jsdomDocument.querySelector('input[value="Chorus"]');
                chorusRadio.checked = true;
                await chorusRadio.onclick({ target: chorusRadio });

                const slider0 = jsdomDocument.getElementById("myRangeFx0");
                slider0.value = "4";
                slider0.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["chorusRate"]).toBe(4);

                const slider1 = jsdomDocument.getElementById("myRangeFx1");
                slider1.value = "8";
                slider1.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["delayTime"]).toBe(8);

                const slider2 = jsdomDocument.getElementById("myRangeFx2");
                slider2.value = "85";
                slider2.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["chorusDepth"]).toBe(0.85);
            });

            test("Phaser effect creation and slider changes", async () => {
                timbre._update = jest.fn();
                timbre._effects();
                const phaserRadio = jsdomDocument.querySelector('input[value="Phaser"]');
                phaserRadio.checked = true;
                await phaserRadio.onclick({ target: phaserRadio });

                const slider0 = jsdomDocument.getElementById("myRangeFx0");
                slider0.value = "8";
                slider0.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["rate"]).toBe(8);

                const slider1 = jsdomDocument.getElementById("myRangeFx1");
                slider1.value = "5";
                slider1.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["octaves"]).toBe(5);

                const slider2 = jsdomDocument.getElementById("myRangeFx2");
                slider2.value = "450";
                slider2.dispatchEvent(
                    new jsdomDocument.defaultView.Event("change", { bubbles: true })
                );
                expect(global.instrumentsEffects[0]["custom"]["baseFrequency"]).toBe(450);
            });
        });

        describe("Toolbar button click flows in full widget window", () => {
            test("Toolbar button clicks toggle active panels and trigger block connection flows", async () => {
                jest.useFakeTimers();
                timbre.init(mockActivity);

                // Click envelope button with env.length === 0
                const envBtn = jsdomDocument.getElementById("envelopeButtonCell");
                if (envBtn && envBtn.onclick) {
                    const promise = envBtn.onclick();
                    jest.runAllTimers();
                    await promise;
                    expect(timbre.isActive["envelope"]).toBe(true);
                }

                // Click oscillator button with osc.length === 0
                const oscBtn = jsdomDocument.getElementById("oscillatorButtonCell");
                if (oscBtn && oscBtn.onclick) {
                    const promise = oscBtn.onclick();
                    jest.runAllTimers();
                    await promise;
                    expect(timbre.isActive["oscillator"]).toBe(true);
                }

                // Click filter button with fil.length === 0
                const filBtn = jsdomDocument.getElementById("filterButtonCell");
                if (filBtn && filBtn.onclick) {
                    const promise = filBtn.onclick();
                    jest.runAllTimers();
                    await promise;
                    expect(timbre.isActive["filter"]).toBe(true);
                }

                // Click effects button
                const fxBtn = jsdomDocument.getElementById("effectsButtonCell");
                if (fxBtn && fxBtn.onclick) {
                    fxBtn.onclick();
                    expect(timbre.isActive["effects"]).toBe(true);
                }

                // Click undo button
                const undoBtn = jsdomDocument.querySelector("[title='Undo']");
                if (undoBtn && undoBtn.onclick) {
                    undoBtn.onclick();
                }
            });
        });

        describe("Edge Cases and Remaining Branches", () => {
            test("_undo for noisesynth", () => {
                timbre._update = jest.fn();
                timbre._synth();
                const r = jsdomDocument.createElement("input");
                r.id = "myRangeS0";
                r.value = "pink";
                const s = jsdomDocument.createElement("span");
                s.id = "myspanS0";
                jsdomDocument.body.appendChild(r);
                jsdomDocument.body.appendChild(s);

                timbre.isActive["noisesynth"] = true;
                timbre.NoiseSynthParams = ["pink"];
                timbre._undo();
                expect(timbre.noiseSynthParamvals["noise.type"]).toBe("pink");
            });

            test("_blockReplace traverses multiple clamp ancestors", () => {
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("clamp", [0, bOffset + 1]),
                    createBlock("middleClamp", [bOffset, bOffset + 2]),
                    createBlock("oldBlk", [bOffset + 1, null]),
                    createBlock("newBlk", [null, null])
                );
                mockBlocks.blockList[bOffset].isClampBlock = () => true;
                mockBlocks.blockList[bOffset + 1].isClampBlock = () => true;

                timbre.blockNo = 0;
                timbre._blockReplace(bOffset + 2, bOffset + 3);

                expect(mockBlocks.blockList[bOffset + 3].connections[0]).toBe(bOffset + 1);
                expect(mockBlocks.sendStackToTrash).toHaveBeenCalledWith(
                    mockBlocks.blockList[bOffset + 2]
                );
            });

            test("blockConnection traverses nested stack to bottom block", async () => {
                jest.useFakeTimers();
                const bOffset = mockBlocks.blockList.length;
                mockBlocks.blockList.push(
                    createBlock("hidden", [bOffset + 1, null]),
                    createBlock("clamp", [0, null, bOffset + 2]),
                    createBlock("childBlk", [bOffset + 1, null])
                );

                mockBlocks.findBottomBlock = jest.fn(() => bOffset + 2);

                const promise = timbre.blockConnection(1, bOffset);
                jest.runAllTimers();
                await promise;

                expect(mockBlocks.adjustExpandableClampBlock).toHaveBeenCalled();
            });

            test("_setRolloffRadioChecked covers -48 and -96", () => {
                for (let i = 0; i < 4; i++) {
                    const r = jsdomDocument.createElement("input");
                    r.type = "radio";
                    r.id = "radio" + i;
                    jsdomDocument.body.appendChild(r);
                }

                timbre._setRolloffRadioChecked([0, 1, 2, 3], -48);
                expect(jsdomDocument.getElementById("radio2").checked).toBe(true);

                timbre._setRolloffRadioChecked([0, 1, 2, 3], -96);
                expect(jsdomDocument.getElementById("radio3").checked).toBe(true);
            });

            test("_addFilter falls back to DEFAULTFILTERTYPE when all filter types are used", async () => {
                jest.useFakeTimers();
                timbre.fil = [1, 2, 3];
                timbre.filterParams = [
                    "lowpass",
                    -12,
                    392,
                    "highpass",
                    -24,
                    500,
                    "bandpass",
                    -48,
                    800
                ];
                global.instrumentsFilters[0]["custom"] = [
                    { filterType: "lowpass" },
                    { filterType: "highpass" },
                    { filterType: "bandpass" }
                ];
                timbre._update = jest.fn();
                timbre._filter();

                const promise = timbre._addFilter();
                jest.runAllTimers();
                await promise;

                expect(timbre.filterParams).toContain(DEFAULTFILTERTYPE);
            });

            test("Distortion and Vibrato effects reuse existing effect blocks", async () => {
                timbre._update = jest.fn();
                timbre.distortionEffect = [1];
                timbre.distortionParams = [60];
                timbre.vibratoEffect = [2];
                timbre.vibratoParams = [8, 25];

                timbre._effects();

                const disRadio = jsdomDocument.querySelector('input[value="Distortion"]');
                await disRadio.onclick({ target: disRadio });
                expect(jsdomDocument.getElementById("myRangeFx0").value).toBe("60");

                const vibRadio = jsdomDocument.querySelector('input[value="Vibrato"]');
                await vibRadio.onclick({ target: vibRadio });
                expect(jsdomDocument.getElementById("myRangeFx0").value).toBe("8");
            });

            test("_cleanupEventListeners unbinds listeners and resets eventListeners", () => {
                const dummyDiv = jsdomDocument.createElement("div");
                const removeSpy = jest.spyOn(dummyDiv, "removeEventListener");
                timbre._eventListeners = {
                    element: dummyDiv,
                    listeners: [{ type: "change", handler: jest.fn() }]
                };

                timbre._cleanupEventListeners();
                expect(removeSpy).toHaveBeenCalledWith("change", expect.any(Function));
                expect(timbre._eventListeners).toEqual({});
            });
        });
    });
});
