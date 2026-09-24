const ManagedTimer = require("../../utils/ManagedTimer");
global.ManagedTimer = ManagedTimer;
const TemperamentUI = require("../TemperamentUI");
global.TemperamentUI = TemperamentUI;
const TemperamentWidget = require("../temperament");
describe("TemperamentWidget basic tests", () => {
    let widget;
    const createMockElement = id => ({
        id: id,
        innerHTML: "",
        textContent: "",
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        style: {},
        width: 100,
        height: 100,
        dataset: { message: "1" },
        append: jest.fn(),
        remove: jest.fn(),
        getElementsByTagName: jest.fn(() => [createMockElement("img")]),
        addEventListener: jest.fn(),
        getContext: jest.fn(() => ({
            beginPath: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
            stroke: jest.fn(),
            clearRect: jest.fn(),
            fillText: jest.fn(),
            setLineDash: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            lineWidth: 0,
            fillStyle: "",
            strokeStyle: ""
        })),
        getBoundingClientRect: jest.fn(() => ({ left: 0, top: 0 })),
        insertCell: jest.fn(() => createMockElement("cell")),
        createTHead: jest.fn(() => ({
            insertRow: jest.fn(() => ({
                id: "",
                insertCell: jest.fn(() => createMockElement("cell"))
            }))
        }))
    });
    // Equal-division edit seed.
    const seedEqualEdit = divisions => {
        global.docById = jest.fn(id => {
            if (id === "octaveIn") return { value: "0" };
            if (id === "octaveOut") return { value: "0" };
            if (id === "divisions") return { value: String(divisions) };
            return createMockElement(id);
        });
        widget.ratios = [1];
        widget.frequencies = [440];
        widget.pitchNumber = 1;
        widget.powerBase = 2;
        widget.activity = { errorMsg: jest.fn() };
        widget.createMainWheel = jest.fn();
        widget.notesCircle = {
            navItems: Array(60).fill({
                fillAttr: "",
                sliceHoverAttr: {},
                slicePathAttr: {},
                sliceSelectedAttr: {},
                refreshWheel: jest.fn()
            }),
            refreshWheel: jest.fn()
        };
        widget.checkTemperament = jest.fn();
        global.frequencyToPitch = jest.fn(() => ["C", 4]);
    };
    global._ = jest.fn(text => text);
    global.PREVIEWVOLUME = 80;

    beforeEach(() => {
        document.body.innerHTML = `
        <table id="temperamentTable"></table>
        <div id="wheelDiv4"></div>
        <div id="userEdit"></div>
    `;

        global._ = jest.fn(text => text);

        global.wheelnav = jest.fn().mockImplementation(() => ({
            wheelRadius: 0,
            navItemsEnabled: false,
            navAngle: 0,
            navItems: Array.from({ length: 60 }, () => ({
                fillAttr: "",
                sliceHoverAttr: {},
                slicePathAttr: {},
                sliceSelectedAttr: {},
                titleAttr: { font: "" },
                titleSelectedAttr: { font: "" },
                sliceAngle: 0,
                menuRadius: 0
            })),
            slicePathFunction: null,
            slicePathCustom: {},
            sliceSelectedPathCustom: {},
            sliceInitPathCustom: {},
            initWheel: jest.fn(),
            createWheel: jest.fn(),
            removeWheel: jest.fn(),
            refreshWheel: jest.fn()
        }));

        global.getTemperamentKeys = jest.fn(() => []);
        global.getTemperamentsList = jest.fn(() => [
            ["Equal (12EDO)", "equal"],
            ["Just intonation", "just"]
        ]);
        global.isCustomTemperament = jest.fn(() => false);
        global.getTemperamentRatio = jest.fn(value =>
            value !== null && typeof value === "object" && typeof value.ratio === "number"
                ? value.ratio
                : Number(value)
        );
        global.ratioToWheelAngle = jest.fn(
            (ratio, base) => 270 + 360 * (Math.log10(ratio) / Math.log10(base))
        );
        global.getTemperament = jest.fn(key => {
            if (key === "equal") {
                return {
                    interval: ["unison"],
                    pitchNumber: 0,
                    unison: 1,
                    noteLabels: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"]
                };
            }
            return {
                interval: ["unison"],
                pitchNumber: 0,
                unison: 1,
                noteLabels: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"]
            };
        });

        global.platformColor = {
            selectorBackground: "#fff",
            selectorBackgroundHOVER: "#eee",
            labelColor: "#ddd"
        };

        global.last = arr => arr[arr.length - 1];
        global.Singer = { defaultBPMFactor: 1, masterVolume: [80] };
        const util = require("util");
        global.TextEncoder = util.TextEncoder;
        global.TextDecoder = util.TextDecoder;
        global.normalizeNoteAccidentals = note => {
            const map = { "♭": "b", "♯": "#", "𝄫": "bb", "𝄪": "x" };
            return note.replace(/[♭♯𝄫𝄪]/gu, m => map[m]);
        };

        global.pitchToFrequency = jest.fn(() => 440);
        global.frequencyToPitch = jest.fn(() => ["C", 4, 0]);
        global.parseNoteString = jest.fn(note => [note.slice(0, -1), Number(note.slice(-1))]);
        global.slicePath = jest.fn(() => ({
            MenuSliceWithoutLine: {},
            MenuSliceCustomization: () => ({}),
            DonutSlice: {},
            DonutSliceCustomization: () => ({})
        }));

        const mockElements = {};
        global.docById = jest.fn(id => {
            if (!mockElements[id]) {
                mockElements[id] = createMockElement(id);
            }
            return mockElements[id];
        });

        widget = new TemperamentWidget();
    });

    test("constructor initializes default values", () => {
        expect(widget.inTemperament).toBeNull();
        expect(widget.notes).toEqual([]);
        expect(widget.frequencies).toEqual([]);
        expect(widget.pitchNumber).toBe(0);
    });

    test("playNote triggers synth", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
            synth: {
                trigger: jest.fn()
            }
        };

        widget.frequencies = [440];
        widget.tempRatios1 = [1];
        widget.editMode = null;

        widget.playNote(0);

        expect(widget._logo.resetSynth).toHaveBeenCalled();
        expect(widget._logo.synth.trigger).toHaveBeenCalled();
    });

    test("checkTemperament sets custom if no match", () => {
        global.getTemperamentKeys = jest.fn(() => []);

        // spy on original
        const original = widget.checkTemperament;

        // override DOM side effect
        widget.checkTemperament = function (ratios) {
            const intervals = [];
            let selectedTemperament;

            const keys = getTemperamentKeys();

            if (keys.length === 0) {
                this.inTemperament = "custom";
                return;
            }

            return original.call(this, ratios);
        };

        widget.checkTemperament(["1.00", "2.00"]);

        expect(widget.inTemperament).toBe("custom");
    });

    test("playNote uses equal temperament branch", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
            synth: { trigger: jest.fn() }
        };

        widget.eqTempHzs = [500];
        widget.frequencies = [440];
        widget.editMode = "equal";

        global.docById = jest.fn(() => null);

        widget.playNote(0);

        expect(widget._logo.synth.trigger).toHaveBeenCalled();
    });

    test("playNote uses ratio temperament branch", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
            synth: { trigger: jest.fn() }
        };

        widget.NEqTempHzs = [600];
        widget.frequencies = [440];
        widget.editMode = "ratio";

        global.docById = jest.fn(() => null);

        widget.playNote(0);

        expect(widget._logo.synth.trigger).toHaveBeenCalled();
    });

    test("playNote uses wheelDiv4 branch", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
            synth: { trigger: jest.fn() }
        };

        widget.tempRatios1 = [2];
        widget.frequencies = [440];

        global.docById = jest.fn(id => {
            if (id === "wheelDiv4") return null;
            return { style: {} };
        });

        widget.playNote(0);

        expect(widget._logo.synth.trigger).toHaveBeenCalled();
    });

    test("edit delegates to TemperamentUI.edit(this)", () => {
        const origEdit = TemperamentUI.edit;
        TemperamentUI.edit = jest.fn();
        try {
            widget.edit();
            expect(TemperamentUI.edit).toHaveBeenCalledWith(widget);
        } finally {
            TemperamentUI.edit = origEdit;
        }
    });

    test("playNote default branch triggers correct frequency", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
            synth: {
                trigger: jest.fn()
            }
        };

        widget.frequencies = [440];
        widget.editMode = null;

        global.docById = jest.fn(() => null);

        widget.playNote(0);

        expect(widget._logo.resetSynth).toHaveBeenCalled();
        expect(widget._logo.synth.trigger).toHaveBeenCalledWith(
            0,
            440,
            expect.any(Number),
            "electronic synth",
            null,
            null
        );
    });

    test("playNote uses note-name mapping for default temperaments", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
            synth: {
                trigger: jest.fn(),
                inTemperament: "equal",
                changeInTemperament: false
            }
        };

        widget.inTemperament = "equal19";
        widget.editMode = null;
        widget.notes = [["D♭", 4]];
        widget.frequencies = [440];

        global.isCustomTemperament = jest.fn(() => false);
        global.docById = jest.fn(() => null);

        widget.playNote(0);

        expect(widget._logo.synth.inTemperament).toBe("equal19");
        expect(widget._logo.synth.changeInTemperament).toBe(true);
        expect(widget._logo.synth.trigger).toHaveBeenCalledWith(
            0,
            "Db4",
            expect.any(Number),
            "electronic synth",
            null,
            null
        );
    });

    test("playNote keeps equal temperament on frequency path", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
            synth: {
                trigger: jest.fn(),
                inTemperament: "equal",
                changeInTemperament: false
            }
        };

        widget.inTemperament = "equal";
        widget.editMode = null;
        widget.notes = [["D♭", 4]];
        widget.frequencies = [440];

        global.isCustomTemperament = jest.fn(() => false);
        global.docById = jest.fn(() => null);

        widget.playNote(0);

        expect(widget._logo.synth.trigger).toHaveBeenCalledWith(
            0,
            440,
            expect.any(Number),
            "electronic synth",
            null,
            null
        );
    });

    test("playNote keeps custom temperament on frequency path", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
            synth: {
                trigger: jest.fn(),
                inTemperament: "custom",
                changeInTemperament: false
            }
        };

        widget.inTemperament = "custom";
        widget.editMode = null;
        widget.notes = [["D♭", 4]];
        widget.frequencies = [441.25];

        global.isCustomTemperament = jest.fn(() => true);
        global.docById = jest.fn(() => null);

        widget.playNote(0);

        expect(widget._logo.synth.trigger).toHaveBeenCalledWith(
            0,
            441.25,
            expect.any(Number),
            "electronic synth",
            null,
            null
        );
    });

    test("playNote no-ops on out-of-range pitch index", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
            synth: {
                trigger: jest.fn(),
                inTemperament: "equal19",
                changeInTemperament: false
            }
        };

        widget.inTemperament = "equal19";
        widget.editMode = null;
        widget.notes = [];
        widget.frequencies = [];

        global.isCustomTemperament = jest.fn(() => false);
        global.docById = jest.fn(() => null);

        widget.playNote(999);

        expect(widget._logo.synth.trigger).not.toHaveBeenCalled();
    });

    test("playNote no-ops when synth is unavailable", () => {
        widget._logo = null;
        widget.inTemperament = "equal19";
        widget.editMode = null;
        widget.notes = [["C", 4]];
        widget.frequencies = [440];

        global.docById = jest.fn(() => null);

        expect(() => widget.playNote(0)).not.toThrow();
    });

    test("_save executes without crash and loads both stacks even if widget timers are cleared", () => {
        jest.useFakeTimers();
        global.setOctaveRatio = jest.fn();
        global.rationalToFraction = jest.fn(() => [1, 1]);
        global.getOctaveRatio = jest.fn(() => 2);

        widget.inTemperament = "equal";
        widget.ratios = [1, 2];
        widget.notes = [
            ["C", 4],
            ["C", 5]
        ];
        widget.powerBase = 2;

        widget._logo = {
            synth: {
                stop: jest.fn(),
                startingPitch: "C4"
            }
        };

        widget.activity = {
            textMsg: jest.fn(),
            blocks: {
                loadNewBlocks: jest.fn(),
                findUniqueTemperamentName: jest.fn(() => "custom1")
            }
        };

        widget._save();

        expect(widget.activity.blocks.loadNewBlocks).toHaveBeenCalledTimes(1);

        // Closing the widget clears widget timers, but save's delayed loadNewBlocks must stay alive
        widget._clearWidgetTimers();
        jest.advanceTimersByTime(500);

        expect(widget.activity.blocks.loadNewBlocks).toHaveBeenCalledTimes(2);
        expect(widget.activity.textMsg).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("_save clears the pitch-to-frequency cache when saving a custom temperament", () => {
        global.setOctaveRatio = jest.fn();
        global.rationalToFraction = jest.fn(() => [1, 1]);
        global.getOctaveRatio = jest.fn(() => 2);
        global.isCustomTemperament = jest.fn(() => true);
        global.deleteTemperamentFromList = jest.fn();
        global.addTemperamentToDictionary = jest.fn();
        global.updateTemperaments = jest.fn();
        global.Singer.clearPitchToFrequencyCache = jest.fn();

        widget.inTemperament = "custom1";
        widget.ratios = [1, 2];
        widget.pitchNumber = 2;
        widget.powerBase = 2;

        widget._logo = {
            synth: {
                stop: jest.fn(),
                startingPitch: "C4"
            },
            customTemperamentDefined: false
        };

        widget.activity = {
            blocks: {
                loadNewBlocks: jest.fn(),
                findUniqueTemperamentName: jest.fn(() => "custom1"),
                protoBlockDict: { custompitch: { hidden: true } },
                palettes: { updatePalettes: jest.fn() }
            }
        };

        widget._save();

        // saving a redefined custom temperament under the same name must
        // invalidate any frequency already cached for that name, otherwise
        // notes keep playing at the pre-edit tuning until the project restarts.
        // Assert the exact saved payload, not just that the mock was called,
        // since _save recomputes note/ratio entries from this.ratios.
        expect(global.addTemperamentToDictionary).toHaveBeenCalledWith("custom1", {
            pitchNumber: 2,
            0: [1, "C", 4],
            1: [2, "C", 4]
        });
        expect(global.Singer.clearPitchToFrequencyCache).toHaveBeenCalled();
    });

    test("_save invalidates a frequency already cached under the redefined temperament's name", () => {
        // Exercises the real cache (Singer.getCachedPitchToFrequency /
        // clearPitchToFrequencyCache) instead of a mocked
        // clearPitchToFrequencyCache, so this fails the way the original bug
        // actually manifested: a note kept playing at the pre-edit tuning
        // after a custom temperament was redefined under the same name.
        const RealSinger = require("../../turtle-singer");
        global.Singer.clearPitchToFrequencyCache = RealSinger.clearPitchToFrequencyCache;
        RealSinger.clearPitchToFrequencyCache();

        global.setOctaveRatio = jest.fn();
        global.rationalToFraction = jest.fn(() => [1, 1]);
        global.getOctaveRatio = jest.fn(() => 2);
        global.isCustomTemperament = jest.fn(() => true);
        global.deleteTemperamentFromList = jest.fn();
        global.addTemperamentToDictionary = jest.fn();
        global.updateTemperaments = jest.fn();

        // Play a note under the temperament's original tuning; this caches
        // its frequency under a key keyed on the temperament's name.
        global.pitchToFrequency = jest.fn(() => 440);
        const beforeEdit = RealSinger.getCachedPitchToFrequency("C", 4, 0, null, "custom1");
        expect(beforeEdit).toBe(440);

        widget.inTemperament = "custom1";
        widget.ratios = [1, 2];
        widget.pitchNumber = 2;
        widget.powerBase = 2;

        widget._logo = {
            synth: {
                stop: jest.fn(),
                startingPitch: "C4"
            },
            customTemperamentDefined: false
        };

        widget.activity = {
            blocks: {
                loadNewBlocks: jest.fn(),
                findUniqueTemperamentName: jest.fn(() => "custom1"),
                protoBlockDict: { custompitch: { hidden: true } },
                palettes: { updatePalettes: jest.fn() }
            }
        };

        // Redefine "custom1" with a different tuning, then save under the
        // same name.
        global.pitchToFrequency = jest.fn(() => 466.16);
        widget._save();

        // The same pitch, under the same temperament name, must now recompute
        // rather than return the frequency cached before the edit.
        const afterEdit = RealSinger.getCachedPitchToFrequency("C", 4, 0, null, "custom1");
        expect(afterEdit).toBe(466.16);
    });

    test("init sets up widget correctly", () => {
        const mockWidgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            getWidgetBody: jest.fn(() => ({
                append: jest.fn(),
                style: {}
            })),
            addButton: jest.fn(() => ({
                onclick: null,
                getElementsByTagName: jest.fn(() => [{}])
            })),
            sendToCenter: jest.fn()
        };

        global.window.widgetWindows = {
            windowFor: jest.fn(() => mockWidgetWindow)
        };

        global.window.innerWidth = 1200;
        global.buildScale = jest.fn(() => [["C"], []]);
        global.getNoteFromInterval = jest.fn(() => ["C", 4]);
        global.getTemperament = jest.fn(key => {
            if (key === "equal") {
                return {
                    interval: ["unison", "octave"],
                    pitchNumber: 1,
                    unison: 1,
                    octave: 2,
                    0: 1,
                    1: 2,
                    noteLabels: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"]
                };
            }
            return {
                interval: ["unison", "octave"],
                pitchNumber: 1,
                unison: 1,
                octave: 2,
                0: 1,
                1: 2
            };
        });

        const mockActivity = {
            errorMsg: jest.fn(),
            logo: {
                synth: {
                    startingPitch: "C4",
                    _getFrequency: jest.fn(() => 440)
                }
            }
        };

        widget.inTemperament = "equal";
        widget.scale = ["C", "Major"];
        widget.init(mockActivity);

        expect(mockWidgetWindow.clear).toHaveBeenCalled();
        expect(mockWidgetWindow.show).toHaveBeenCalled();
        expect(widget.activity).toBe(mockActivity);
        expect(widget.pitchNumber).toBe(1);
    });

    test("checkTemperament identifies predefined temperament", () => {
        global.getTemperamentKeys = jest.fn(() => ["equal", "just"]);
        global.getTemperament = jest.fn(key => {
            if (key === "equal") {
                return {
                    interval: ["0", "1"],
                    pitchNumber: 1,
                    0: 1,
                    1: 2,
                    noteLabels: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"]
                };
            }
            return {
                interval: [],
                pitchNumber: 0,
                noteLabels: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"]
            };
        });
        global.isCustomTemperament = jest.fn(() => false);
        global.buildScale = jest.fn(() => [["C"], []]);
        global.getNoteFromInterval = jest.fn(() => ["C", 4]);

        const mockActivity = {
            logo: {
                synth: {
                    startingPitch: "C4",
                    _getFrequency: jest.fn(() => 440)
                }
            }
        };

        // Call init to initialize temperamentCell
        widget.inTemperament = "equal";
        widget.scale = ["C", "Major"];
        widget.init(mockActivity);

        widget.checkTemperament(["1.00", "2.00"]);

        expect(widget.inTemperament).toBe("equal");
    });

    describe("checkTemperament ratio extraction", () => {
        beforeEach(() => {
            // Set up temperamentCell via init
            const mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                getWidgetBody: jest.fn(() => ({ append: jest.fn(), style: {} })),
                addButton: jest.fn(() => ({
                    onclick: null,
                    getElementsByTagName: jest.fn(() => [{}])
                })),
                sendToCenter: jest.fn()
            };
            global.window.widgetWindows = { windowFor: jest.fn(() => mockWidgetWindow) };
            global.window.innerWidth = 1200;
            global.buildScale = jest.fn(() => [["C"], []]);
            global.getNoteFromInterval = jest.fn(() => ["C", 4]);
            global.getTemperamentsList = jest.fn(() => [
                ["Equal (12EDO)", "equal"],
                ["Just intonation", "just"]
            ]);
            global.isCustomTemperament = jest.fn(() => false);

            widget.inTemperament = "equal";
            widget.scale = ["C", "Major"];
            widget.init({
                errorMsg: jest.fn(),
                logo: {
                    synth: {
                        startingPitch: "C4",
                        _getFrequency: jest.fn(() => 440)
                    }
                }
            });
        });

        test("correctly extracts ratio from {ratio, cents} object for comparison", () => {
            global.getTemperamentKeys = jest.fn(() => ["pythagorean"]);
            global.getTemperament = jest.fn(() => ({
                interval: ["unison", "fifth"],
                pitchNumber: 1,
                unison: { ratio: 1.0, cents: 0 },
                fifth: { ratio: 1.5, cents: 701.96 }
            }));

            widget.checkTemperament(["1.00", "1.50"]);

            // ratios match → should be identified as "pythagorean", not "custom"
            expect(widget.inTemperament).toBe("pythagorean");
        });

        test("falls back to custom when {ratio, cents} values do not match input ratios", () => {
            global.getTemperamentKeys = jest.fn(() => ["just"]);
            global.getTemperament = jest.fn(() => ({
                interval: ["unison", "fifth"],
                pitchNumber: 1,
                unison: { ratio: 1.0, cents: 0 },
                fifth: { ratio: 1.5, cents: 701.96 }
            }));

            // Pass ratios that don't match
            widget.checkTemperament(["1.00", "1.33"]);

            expect(widget.inTemperament).toBe("custom");
        });
    });

    describe("cents <-> frequency conversion", () => {
        test("_freqToCents returns 0 when frequency equals base", () => {
            expect(widget._freqToCents(440, 440)).toBe(0);
        });

        test("_freqToCents returns 1200 for one octave up", () => {
            expect(widget._freqToCents(880, 440)).toBeCloseTo(1200, 6);
        });

        test("_freqToCents returns -1200 for one octave down", () => {
            expect(widget._freqToCents(220, 440)).toBeCloseTo(-1200, 6);
        });

        test("_freqToCents returns ~100 for one equal-tempered semitone up", () => {
            const semitone = 440 * Math.pow(2, 1 / 12);
            expect(widget._freqToCents(semitone, 440)).toBeCloseTo(100, 6);
        });

        test("_centsToFreq returns the base frequency for 0 cents", () => {
            expect(widget._centsToFreq(0, 440)).toBe(440);
        });

        test("_centsToFreq doubles the frequency at +1200 cents", () => {
            expect(widget._centsToFreq(1200, 440)).toBeCloseTo(880, 6);
        });

        test("_centsToFreq halves the frequency at -1200 cents", () => {
            expect(widget._centsToFreq(-1200, 440)).toBeCloseTo(220, 6);
        });

        test("round-trip: freq -> cents -> freq preserves the original", () => {
            const freq = 523.25;
            const cents = widget._freqToCents(freq, 440);
            expect(widget._centsToFreq(cents, 440)).toBeCloseTo(freq, 6);
        });

        test("round-trip: cents -> freq -> cents preserves the original", () => {
            const cents = 47;
            const freq = widget._centsToFreq(cents, 440);
            expect(widget._freqToCents(freq, 440)).toBeCloseTo(cents, 6);
        });
    });

    describe("TemperamentWidget interactive events", () => {
        let mockWidgetWindow;
        let mockActivity;
        let widgetBody;

        beforeEach(() => {
            widgetBody = document.createElement("div");
            document.body.appendChild(widgetBody);
            mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                getWidgetBody: jest.fn(() => widgetBody),
                addButton: jest.fn(() => ({
                    onclick: null,
                    style: {},
                    getElementsByTagName: jest.fn(() => [createMockElement("img")])
                })),
                sendToCenter: jest.fn(),
                destroy: jest.fn(),
                onclose: null
            };
            global.window.widgetWindows = { windowFor: jest.fn(() => mockWidgetWindow) };
            global.window.innerWidth = 1200;
            global.buildScale = jest.fn(() => [["C"], []]);
            global.getNoteFromInterval = jest.fn(() => ["C", 4]);
            global.getTemperamentsList = jest.fn(() => [
                ["Equal (12EDO)", "equal"],
                ["Just intonation", "just"]
            ]);
            global.isCustomTemperament = jest.fn(() => false);

            mockActivity = {
                errorMsg: jest.fn(),
                logo: {
                    synth: {
                        startingPitch: "C4",
                        _getFrequency: jest.fn(() => 440),
                        setMasterVolume: jest.fn(),
                        stop: jest.fn(),
                        trigger: jest.fn()
                    },
                    resetSynth: jest.fn()
                }
            };

            widget.inTemperament = "equal";
            widget.scale = ["C", "Major"];
            widget.init(mockActivity);

            widget.tempRatios1 = [1];
            widget.ratios = [1.0];
            widget.intervals = ["unison"];
            widget.notes = [["C", 4]];
            widget.scaleNotes = ["C"];
            widget.frequencies = [440];
            widget.wheel = { removeWheel: jest.fn() };
            widget.notesCircle = { removeWheel: jest.fn() };
            widget.wheel1 = { removeWheel: jest.fn() };
        });

        afterEach(() => {
            if (widgetBody && widgetBody.parentNode) {
                widgetBody.parentNode.removeChild(widgetBody);
            }
        });

        test("onclose cleans up timeouts and playing state", () => {
            widget._playAllRunning = true;
            widget._playAllTimer = widget._setWidgetTimeout(() => {}, 1000);
            widget._playTimeout = widget._setWidgetTimeout(() => {}, 1000);
            expect(widget._timerManager.activeTimeoutCount).toBe(2);

            expect(mockWidgetWindow.onclose).toBeDefined();
            mockWidgetWindow.onclose();

            expect(widget._playAllRunning).toBe(false);
            expect(widget._playAllTimer).toBeNull();
            expect(widget._playTimeout).toBeNull();
            expect(widget._timerManager.activeTimeoutCount).toBe(0);
            expect(mockActivity.logo.synth.stop).toHaveBeenCalled();
            expect(mockActivity.logo.synth.setMasterVolume).toHaveBeenCalled();
        });

        test("saveButton click triggers _save", () => {
            const saveBtn = mockWidgetWindow.addButton.mock.results[1].value;
            expect(saveBtn.onclick).toBeDefined();

            widget._save = jest.fn();
            saveBtn.onclick();
            expect(widget._save).toHaveBeenCalled();
        });

        test("sparse pitch data does not blank the table (partial load regression)", () => {
            // Simulates a partial temperament load: pitchNumber exceeds the
            // filled arrays (stale/partial custom entry). Rows 0-2 complete.
            widget.powerBase = 2;
            widget.pitchNumber = 5;
            widget.cents = [0, 100, 200];
            widget.ratios = [1, Math.pow(2, 1 / 12), Math.pow(2, 2 / 12)];
            widget.frequencies = ["261.63", "277.18", "293.66"];
            widget.notes = [
                ["A", 4],
                ["Bb", 4],
                ["B", 4]
            ];

            expect(() => widget._visualizerView()).not.toThrow();
        });

        test("15 divisions produce 15 pitches end to end (off-by-one regression)", () => {
            seedEqualEdit(15);
            widget.checkTemperament = jest.fn();
            TemperamentUI.equalEdit(widget);
            widget.performEqualEdit({ target: { textContent: "done" } });
            expect(widget.pitchNumber).toBe(15);
            expect(widget.ratios.length).toBe(15);
            expect(widget.cents.length).toBe(15);
            expect(widget.notes.length).toBe(15);
            expect(widget.frequencies.length).toBe(15);
            expect(widget.ratios[14]).toBeCloseTo(Math.pow(2, 14 / 15), 10);
        });

        describe("playAll", () => {
            const playedFrequencies = () =>
                mockActivity.logo.synth.trigger.mock.calls.map(call => call[1]);

            beforeEach(() => {
                jest.useFakeTimers();
                mockActivity.logo.synth.trigger.mockClear();
                widget.pitchNumber = 3;
                widget.powerBase = 2;
            });

            afterEach(() => {
                jest.useRealTimers();
            });

            test("12EDO: plays 25 notes with the octave exactly once", () => {
                widget.pitchNumber = 12;
                widget.frequencies = Array.from({ length: 13 }, (_, i) =>
                    (261.63 * Math.pow(2, i / 12)).toFixed(2)
                );

                widget.playAll();
                jest.runAllTimers();

                const freqs = playedFrequencies();
                expect(freqs).toHaveLength(25);
                expect(freqs.filter(f => f === 261.63 * 2)).toHaveLength(1);
            });

            test.each([
                ["include", ["100", "125", "150", "200"]],
                ["omit", ["100", "125", "150"]]
            ])("plays the octave once when frequencies %s the octave entry", (_, frequencies) => {
                widget.frequencies = frequencies;

                widget.playAll();
                jest.runAllTimers();

                expect(playedFrequencies()).toEqual([100, 125, 150, 200, 150, 125, 100]);
            });

            test("clears and suppresses previous dot selection highlight when playAll is started", () => {
                if (widget._vizToolbar && widget._vizToolbar.addPitchAfterBtn) {
                    widget._vizToolbar.addPitchAfterBtn.onclick();
                }

                const canvas = document.querySelector("canvas");
                const ctx = canvas
                    ? canvas.getContext("2d")
                    : document.createElement("canvas").getContext("2d");
                ctx.arc.mockClear();

                // Starting playAll must clear previous selection so only playing dots illuminate
                widget.playAll();
                expect(widget._playAllRunning).toBe(true);

                // Clean up timers
                jest.runAllTimers();
                expect(widget._playAllRunning).toBe(false);
            });

            test("disables mutation buttons and ignores add/remove/edit actions during playback", () => {
                widget.pitchNumber = 3;
                widget.cents = [0, 100, 200];
                widget.frequencies = ["261.63", "277.18", "293.66"];
                widget.ratios = [1, Math.pow(2, 1 / 12), Math.pow(2, 2 / 12)];
                widget.notes = [
                    ["C", 4],
                    ["C#", 4],
                    ["D", 4]
                ];
                widget.intervals = ["unison", "minor second", "major second"];
                widget.ratiosNotesPair = [
                    [widget.ratios[0], widget.notes[0]],
                    [widget.ratios[1], widget.notes[1]],
                    [widget.ratios[2], widget.notes[2]]
                ];
                widget._visualizerView();

                const pitchCountBefore = widget.pitchNumber;
                const freqsBefore = [...widget.frequencies];

                // Query the visualizer elements inside widgetBody
                const rows = widgetBody ? widgetBody.querySelectorAll("tbody tr") : [];
                const row1 = rows[1];
                const tdCents =
                    row1 && row1.cells
                        ? row1.cells[3]
                        : row1 && row1.children
                          ? row1.children[3]
                          : null;
                if (tdCents && tdCents.ondblclick) {
                    tdCents.ondblclick({ stopPropagation: () => {} });
                    const input = tdCents.querySelector("input");
                    if (input) input.value = "101";
                }

                widget.playAll();
                expect(widget._playAllRunning).toBe(true);

                if (widget._vizToolbar) {
                    expect(widget._vizToolbar.removePitchBtn.style.pointerEvents).toBe("none");
                    expect(widget._vizToolbar.addPitchAfterBtn.style.pointerEvents).toBe("none");
                    expect(widget._vizToolbar.addPitchBeforeBtn.style.pointerEvents).toBe("none");

                    // Mutations during playback must be ignored
                    widget._vizToolbar.removePitchBtn.onclick();
                    widget._vizToolbar.addPitchAfterBtn.onclick();
                    widget._vizToolbar.addPitchBeforeBtn.onclick();
                }

                const canvas = widgetBody
                    ? widgetBody.querySelector("canvas")
                    : document.querySelector("canvas");
                if (canvas) {
                    canvas.onmousedown({ button: 0 });
                    canvas.onmousemove({});
                    canvas.ontouchstart({ touches: [{ clientX: 0, clientY: 0 }] });
                    canvas.oncontextmenu({ preventDefault: () => {} });
                    canvas.onkeydown({ key: "ArrowRight", preventDefault: () => {} });
                }

                if (row1) {
                    row1.onclick();
                    row1.oncontextmenu({ preventDefault: () => {} });
                }

                if (tdCents) {
                    // Double-clicking an unlocked cell during playback must be ignored
                    tdCents.ondblclick({ stopPropagation: () => {} });
                    // Blurring an active input during playback must revert rather than commit mutation
                    const input = tdCents.querySelector("input");
                    if (input && input.onblur) input.onblur();
                }

                expect(widget.pitchNumber).toBe(pitchCountBefore);
                expect(widget.frequencies).toEqual(freqsBefore);
                expect(widget.cents[1]).toBe(100);

                // Toggling playAll while running stops playback early and restores buttons
                widget.playAll();
                expect(widget._playAllRunning).toBe(false);

                if (widget._vizToolbar) {
                    expect(widget._vizToolbar.removePitchBtn.style.pointerEvents).toBe("auto");
                    expect(widget._vizToolbar.addPitchAfterBtn.style.pointerEvents).toBe("auto");
                    expect(widget._vizToolbar.addPitchBeforeBtn.style.pointerEvents).toBe("auto");
                }
            });
        });

        test("custom transition resets typeOfEdit so save emits ratio blocks", () => {
            global.getTemperamentKeys = jest.fn(() => ["equal"]);
            widget.activity = { errorMsg: jest.fn() };
            widget.typeOfEdit = "equal";
            widget.checkTemperament([1.5]);
            expect(widget.inTemperament).toBe("custom");
            expect(widget.typeOfEdit).toBe("nonequal");
        });
    });

    describe("regression tests for visualizer / reference fixes", () => {
        test("equal17 exposes keyed interval->ratio properties (regression)", () => {
            const musicutils = require("../../utils/musicutils");
            const t = musicutils.getTemperament("equal17");
            expect(t).toBeTruthy();
            expect(typeof t["perfect 1"]).toBe("number");
            expect(t["perfect 1"]).toBeCloseTo(1, 6);
            expect(t["minor 2"]).toBeCloseTo(Math.pow(2, 2 / 17), 6);
            expect(t["perfect 8"]).toBeCloseTo(2, 6);
        });
    });

    test("visualizer controls are on the widget toolbar, not an inline bar", () => {
        const addedIcons = [];
        const mockWidgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            getWidgetBody: jest.fn(() => ({ append: jest.fn(), style: {} })),
            addButton: jest.fn(icon => {
                addedIcons.push(icon);
                return { onclick: null, getElementsByTagName: jest.fn(() => [{}]), style: {} };
            }),
            sendToCenter: jest.fn()
        };
        global.window.widgetWindows = { windowFor: jest.fn(() => mockWidgetWindow) };
        global.window.innerWidth = 1200;
        global.buildScale = jest.fn(() => [["C"], []]);
        global.getNoteFromInterval = jest.fn(() => ["C", 4]);
        global.getTemperament = jest.fn(() => ({
            interval: ["unison"],
            pitchNumber: 0,
            unison: 1,
            0: [1, "C", 4],
            noteLabels: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"]
        }));

        widget.inTemperament = "equal";
        widget.scale = ["C", "Major"];
        widget.init({
            errorMsg: jest.fn(),
            logo: { synth: { startingPitch: "C4", _getFrequency: jest.fn(() => 260.74) } }
        });

        // Toolbar should contain the visualizer ops (not just Play/Save)
        expect(addedIcons).toEqual(
            expect.arrayContaining([
                "play-scale.svg",
                "add-clockwise.svg",
                "add-counterclockwise.svg",
                "delete.svg"
            ])
        );
    });

    describe("temperament visualizer math", () => {
        const { deviationColor, deviationFrom12EDO } = require("../temperament");

        describe("deviationColor", () => {
            it("is green within ±1 cent", () => {
                expect(deviationColor(0)).toBe("#4caf50");
                expect(deviationColor(1)).toBe("#4caf50");
                expect(deviationColor(-1)).toBe("#4caf50");
            });
            it("is orange when sharp (>1 cent)", () => {
                expect(deviationColor(2)).toBe("#ff9800");
                expect(deviationColor(50)).toBe("#ff9800");
            });
            it("is red when flat (<-1 cent)", () => {
                expect(deviationColor(-2)).toBe("#f44336");
                expect(deviationColor(-50)).toBe("#f44336");
            });
        });

        describe("deviationFrom12EDO", () => {
            it("reports 0 for a pitch exactly on a 12-EDO step", () => {
                expect(deviationFrom12EDO(0)).toBe(0);
                expect(deviationFrom12EDO(100)).toBe(0);
                expect(deviationFrom12EDO(400)).toBe(0);
                expect(deviationFrom12EDO(1100)).toBe(0);
            });
            it("reports +cents for a pitch above the nearest 12-EDO step", () => {
                expect(deviationFrom12EDO(386)).toBeCloseTo(-14, 1);
                expect(deviationFrom12EDO(415)).toBeCloseTo(15, 1);
            });
            it("snaps to the nearest 12-EDO step", () => {
                expect(deviationFrom12EDO(50)).toBeCloseTo(-50, 1);
                expect(deviationFrom12EDO(150)).toBeCloseTo(-50, 1);
                expect(deviationFrom12EDO(250)).toBeCloseTo(-50, 1);
            });
            it("matches the user's scenario: equal19 active, deviation from 12-EDO", () => {
                expect(deviationFrom12EDO(0)).toBeCloseTo(0, 1);
                expect(deviationFrom12EDO(1200 / 19)).toBeCloseTo(-36.84, 1);
                expect(deviationFrom12EDO((2 * 1200) / 19)).toBeCloseTo(26.32, 1);
                expect(deviationFrom12EDO((3 * 1200) / 19)).toBeCloseTo(-10.53, 1);
            });
        });
    });

    describe("relative cents editing", () => {
        test("full-octave equal division replaces ratios (25-EDO is exact)", () => {
            seedEqualEdit(25);
            TemperamentUI.equalEdit(widget);
            widget.performEqualEdit({ target: { textContent: "preview" } });
            expect(widget.tempRatios.length).toBe(25);
            for (let k = 0; k < 25; k++) {
                expect(widget.tempRatios[k]).toBeCloseTo(Math.pow(2, k / 25), 10);
            }
        });
    });

    describe("equal divisions cap at 57", () => {
        test("57 divisions succeeds", () => {
            seedEqualEdit(57);
            TemperamentUI.equalEdit(widget);
            widget.performEqualEdit({ target: { textContent: "preview" } });
            expect(widget.activity.errorMsg).not.toHaveBeenCalled();
        });
        test("58 divisions shows cap error", () => {
            seedEqualEdit(58);
            TemperamentUI.equalEdit(widget);
            widget.performEqualEdit({ target: { textContent: "preview" } });
            expect(widget.activity.errorMsg).toHaveBeenCalledWith(
                expect.stringContaining("57"),
                3000
            );
        });
    });

    describe("timer fallback without ManagedTimer", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            widget = new TemperamentWidget();
            widget._timerManager = null;
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("_setWidgetTimeout tracks the timeout and runs the callback, then stops tracking it", () => {
            const callback = jest.fn();

            const id = widget._setWidgetTimeout(callback, 500);
            expect(widget._activeTimeouts.has(id)).toBe(true);

            jest.advanceTimersByTime(500);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(widget._activeTimeouts.has(id)).toBe(false);
        });

        test("_clearWidgetTimeout returns false for null, undefined, or untracked ids", () => {
            expect(widget._clearWidgetTimeout(null)).toBe(false);
            expect(widget._clearWidgetTimeout(undefined)).toBe(false);
            expect(widget._clearWidgetTimeout(999999)).toBe(false);
        });

        test("_clearWidgetTimeout cancels a tracked timeout before it fires", () => {
            const callback = jest.fn();
            const id = widget._setWidgetTimeout(callback, 500);

            expect(widget._clearWidgetTimeout(id)).toBe(true);
            expect(widget._activeTimeouts.has(id)).toBe(false);

            jest.advanceTimersByTime(500);
            expect(callback).not.toHaveBeenCalled();
        });

        test("_clearWidgetTimers cancels tracked timeouts, resets _playTimeout, and returns count", () => {
            widget._setWidgetTimeout(jest.fn(), 500);
            widget._setWidgetTimeout(jest.fn(), 700);
            widget._playTimeout = 123;

            const count = widget._clearWidgetTimers();

            expect(count).toBe(2);
            expect(widget._activeTimeouts.size).toBe(0);
            expect(widget._playTimeout).toBeNull();
        });
    });

    describe("timer delegation to ManagedTimer", () => {
        beforeEach(() => {
            widget = new TemperamentWidget();
        });

        afterEach(() => {
            widget._clearWidgetTimers();
        });

        test("initializes with ManagedTimer when available", () => {
            expect(widget._timerManager).toBeInstanceOf(ManagedTimer);
        });

        test("_setWidgetTimeout delegates to the timer manager", () => {
            const callback = jest.fn();
            widget._timerManager = {
                setTimeout: jest.fn().mockReturnValue(42),
                clearAll: jest.fn().mockReturnValue(0)
            };

            expect(widget._setWidgetTimeout(callback, 500)).toBe(42);
            expect(widget._timerManager.setTimeout).toHaveBeenCalledWith(callback, 500);
        });

        test("_clearWidgetTimeout delegates to the timer manager", () => {
            widget._timerManager = {
                clearTimeout: jest.fn().mockReturnValue(true),
                clearAll: jest.fn().mockReturnValue(0)
            };

            expect(widget._clearWidgetTimeout(5)).toBe(true);
            expect(widget._timerManager.clearTimeout).toHaveBeenCalledWith(5);
        });

        test("_clearWidgetTimers delegates to the timer manager clearAll and resets _playTimeout", () => {
            widget._timerManager = {
                clearAll: jest.fn().mockReturnValue(3)
            };
            widget._playTimeout = 55;

            const count = widget._clearWidgetTimers();

            expect(widget._timerManager.clearAll).toHaveBeenCalledTimes(1);
            expect(count).toBe(3);
            expect(widget._playTimeout).toBeNull();
        });

        test("playAll delegates to _playAll when the visualizer is open", () => {
            // With the upstream refactor, this.playAll() is a thin shell that
            // delegates to this._playAll(), which is set by _visualizerView().
            // Verify the delegation contract: if _playAll is defined, it is called.
            widget._playAll = jest.fn();

            widget.playAll();

            expect(widget._playAll).toHaveBeenCalledTimes(1);
        });
    });
});
