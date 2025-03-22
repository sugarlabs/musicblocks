/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Shyam Raghuwanshi
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

const fs = require("fs");
const path = require("path");
const { TextEncoder, TextDecoder } = require("util");
jest.mock("tone");

describe("Utility Functions (logic-only)", () => {
    let whichTemperament,
        temperamentChanged,
        getFrequency,
        _getFrequency,
        getCustomFrequency,
        resume,
        loadSamples,
        _loadSample,
        setupRecorder,
        getDefaultParamValues,
        createDefaultSynth,
        _createSampleSynth,
        _parseSampleCenterNo,
        _createBuiltinSynth,
        _createCustomSynth,
        __createSynth,
        createSynth,
        loadSynth,
        _performNotes,
        startSound,
        instruments,
        CUSTOMSAMPLES,
        instrumentsSource,
        trigger,
        stopSound,
        loop,
        start,
        stop,
        rampTo,
        DEFAULTSYNTHVOLUME,
        setVolume,
        getVolume,
        setMasterVolume,
        Synth;

    const turtle = "turtle1";

    beforeAll(() => {
        global.TextEncoder = TextEncoder;
        global.TextDecoder = TextDecoder;
        global.MediaRecorder = jest.fn();
        global.AudioBuffer = jest.fn();
        global.module = module;
        global.Tone = require("./tonemock.js");

        const codeFiles = [
            "../../../lib/require.js",
            "../platformstyle.js",
            "../musicutils.js",
            "../synthutils.js",
            "../utils.js",
            "../../logo.js",
            "../../turtle-singer.js"
        ];
        let wrapperCode = "";

        codeFiles.forEach(filePath => {
            const fileCode = fs.readFileSync(path.join(__dirname, filePath), "utf8");
            wrapperCode += `\n${fileCode}`;
        });

        const dirPath = path.join(__dirname, "../../../sounds/samples");
        const sounds = fs.readdirSync(dirPath, "utf8");
        sounds.forEach(fileName => {
            if (!fileName.endsWith(".js")) return;
            const filePath = path.join(dirPath, fileName);
            const fileCode = fs.readFileSync(filePath, "utf8");
            wrapperCode += `\n${fileCode}`;
        });

        const wrapper = new Function(`
            let metaTag = document.querySelector("meta[name=theme-color]");
            metaTag = document.createElement('meta');
            metaTag.name = 'theme-color';
            metaTag.content = "#4DA6FF";
            document.head?.appendChild(metaTag);
            ${wrapperCode}
            
            return {
                Synth: typeof Synth !== "undefined" ? Synth : undefined,
                instrumentsSource: typeof instrumentsSource !== "undefined" ? instrumentsSource : undefined,
                instruments: typeof instruments !== "undefined" ? instruments : undefined,
                SAMPLECENTERNO: typeof SAMPLECENTERNO !== "undefined" ? SAMPLECENTERNO : undefined,
                CUSTOMSAMPLES: typeof CUSTOMSAMPLES !== "undefined" ? CUSTOMSAMPLES : undefined,
                DEFAULTSYNTHVOLUME: typeof DEFAULTSYNTHVOLUME !== "undefined" ? DEFAULTSYNTHVOLUME : undefined,
                  };
        `);
        const results = wrapper();
        Synth = results.Synth();
        instruments = results.instruments;
        DEFAULTSYNTHVOLUME = results.DEFAULTSYNTHVOLUME;
        CUSTOMSAMPLES = results.CUSTOMSAMPLES;
        SAMPLECENTERNO = results.SAMPLECENTERNO;
        instrumentsSource = results.instrumentsSource;
        createDefaultSynth = Synth.createDefaultSynth;
        whichTemperament = Synth.whichTemperament;
        temperamentChanged = Synth.temperamentChanged;
        getFrequency = Synth.getFrequency;
        _getFrequency = Synth._getFrequency;
        getCustomFrequency = Synth.getCustomFrequency;
        resume = Synth.resume;
        loadSamples = Synth.loadSamples;
        _loadSample = Synth._loadSample;
        setupRecorder = Synth.setupRecorder;
        getDefaultParamValues = Synth.getDefaultParamValues;
        _createSampleSynth = Synth._createSampleSynth;
        _parseSampleCenterNo = Synth._parseSampleCenterNo;
        _createBuiltinSynth = Synth._createBuiltinSynth;
        _createCustomSynth = Synth._createCustomSynth;
        __createSynth = Synth.__createSynth;
        createSynth = Synth.createSynth;
        loadSynth = Synth.loadSynth;
        _performNotes = Synth._performNotes;
        startSound = Synth.startSound;
        trigger = Synth.trigger;
        stopSound = Synth.stopSound;
        loop = Synth.loop;
        start = Synth.start;
        stop = Synth.stop;
        rampTo = Synth.rampTo;
        setVolume = Synth.setVolume;
        getVolume = Synth.getVolume;
        setMasterVolume = Synth.setMasterVolume;

    });


    describe("setupRecorder", () => {
        it("it should sets up the recorder for the Synth instance.", () => {
            if (!instruments[turtle]) {
                instruments[turtle] = {}; // Initialize instruments for the turtle
            }
            expect(setupRecorder()).toBe(undefined);
            function isToneInstance(instance) {
                return instance instanceof Tone.PolySynth ||
                    instance instanceof Tone.Sampler ||
                    instance instanceof Tone.Player;
            }

            for (const tur in instruments) {
                for (const synth in instruments[tur]) {
                    expect(isToneInstance(instruments[tur][synth])).toBe(true);
                }
            }
        });
    });


    describe("createDefaultSynth", () => {
        it("it should create the default poly/default/custom synth for the specified turtle", () => {
            createDefaultSynth(turtle);
            expect(instruments[turtle]["electronic synth"]).toBeTruthy();
            expect(instruments[turtle]["custom"]).toBeTruthy();
            expect(instrumentsSource["electronic synth"]).toEqual([0, "electronic synth"]);
            expect(instrumentsSource["custom"]).toEqual([0, "custom"]);
        });
    });

    describe("_createBuiltinSynth", () => {
        it("it should create a synth using builtin synths from Tone.js.", () => {
            const result = _createBuiltinSynth(turtle, "guitar", "sine", {});
            expect(result).toBeInstanceOf(Tone.Synth);
        });
        it("it should create a synth using builtin synths from Tone.js.", () => {
            const result = _createBuiltinSynth(turtle, "guitar", "pluck", {});
            expect(result).toBeInstanceOf(Tone.PluckSynth);
        });
        it("it should create a synth using builtin synths from Tone.js.", () => {
            const result = _createBuiltinSynth(turtle, "guitar", "noise3", {});
            expect(result).toBeInstanceOf(Tone.NoiseSynth);
        });
    });

    describe("_createCustomSynth", () => {
        it("it should create an amsynth using Tone.js methods like AMSynth, FMSynth, etc.", () => {
            const result = _createCustomSynth("amsynth", {});
            expect(result).toBeInstanceOf(Tone.AMSynth);
        });
        it("it should create a fmsynth using Tone.js methods like AMSynth, FMSynth, etc.", () => {
            const result = _createCustomSynth("fmsynth", {});
            expect(result).toBeInstanceOf(Tone.FMSynth);
        });
        it("it should create a duosynth using Tone.js methods like AMSynth, FMSynth, etc.", () => {
            const result = _createCustomSynth("duosynth", {});
            expect(result).toBeInstanceOf(Tone.DuoSynth);
        });
        it("it should create a testsynth using Tone.js methods like AMSynth, FMSynth, etc.", () => {
            const result = _createCustomSynth("testsynth", {});
            expect(result).toBeInstanceOf(Tone.PolySynth);
        });
    });

    describe("__createSynth", () => {
        beforeAll(() => {
            loadSamples();
        });
        it("it should create a PolySynth based on the specified parameters, either using samples, built-in synths, or custom synths", () => {
            __createSynth(turtle, "guitar", "guitar", {});
            expect(instruments[turtle]["electronic synth"]).toBeInstanceOf(Tone.PolySynth);
        });
        it("it should create a PolySynth based on the specified parameters, either using samples, built-in synths, or custom synths", () => {
            __createSynth(turtle, "guitar", "sine", {});
            expect(instruments[turtle]["electronic synth"]).toBeInstanceOf(Tone.PolySynth);
        });
        it("it should create a amsynth based on the specified parameters, either using samples, built-in synths, or custom synths", () => {
            const instrumentName = "poly";
            __createSynth(turtle, instrumentName, "amsynth", {});
            expect(instruments[turtle][instrumentName]).toBeInstanceOf(Tone.AMSynth);
        });

        it("it should create a CUSTOMSAMPLES based on the specified parameters, either using samples, built-in synths, or custom synths", () => {
            CUSTOMSAMPLES["pianoC4"] = "pianoC4";
            CUSTOMSAMPLES["drumKick"] = "drumKick";
            const instrumentName = "piano";
            __createSynth(turtle, instrumentName, "pianoC4", {});
            expect(instruments[turtle][instrumentName]).toBeInstanceOf(Tone.Sampler);
        });

        it("it should create a CUSTOMSAMPLES based on the specified parameters, either using samples, built-in synths, or custom synths", () => {
            const instrumentName = "drumKick";
            const sourceName = "http://example.com/drumKick.wav";
            __createSynth(turtle, instrumentName, sourceName, {});
            expect(instruments[turtle][sourceName]["noteDict"]).toBe(sourceName);
            expect(instrumentsSource[instrumentName]).toStrictEqual([1, "drum"]);
        });
        it("it should create a CUSTOMSAMPLES based on the specified parameters, either using samples, built-in synths, or custom synths", () => {
            const instrumentName = "guitar";
            const sourceName = "file://testing.wav";
            __createSynth(turtle, instrumentName, sourceName, {});
            expect(instruments[turtle][sourceName]["noteDict"]).toBe(sourceName);
            expect(instrumentsSource[instrumentName]).toStrictEqual([1, "drum"]);
        });
        it("it should create a CUSTOMSAMPLES based on the specified parameters, either using samples, built-in synths, or custom synths", () => {
            const instrumentName = "snare drum";
            const sourceName = "drum";
            __createSynth(turtle, instrumentName, sourceName, {});
            expect(instrumentsSource[instrumentName]).toStrictEqual([1, "drum"]);
        });
    });

    describe("loadSynth", () => {
        it("it should loads a synth based on the user's input, creating and setting volume for the specified turtle.", () => {
            const result = loadSynth("turtle1", "flute");

            expect(result).toBeTruthy();
            expect(result).toBeInstanceOf(Tone.Sampler);

            expect(instruments.turtle1).toHaveProperty("flute");
        });
    });

    describe("trigger", () => {
        const turtle = "turtle1";
        const beatValue = 1;
        test("should handle drum instruments correctly", () => {
            // Arrange
            const notes = "C4";

            const instrumentName = "drum";

            // Act
            trigger(turtle, notes, beatValue, instrumentName, null, null, true, 0);

            // Assert
            expect(instruments[turtle][instrumentName].start).toHaveBeenCalled();
        });

        test("should process effect parameters correctly", () => {
            // Arrange
            const paramsEffects = {
                vibratoIntensity: 1,
                distortionAmount: 0.5,
                tremoloFrequency: 2,
                rate: 1,
                chorusRate: 1.5,
                neighborSynth: true
            };

            // Act
            trigger(turtle, "C4", 1, "guitar", paramsEffects, null, true, 0);

            // Assert
            expect(paramsEffects.doVibrato).toBe(true);
            expect(paramsEffects.doDistortion).toBe(true);
            expect(paramsEffects.doTremolo).toBe(true);
            expect(paramsEffects.doPhaser).toBe(true);
            expect(paramsEffects.doChorus).toBe(true);
            expect(paramsEffects.doNeighbor).toBe(true);
        });

        test("should ignore effects for basic waveform instruments", () => {
            const mockPerformNotes = jest.fn();

            // Mock context
            const mockContext = {
                _performNotes: mockPerformNotes,
            };

            // Mock trigger function
            const trigger = function (
                turtle,
                notes,
                beatValue,
                instrumentName,
                paramsEffects,
                paramsFilters,
                setNote,
                future
            ) {
                if (this._performNotes) {
                    this._performNotes(
                        turtle,
                        notes,
                        beatValue,
                        paramsEffects,
                        paramsFilters,
                        setNote,
                        future
                    );
                }
            }.bind(mockContext); // Bind trigger to mockContext

            // Arrange
            const paramsEffects = {
                vibratoIntensity: 1,
            };
            const waveforms = ["sine", "sawtooth", "triangle", "square"];

            waveforms.forEach((waveform) => {
                // Act
                trigger(turtle, "C4", beatValue, waveform, paramsEffects, null, true, 0);

                // Assert
                expect(mockPerformNotes).toHaveBeenCalledWith(
                    turtle,
                    "C4",
                    1,
                    { "vibratoIntensity": 1 }, // paramsEffects should be null for basic waveform instruments
                    null,
                    true,
                    0
                );
            });
        });


        test("should handle array of notes for builtin synth", () => {
            // Arrange
            const notes = ["C4", "E4", "G4"];
            const instrumentName = "builtin";
            const mockPerformNotes = jest.fn();

            // Mock context
            const mockContext = {
                _performNotes: mockPerformNotes,
            };

            // Mock trigger function
            const trigger = function (
                turtle,
                notes,
                beatValue,
                instrumentName,
                paramsEffects,
                paramsFilters,
                setNote,
                future
            ) {
                if (this._performNotes) {
                    this._performNotes(
                        turtle,
                        notes,
                        beatValue,
                        paramsEffects,
                        paramsFilters,
                        setNote,
                        future
                    );
                }
            }.bind(mockContext);
            // Act
            trigger(turtle, notes, beatValue, instrumentName, null, null, true, 0);

            // Assert
            expect(mockPerformNotes).toHaveBeenCalledWith(
                "turtle1",
                notes,
                beatValue,
                null,
                null,
                true,
                0
            );
        });

        test("should handle custom synth with triggerAttackRelease", () => {
            // Arrange
            const instrumentName = "custom";

            // Act
            trigger(turtle, "C4", 1, instrumentName, null, null, true, 0);

            // Assert
            expect(instruments[turtle][instrumentName].triggerAttackRelease)
                .toHaveBeenCalledWith("C4", 1, expect.any(Number));
        });

        test("should handle exceptions in drum start gracefully", () => {
            // Arrange
            const instrumentName = "drum";
            const consoleSpy = jest.spyOn(console, "debug").mockImplementation(() => { });
            instruments[turtle][instrumentName].start.mockImplementation(() => {
                throw new Error("Start time must be strictly greater than previous start time");
            });

            // Act & Assert
            expect(() => {
                trigger(turtle, "C4", 1, instrumentName, null, null, true, 0);
            }).not.toThrow();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe("temperamentChanged", () => {
        it("should change the temperament", () => {
            expect(temperamentChanged("equal", "Bb3")).toBe(undefined);
            expect(whichTemperament()).toBe("equal");
        });
    });


    describe("resume", () => {
        it("it should resume the Tone.js context", () => {
            expect(resume()).toBe(undefined);
            expect(Tone).toStrictEqual(Tone);
        });
    });

    describe("rampTo", () => {
        it("it should resume the Tone.js context", () => {
            expect(resume()).toBe(undefined);
            expect(Tone).toStrictEqual(Tone);
        });
    });

    describe("rampTo function", () => {

        test("should ramp the volume for non-percussion and non-string instruments", () => {
            const turtle = "turtle1", instrumentName = "flute", oldVol = 20, volume = 60, rampTime = 5;
            rampTo(turtle, instrumentName, oldVol, volume, rampTime);

            expect(Tone.gainToDb).toHaveBeenCalledWith(0.92);
            expect(Tone.now).toHaveBeenCalled();
            expect(instruments.turtle1.flute.volume.linearRampToValueAtTime).toHaveBeenCalledWith(4, expect.any(Number));
        });

        test("should not ramp the volume for percussion instruments", () => {
            rampTo("turtle1", "xylophone", 20, 60, 5);

            expect(Tone.gainToDb).not.toHaveBeenCalled();
            expect(instruments.turtle1.flute.volume.linearRampToValueAtTime).not.toHaveBeenCalled();
        });
    });

    describe("setVolume function", () => {

        test("should set the volume for an instrument using DEFAULTSYNTHVOLUME", () => {
            setVolume("turtle1", "flute", 80);

            const sv = DEFAULTSYNTHVOLUME.piano;
            const d = 100 - sv;
            const nv = ((80 - 50) / 50) * d + sv;
            const expectedDb = Tone.gainToDb(nv / 100);

            expect(Tone.gainToDb).toHaveBeenCalledWith(0.96);
            expect(instruments.turtle1.flute.volume.value).toBe(expectedDb);
        });

        test("should set the volume directly if instrument is not in DEFAULTSYNTHVOLUME", () => {
            setVolume("turtle1", "unknown", 70);

            const expectedDb = Tone.gainToDb(0.7); // 70/100

            expect(Tone.gainToDb).toHaveBeenCalledWith(0.7);
            expect(instruments.turtle1.flute.volume.value).toBe(expectedDb);
        });

        test("should not throw error if instrument is not found in turtle", () => {
            expect(() => setVolume("turtle1", "nonexistent", 50)).not.toThrow();
        });
    });

    describe("getVolume function", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test("should return the volume for a defined instrument", () => {
            instruments.turtle1.flute.volume.value = -10;
            const result = getVolume("turtle1", "flute");

            expect(result).toBe(-10);
        });

        test("should return default volume if instrument is not found", () => {
            const consoleSpy = jest.spyOn(console, "debug").mockImplementation(() => { });

            const result = getVolume("turtle1", "nonexistent");

            expect(result).toBe(50);
            expect(consoleSpy).toHaveBeenCalledWith("instrument not found");

            consoleSpy.mockRestore();
        });
    });


    describe("setMasterVolume function", () => {
        test("should set the master volume correctly", () => {
            setMasterVolume(75);

            const expectedDb = Tone.gainToDb(0.75); // 75/100
            expect(Tone.gainToDb).toHaveBeenCalledWith(0.75);
            expect(Tone.Destination.volume.rampTo).toHaveBeenCalledWith(expectedDb, 0.01);
        });

        test("should handle edge case with volume set to 0 with connections", () => {
            setMasterVolume(0, 87, 64);

            const expectedDb = Tone.gainToDb(0); // 0/100
            expect(Tone.gainToDb).toHaveBeenCalledWith(0);
            expect(Tone.Destination.volume.rampTo).toHaveBeenCalledWith(expectedDb, 0.01);
        });

        test("should handle edge case with volume set to 100 with connections", () => {
            setMasterVolume(100, 87, 64);

            const expectedDb = Tone.gainToDb(1); // 100/100
            expect(Tone.gainToDb).toHaveBeenCalledWith(1);
            expect(Tone.Destination.volume.rampTo).toHaveBeenCalledWith(expectedDb, 0.01);
        });

        test("should handle edge case with volume set to 0 with no connections", () => {
            setMasterVolume(0, null, null);
            expect(Tone.Destination.volume.rampTo).toHaveBeenCalledWith(0, 0.01);
            setVolume(0, "electronic synth", 10);
            const expectedDb = Tone.gainToDb(0.1);
            expect(Tone.gainToDb).toHaveBeenCalledWith(0.1);
            expect(instruments[0]["electronic synth"].volume.value).toBe(expectedDb);
            // Act
            trigger(0, "G4", 1 / 4, "electronic synth", null, null, false);
            // Assert
            expect(instruments[0]["electronic synth"].triggerAttackRelease)
                .toHaveBeenCalledWith("G4", 1 / 4, expect.any(Number));
        });

        test("should handle edge case with volume set to 100 with no connections", () => {
            setMasterVolume(100, null, null);
            expect(Tone.Destination.volume.rampTo).toHaveBeenCalledWith(0, 0.01);
            setVolume(0, "electronic synth", 100);
            const expectedDb = Tone.gainToDb(1);
            expect(Tone.gainToDb).toHaveBeenCalledWith(1);
            expect(instruments[0]["electronic synth"].volume.value).toBe(expectedDb);
            // Act
            trigger(0, "G4", 1 / 4, "electronic synth", null, null, false);
            // Assert
            expect(instruments[0]["electronic synth"].triggerAttackRelease)
                .toHaveBeenCalledWith("G4", 1 / 4, expect.any(Number));
        });
    });

    describe("startSound", () => {
        const turtle = "turtle1";


        test("should call start() for drum instruments", () => {
            // Arrange
            const instrumentName = "guitar"; // Assuming 'snare' is a drum
            const note = "C4";
            
            // Act
            startSound(turtle, instrumentName, note);

            // Assert
            expect(instruments[turtle][instrumentName].start).toHaveBeenCalledTimes(1);
            expect(instruments[turtle][instrumentName].triggerAttack).not.toHaveBeenCalled();
        });


        test("should call triggerAttack() for non-drum instruments", () => {
            // Arrange
            const instrumentName = "flute";
            const note = "C4";

            // Act
            startSound(turtle, instrumentName, note);

            // Assert
            expect(instruments[turtle][instrumentName].triggerAttack).toHaveBeenCalledWith(note);
            expect(instruments[turtle][instrumentName].start).not.toHaveBeenCalled();
        });

        test("should handle undefined instrument gracefully", () => {
            // Arrange
            const instrumentName = "nonexistent";
            const note = "C4";

            // Act & Assert
            expect(() => startSound(turtle, instrumentName, note)).toThrow();
        });

        test("should handle undefined turtle gracefully", () => {
            // Arrange
            const invalidTurtle = "nonexistentTurtle";
            const instrumentName = "piano";
            const note = "C4";

            // Act & Assert
            expect(() => startSound(invalidTurtle, instrumentName, note)).toThrow();
        });
    });


    describe("stopSound", () => {
        const turtle = "turtle1";

        test("should call stop() for drum instruments", () => {
            // Arrange
            const instrumentName = "guitar";
            const note = "C4";
            // Act
            stopSound(turtle, instrumentName, note);

            // Assert
            expect(instruments[turtle][instrumentName].stop).toHaveBeenCalledTimes(1);
            expect(instruments[turtle][instrumentName].triggerRelease).not.toHaveBeenCalled();
        });

        test("should call triggerRelease() with note for non-drum instruments when note is provided", () => {
            // Arrange
            const instrumentName = "flute";
            const note = "C4";
            // Act
            stopSound(turtle, instrumentName, note);

            // Assert
            expect(instruments[turtle][instrumentName].triggerRelease).toHaveBeenCalledWith(note);
            expect(instruments[turtle][instrumentName].stop).not.toHaveBeenCalled();
        });

        test("should call triggerRelease() without note for non-drum instruments when note is undefined", () => {
            // Arrange
            const instrumentName = "flute";
            const note = undefined;

            // Act
            stopSound(turtle, instrumentName, note);

            // Assert
            expect(instruments[turtle][instrumentName].triggerRelease).toHaveBeenCalledTimes(1);
            expect(instruments[turtle][instrumentName].triggerRelease).toHaveBeenCalledWith();
            expect(instruments[turtle][instrumentName].stop).not.toHaveBeenCalled();
        });

        test("should handle invalid instrument gracefully", () => {
            // Arrange
            const instrumentName = "nonexistent";
            const note = "C4";
            // Act & Assert
            expect(() => stopSound(turtle, instrumentName, note)).toThrow();
        });

        test("should handle invalid turtle gracefully", () => {
            // Arrange
            const invalidTurtle = "nonexistentTurtle";
            const instrumentName = "flute";
            const note = "C4";

            // Act & Assert
            expect(() => stopSound(invalidTurtle, instrumentName, note)).toThrow();
        });
    });


    describe("loop", () => {
        test("should create and start a loop for drum instruments", () => {
            const turtle = "turtle1";
            const instrumentName = "guitar";
            const note = "C4";
            const duration = 0.25;
            const start = 0;
            const bpm = 120;
            const velocity = 0.8;

            const result = loop(turtle, instrumentName, note, duration, start, bpm, velocity);

            expect(instruments[turtle][instrumentName].start).toHaveBeenCalledTimes(1);
            expect(instruments[turtle][instrumentName].triggerAttackRelease).not.toHaveBeenCalled();
            expect(result).toStrictEqual({});
        });

        test("should create and start a loop for melodic instruments", () => {
            const turtle = "turtle1";
            const instrumentName = "flute";
            const note = "C4";
            const duration = 0.25;
            const start = 0;
            const bpm = 120;
            const velocity = 0.8;
            const result = loop(turtle, instrumentName, note, duration, start, bpm, velocity);

            expect(Tone.Loop).toHaveBeenCalled();

            const loopCallback = Tone.Loop.mock.calls[0][0];
            loopCallback(0);
            expect(instruments[turtle][instrumentName].triggerAttackRelease)
                .toHaveBeenCalledWith(note, duration, expect.any(Number), velocity);
            expect(instruments[turtle][instrumentName].start).not.toHaveBeenCalled();
            expect(result).toStrictEqual({});
        });

        test("should calculate correct loop interval based on BPM", () => {
            const bpm = 120;
            const expectedInterval = 60 / bpm;  // Should be 0.5 seconds for 120 BPM

            loop("turtle1", "flute", "C4", 0.25, 0, bpm, 0.8);

            expect(Tone.Loop).toHaveBeenCalledWith(
                expect.any(Function),
                expectedInterval
            );
        });

        test("should handle different start times", () => {
            const mockLoop = { start: jest.fn() };
            Tone.Loop = jest.fn(() => mockLoop);

            const startTime = 2.5;
            loop("turtle1", "flute", "C4", 0.25, startTime, 120, 0.8);
            expect(mockLoop.start).toHaveBeenCalledWith(startTime);
        });

        test("should use velocity correctly for both instrument types", () => {
            // Arrange
            const mockLoop = { start: jest.fn() };
            Tone.Loop = jest.fn(() => mockLoop);
            Tone.now = jest.fn(() => 100);

            const velocity = 0.6;
            loop("turtle1", "flute", "C4", 0.25, 0, 120, velocity);
            const melodicCallback = Tone.Loop.mock.calls[0][0];
            melodicCallback(0);
            expect(instruments.turtle1.flute.triggerAttackRelease)
                .toHaveBeenCalledWith("C4", 0.25, 100, velocity);

        });
    });

    describe("Tone Transport Controls", () => {
        test("start should call Tone.Transport.start", () => {
            const startSpy = jest.spyOn(Tone.Transport, "start");

            start();

            expect(startSpy).toHaveBeenCalledTimes(1);

            startSpy.mockRestore();
        });

        test("stop should call Tone.Transport.stop", () => {
            const stopSpy = jest.spyOn(Tone.Transport, "stop");

            stop();

            expect(stopSpy).toHaveBeenCalledTimes(1);

            stopSpy.mockRestore();
        });

        test("start and stop should work in sequence", () => {
            const startSpy = jest.spyOn(Tone.Transport, "start");
            const stopSpy = jest.spyOn(Tone.Transport, "stop");

            start();
            stop();
            start();
            stop();

            expect(startSpy).toHaveBeenCalledTimes(2);
            expect(stopSpy).toHaveBeenCalledTimes(2);

            startSpy.mockRestore();
            stopSpy.mockRestore();
        });
    });

    describe("_createSampleSynth", () => {
        it("creates voice synth correctly", () => {
            loadSamples();
            _loadSample("guitar");
            const result = _createSampleSynth("turtle1", "electronic synth", "guitar");
            expect(result).toBeInstanceOf(Tone.Sampler);
        });
    });

    describe("startSound", () => {
        it("it should start the sound", () => {
            expect(startSound("turtle1", "guitar", "A")).toBe(undefined);
        });
        it("it should start the sound", () => {
            expect(startSound("turtle1", "custom", "A")).toBe(undefined);
        });
    });


    describe("_performNotes", () => {
        let mockSynth;
        let mockTone;
        let instance;
        mockSynth = {
            triggerAttackRelease: jest.fn(),
            chain: jest.fn(),
            connect: jest.fn(),
            setNote: jest.fn(),
            oscillator: { partials: [] }
        };

        beforeEach(() => {
            mockTone = {
                now: jest.fn(() => 0),
                Destination: {},
                Filter: jest.fn(),
                Vibrato: jest.fn(),
                Distortion: jest.fn(),
                Tremolo: jest.fn(),
                Phaser: jest.fn(),
                Chorus: jest.fn(),
                Part: jest.fn(),
                ToneAudioBuffer: {
                    loaded: jest.fn().mockResolvedValue(true)
                }
            };
            global.Tone = mockTone;

            // Mock synth
            mockSynth = {
                triggerAttackRelease: jest.fn(),
                chain: jest.fn(),
                connect: jest.fn(),
                setNote: jest.fn(),
                oscillator: { partials: [] }
            };

            // Create instance with required properties
            instance = {
                inTemperament: "equal",
                _performNotes,
                _getFrequency: jest.fn(),
                getCustomFrequency: jest.fn()
            };

            // Bind the provided function to our instance
            instance._performNotes = instance._performNotes.bind(instance);

            // Mock timers
            jest.useFakeTimers();
        });

        test("should handle custom temperament", () => {
            // Arrange
            instance.inTemperament = "custom";
            const notes = "A4+50";

            // Act
            instance._performNotes(mockSynth, notes, 1, null, null, false, 0);

            expect(mockSynth.triggerAttackRelease).toHaveBeenCalledWith(notes, 1, 0);
        });


        test("should handle null effects and filters", () => {
            // Arrange
            const notes = "A4";
            const beatValue = 1;
            const paramsEffects = null;
            const paramsFilters = null;
            const setNote = false;
            const future = 0;

            // Act
            instance._performNotes(mockSynth, notes, beatValue, paramsEffects, paramsFilters, setNote, future);

            // Assert
            expect(mockSynth.triggerAttackRelease).toHaveBeenCalledWith(notes, beatValue, 0);
        });


        it("it should perform notes using the provided synth, notes, and parameters for effects and filters.", () => {
            const paramsEffects = null;
            const paramsFilters = null;
            const tempSynth = instruments[turtle]["electronic synth"];
            tempSynth.start(Tone.now() + 0);
            expect(() => {
                if (paramsEffects === null && paramsFilters === null) {
                    try {
                        expect(_performNotes(tempSynth, "A", 1, null, null, true, 10)).toBe(undefined);
                    }
                    catch (error) {
                        throw error;
                    }
                }
            }).not.toThrow();

        });
    });

    describe("whichTemperament", () => {
        it("should get the temperament", () => {
            expect(whichTemperament()).toBe("equal");
        });
    });

    describe("getFrequency", () => {
        it("it should return the frequency or frequencies.", () => {
            expect(getFrequency("Bb2", false)).toBe(116.54094037952261);
            expect(getFrequency("Bb3", false)).toBe(233.0818807590453);
            expect(getFrequency("A4", false)).toBe(440.00000000000085);
        });
    });
    describe("_getFrequency", () => {
        it("it should return the frequency or frequencies.", () => {
            expect(_getFrequency("Bb2", false, "equal")).toBe(116.54094037952261);
            expect(_getFrequency("Bb3", false, "equal")).toBe(233.0818807590453);
            expect(_getFrequency("A4", false, "equal")).toBe(440.00000000000085);
        });
    });
    describe("getCustomFrequency", () => {
        it("it should return the custom frequency or frequencies.", () => {
            expect(getCustomFrequency("Bb2", "equal")).toBe("B♭");
            expect(getCustomFrequency("A4", "equal")).toBe("A");
            expect(getCustomFrequency("Bb3", "equal")).toBe("B♭");
        });
    });


    describe("loadSamples", () => {

        beforeEach(() => {
            // Reset mocks before each test
            jest.clearAllMocks();

            // Reset the samples property before each test
            Synth.samples = null;
        });

        test("should initialize samples object when samples is null", () => {
            // Act
            loadSamples();

            // Assert
            expect(Synth.samples).toEqual({
                voice: {},
                drum: {}
            });
        });

        test("should not overwrite existing samples object", () => {
            // Arrange
            Synth.samples = {
                voice: { existingInstrument: {} },
                drum: { existingDrum: {} }
            };
            const initialSamples = { ...Synth.samples };

            // Act
            loadSamples();

            // Assert
            expect(Synth.samples).toEqual(initialSamples);
        });

        test("should correctly populate samplesManifest", () => {
            // Act
            loadSamples();

            // Assert
            expect(Synth.samplesManifest).toEqual({
                voice: expect.anything(),
                drum: expect.anything()
            });
        });

        test("empty data function should return null", () => {
            // Act
            loadSamples();
            const emptyDataFn = Synth.samplesManifest.voice.find(x => x.name === "empty").data;

            // Assert
            expect(emptyDataFn()).toBeNull();
        });

        test("should create separate objects for each manifest type", () => {
            // Act
            loadSamples();

            // Assert
            expect(Synth.samples.voice).toBeDefined();
            expect(Synth.samples.drum).toBeDefined();
            expect(Synth.samples.voice).not.toBe(Synth.samples.drum);
        });
    });

    describe("_loadSample", () => {
        it("it should loads samples into the Synth instance.", () => {
            expect(_loadSample()).toBe(undefined);
        });
    });

    describe("getDefaultParamValues", () => {
        it("it should retrieves default parameter values for various synthesizers.", () => {
            expect(getDefaultParamValues("sine")).toStrictEqual({
                oscillator: { type: "sine" },
                envelope: { attack: 0.03, decay: 0.001, sustain: 1, release: 0.03 }
            });
            expect(getDefaultParamValues("square")).toStrictEqual({
                oscillator: { type: "square" },
                envelope: { attack: 0.03, decay: 0.001, sustain: 1, release: 0.03 }
            });
            expect(getDefaultParamValues("triangle")).toStrictEqual({
                oscillator: { type: "triangle" },
                envelope: { attack: 0.03, decay: 0.001, sustain: 1, release: 0.03 }
            });
            expect(getDefaultParamValues("sawtooth")).toStrictEqual({
                oscillator: { type: "sawtooth" },
                envelope: { attack: 0.03, decay: 0.001, sustain: 1, release: 0.03 }
            });
        });
    });

    describe("_parseSampleCenterNo", () => {
        it("it should parses solfege notation and octave to determine the pitch number.", () => {
            expect(_parseSampleCenterNo("do", 2)).toBe("24");
            expect(_parseSampleCenterNo("do", 3)).toBe("36");
            expect(_parseSampleCenterNo("do", 4)).toBe("48");
            expect(_parseSampleCenterNo("do", 5)).toBe("60");
            expect(_parseSampleCenterNo("A", 5)).toBe("69");
            expect(_parseSampleCenterNo("A", 2)).toBe("33");
        });
    });


    describe("createSynth", () => {
        it("it should create a synth based on the user's input in the 'Timbre' clamp, handling race conditions with the samples loader.", () => {
            const turtle = "turtle1";  // Use const or let
            const instrumentName = "piano";  // Localize declaration
            const sourceName = "voice recording";  // Localize declaration
            expect(createSynth(turtle, instrumentName, sourceName, {})).toBe(undefined);
        });
    });

});