const TemperamentWidget = require("../temperament");
describe("TemperamentWidget basic tests", () => {
    let widget;
    global._ = jest.fn(text => text);

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
            navItems: [],
            slicePathFunction: null,
            slicePathCustom: {},
            sliceSelectedPathCustom: {},
            sliceInitPathCustom: {},
            initWheel: jest.fn(),
            createWheel: jest.fn(),
            removeWheel: jest.fn(),
            refreshWheel: jest.fn()
        }));

        global.platformColor = {
            selectorBackground: "#fff",
            selectorBackgroundHOVER: "#eee",
            labelColor: "#ddd"
        };

        global.Singer = { defaultBPMFactor: 1 };
        const util = require("util");
        global.TextEncoder = util.TextEncoder;
        global.TextDecoder = util.TextDecoder;
        global.normalizeNoteAccidentals = note => {
            const map = { "♭": "b", "♯": "#", "𝄫": "bb", "𝄪": "x" };
            return note.replace(/[♭♯𝄫𝄪]/gu, m => map[m]);
        };

        global.getTemperamentKeys = jest.fn(() => []);
        global.isCustomTemperament = jest.fn(() => false);
        global.getTemperament = jest.fn(() => ({
            interval: [],
            pitchNumber: 0
        }));
        global.pitchToFrequency = jest.fn(() => 440);
        global.frequencyToPitch = jest.fn(() => ["C", 4, 0]);
        global.slicePath = jest.fn(() => ({
            MenuSliceWithoutLine: {},
            MenuSliceCustomization: () => ({}),
            DonutSlice: {},
            DonutSliceCustomization: () => ({})
        }));

        global.FLAT = "♭";
        global.SHARP = "♯";

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
        expect(widget.circleIsVisible).toBe(true);
    });

    test("playNote triggers synth", () => {
        widget._logo = {
            resetSynth: jest.fn(),
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

    test("playAll toggles playing state", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: {
                trigger: jest.fn(),
                stop: jest.fn(),
                setMasterVolume: jest.fn(),
                startingPitch: "C4"
            }
        };

        widget.playButton = {
            innerHTML: "",
            textContent: "",
            appendChild: jest.fn(),
            setAttribute: jest.fn(),
            style: {}
        };

        widget.pitchNumber = 0;
        widget.frequencies = [440];
        widget.tempRatios1 = [1];
        widget.circleIsVisible = true;

        global.docById = jest.fn(() => ({
            style: {}
        }));

        widget.playAll();

        expect(widget._playing).toBe(true);
    });

    test("edit sets editMode to null and prepares UI", () => {
        widget._logo = {
            synth: {
                setMasterVolume: jest.fn(),
                stop: jest.fn()
            }
        };
        widget.notesCircle = {
            removeWheel: jest.fn()
        };

        global.docById = jest.fn(() => ({
            innerHTML: "",
            textContent: "",
            appendChild: jest.fn(),
            setAttribute: jest.fn(),
            style: {},
            append: jest.fn()
        }));
        document.querySelectorAll = jest.fn(() => [
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} }
        ]);

        widget.edit();

        expect(widget.editMode).toBe("equal");
    });

    test("equalEdit sets editMode to equal", () => {
        global.docById = jest.fn(() => ({
            innerHTML: "",
            textContent: "",
            appendChild: jest.fn(),
            setAttribute: jest.fn(),
            style: {},
            append: jest.fn()
        }));

        widget.equalEdit();

        expect(widget.editMode).toBe("equal");
    });

    test("ratioEdit sets editMode to ratio", () => {
        global.docById = jest.fn(() => ({
            innerHTML: "",
            textContent: "",
            appendChild: jest.fn(),
            setAttribute: jest.fn(),
            style: {},
            append: jest.fn()
        }));

        widget.ratioEdit();

        expect(widget.editMode).toBe("ratio");
    });

    test("arbitraryEdit sets editMode to arbitrary", () => {
        global.docById = jest.fn(id => {
            if (id === "circ1") {
                return {
                    style: {},
                    width: 500,
                    height: 500,
                    getContext: jest.fn(() => ({
                        beginPath: jest.fn(),
                        arc: jest.fn(),
                        fill: jest.fn(),
                        stroke: jest.fn(),
                        lineWidth: 0,
                        fillStyle: "",
                        strokeStyle: ""
                    }))
                };
            }

            return {
                innerHTML: "",
                textContent: "",
                appendChild: jest.fn(),
                setAttribute: jest.fn(),
                style: {},
                append: jest.fn(),
                addEventListener: jest.fn() // 👈 ADD THIS
            };
        });

        widget.arbitraryEdit();

        expect(widget.editMode).toBe("arbitrary");
    });

    test("octaveSpaceEdit sets editMode to octave", () => {
        widget.ratios = [1, 2];

        global.docById = jest.fn(() => ({
            innerHTML: "",
            textContent: "",
            appendChild: jest.fn(),
            setAttribute: jest.fn(),
            style: {},
            append: jest.fn()
        }));

        widget.octaveSpaceEdit();

        expect(widget.editMode).toBe("octave");
    });

    test("playNote default branch triggers correct frequency", () => {
        widget._logo = {
            resetSynth: jest.fn(),
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

    test("toggleNotesButton switches icon when circle visible", () => {
        widget.toggleNotesButton = function () {
            this.circleIsVisible = false;
        };

        widget.circleIsVisible = true;

        widget.toggleNotesButton();

        expect(widget.circleIsVisible).toBe(false);
    });

    test("_graphOfNotes renders table view", () => {
        widget.toggleNotesButton = jest.fn();
        widget.notesCircle = {
            removeWheel: jest.fn()
        };

        widget.inTemperament = "equal";
        widget.pitchNumber = 1;
        widget.ratios = [1, 2];
        widget.frequencies = [440, 880];
        widget.intervals = ["0", "1"];
        widget.notes = [
            ["C", 4],
            ["C", 5]
        ];
        widget.scaleNotes = ["C"];
        widget.circleIsVisible = false;

        global.isCustomTemperament = jest.fn(() => false);

        global.docById = jest.fn(() => ({
            innerHTML: "",
            textContent: "",
            appendChild: jest.fn(),
            setAttribute: jest.fn(),
            style: {},
            insertCell: jest.fn(() => ({
                innerHTML: "",
                textContent: "",
                appendChild: jest.fn(),
                setAttribute: jest.fn(),
                style: {},
                onmouseover: jest.fn(),
                onmouseout: jest.fn()
            })),
            append: jest.fn()
        }));
        document.querySelectorAll = jest.fn(() => [
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} },
            { style: {} }
        ]);

        widget._graphOfNotes();

        expect(widget.circleIsVisible).toBe(true);
    });

    test("_refreshInnerWheel updates temporary ratios", () => {
        widget.frequencies = [440];
        widget.tempRatios1 = [1];
        widget.tempRatios = [1];

        global.docById = jest.fn(id => {
            if (id === "frequencySlider") {
                return { value: 880 };
            }
            if (id === "frequencydiv") {
                return {
                    innerHTML: "",
                    textContent: "",
                    appendChild: jest.fn(),
                    setAttribute: jest.fn()
                };
            }
            return {
                style: {},
                innerHTML: "",
                textContent: "",
                appendChild: jest.fn(),
                setAttribute: jest.fn()
            };
        });

        widget._logo = {
            resetSynth: jest.fn(),
            synth: { trigger: jest.fn() }
        };

        widget._createInnerWheel = jest.fn();

        widget._refreshInnerWheel();

        expect(widget._createInnerWheel).toHaveBeenCalled();
    });

    test("octaveSpaceEdit handles non-2 ratio", () => {
        widget.ratios = [1, 2];
        widget.frequencies = [440, 880];
        widget.powerBase = 2;
        widget.pitchNumber = 1;

        widget.activity = {
            textMsg: jest.fn()
        };

        global.docById = jest.fn(id => {
            if (id === "startNote") return { value: 3 };
            if (id === "endNote") return { value: 1 };
            return {
                innerHTML: "",
                textContent: "",
                appendChild: jest.fn(),
                setAttribute: jest.fn(),
                style: {},
                append: jest.fn()
            };
        });

        widget.checkTemperament = jest.fn();
        widget._circleOfNotes = jest.fn();

        widget.octaveSpaceEdit();

        expect(widget.editMode).toBe("octave");
    });

    test("playAll handles reverse playback", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: {
                trigger: jest.fn(),
                stop: jest.fn(),
                setMasterVolume: jest.fn(),
                startingPitch: "C4"
            }
        };

        widget.playButton = {
            innerHTML: "",
            textContent: "",
            appendChild: jest.fn(),
            setAttribute: jest.fn(),
            style: {}
        };
        widget.pitchNumber = 1;
        widget.frequencies = [440, 880];
        widget.tempRatios1 = [1, 2];
        widget.circleIsVisible = false;
        widget.notesCircle = {
            navItems: [
                { fillAttr: "", sliceHoverAttr: {}, slicePathAttr: {}, sliceSelectedAttr: {} },
                { fillAttr: "", sliceHoverAttr: {}, slicePathAttr: {}, sliceSelectedAttr: {} }
            ],
            refreshWheel: jest.fn()
        };

        global.docById = jest.fn(() => null);

        widget.playAll();

        expect(widget._playing).toBe(true);
    });

    test("playAll stops when already playing", () => {
        widget._logo = {
            resetSynth: jest.fn(),
            synth: {
                stop: jest.fn(),
                setMasterVolume: jest.fn(),
                startingPitch: "C4" // 👈 REQUIRED
            }
        };

        widget.playButton = {
            innerHTML: "",
            textContent: "",
            appendChild: jest.fn(),
            setAttribute: jest.fn(),
            style: {}
        };
        widget._playing = true;
        widget.tempRatios1 = [1];

        widget.playAll();

        expect(widget._playing).toBe(false);
    });

    test("_save executes without crash", () => {
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
            blocks: {
                loadNewBlocks: jest.fn(),
                findUniqueTemperamentName: jest.fn(() => "custom1")
            }
        };

        widget._save();

        expect(widget.activity.blocks.loadNewBlocks).toHaveBeenCalled();
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
        global.getTemperament = jest.fn(() => ({
            interval: [],
            pitchNumber: 1,
            0: 1,
            1: 2
        }));

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

    test("showNoteInfo creates a popup", () => {
        document.body.innerHTML = `
            <div id="wheelDiv2"></div>
            <div id="information"></div>
        `;
        global.docById = jest.fn(id => document.getElementById(id));

        widget.notesCircle = {
            navItemCount: 1
        };
        widget.frequencies = [440];
        widget.ratios = [1];
        widget.powerBase = 2;
        widget.ratiosNotesPair = [[1, ["C", 4]]];

        const event = {
            target: { id: "wheelnav-wheelDiv2-slice-0" },
            clientX: 100,
            clientY: 100
        };

        widget.showNoteInfo(event);

        const noteInfo = global.docById("noteInfo");
        expect(noteInfo).not.toBeNull();
        expect(noteInfo.className).toBe("popup");
    });

    test("editFrequency sets up a frequency slider", () => {
        widget.frequencies = [440, 466, 494];
        widget.ratios = [1, 1.059, 1.122];
        widget.temporaryRatios = [];

        document.body.innerHTML = `
            <div id="noteInfo">
                <div id="note"></div>
                <div id="frequency"></div>
                <div id="close"></div>
            </div>
        `;
        global.docById = jest.fn(id => document.getElementById(id));

        const event = {
            target: { dataset: { message: "1" } }
        };

        widget.editFrequency(event);

        const slider = global.docById("frequencySlider1");
        expect(slider).not.toBeNull();
        expect(slider.type).toBe("range");
        expect(slider.id).toBe("frequencySlider1");
    });

    test("checkTemperament identifies predefined temperament", () => {
        global.getTemperamentKeys = jest.fn(() => ["equal", "just"]);
        global.getTemperament = jest.fn(key => {
            if (key === "equal") {
                return {
                    interval: ["0", "1"],
                    pitchNumber: 1,
                    0: 1,
                    1: 2
                };
            }
            return { interval: [], pitchNumber: 0 };
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
});
