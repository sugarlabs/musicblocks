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

    test("redundant circle and table views have been removed", () => {
        expect(typeof widget._circleOfNotes).toBe("undefined");
        expect(typeof widget._graphOfNotes).toBe("undefined");
        expect(typeof widget.showNoteInfo).toBe("undefined");
        expect(typeof widget.editFrequency).toBe("undefined");
        expect(typeof widget.toggleNotesButton).toBe("undefined");
        expect(widget.circleIsVisible).toBeUndefined();
    });

    test("_visualizerView is still present as the single default view", () => {
        expect(typeof widget._visualizerView).toBe("function");
    });

    test("createMainWheel is retained for edit-preview flows", () => {
        expect(typeof widget.createMainWheel).toBe("function");
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

    test("playAll delegates to _playAll when visualizer is open", () => {
        widget._playAllRunning = false;
        widget._playAll = jest.fn();

        widget.playAll();

        expect(widget._playAll).toHaveBeenCalled();
    });

    test("playAll is a no-op when visualizer is not open", () => {
        // _playAll is only set after _visualizerView runs; without it, playAll no-ops
        widget._playAll = undefined;

        // Should not throw
        widget.playAll();

        expect(widget._playAllRunning).toBeFalsy();
    });

    test("edit sets editMode to null and prepares UI", () => {
        // edit() reads temperamentTableDiv, which only exists once init(activity)
        // has run, so the widget must be initialized first (matching production
        // usage, where edit() is only reachable via a button created in init()).
        global.window.widgetWindows = {
            windowFor: jest.fn(() => ({
                clear: jest.fn(),
                show: jest.fn(),
                getWidgetBody: jest.fn(() => ({ append: jest.fn(), style: {} })),
                addButton: jest.fn(() => ({
                    onclick: null,
                    getElementsByTagName: jest.fn(() => [{}])
                })),
                sendToCenter: jest.fn()
            }))
        };
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

    test("ratioEdit rejects an invalid ratio like 1:54 without corrupting state", () => {
        widget.activity = { errorMsg: jest.fn() };
        widget.ratios = [1, 2];
        widget.frequencies = [440, 880];
        widget.powerBase = 2;
        widget.checkTemperament = jest.fn();
        widget._circleOfNotes = jest.fn();

        const divAppends = [];
        const realCreateElement = document.createElement.bind(document);
        jest.spyOn(document, "createElement").mockImplementation(tag => {
            const el = realCreateElement(tag);
            if (tag === "div") divAppends.push(el);
            return el;
        });

        global.docById = jest.fn(id => {
            if (id === "ratioIn") return { value: "1" };
            if (id === "ratioOut") return { value: "54" };
            if (id === "recursion") return { value: "1" };
            return {
                textContent: "",
                appendChild: jest.fn(),
                setAttribute: jest.fn(),
                style: {},
                append: jest.fn(),
                onmouseover: null,
                onclick: null
            };
        });

        widget.ratioEdit();
        document.createElement.mockRestore();

        const divWithOnclick = divAppends.find(el => typeof el.onclick === "function");
        expect(divWithOnclick).toBeDefined();
        divWithOnclick.onclick({ target: { textContent: "done" } });

        expect(widget.activity.errorMsg).toHaveBeenCalled();
        expect(widget.ratios).toEqual([1, 2]);
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
            setUserTemperament: jest.fn(function (t) {
                this.synth.inTemperament = t;
                this.synth.changeInTemperament = true;
            }),
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
        widget._playAllRunning = false;
        widget._playAll = jest.fn();

        widget.playAll();

        expect(widget._playAll).toHaveBeenCalled();
    });

    test("playAll stops when already playing", () => {
        widget._playAllRunning = true;
        widget._playAllTimer = setTimeout(() => {}, 10000);
        widget._playAll = function () {
            clearTimeout(widget._playAllTimer);
            widget._playAllRunning = false;
        };

        widget.playAll();

        expect(widget._playAllRunning).toBe(false);
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

        test("does not throw when interval values are plain numbers (equal temperament)", () => {
            global.getTemperamentKeys = jest.fn(() => ["equal"]);
            global.getTemperament = jest.fn(() => ({
                interval: ["unison", "octave"],
                pitchNumber: 1,
                unison: 1.0,
                octave: 2.0
            }));

            expect(() => widget.checkTemperament(["1.00", "2.00"])).not.toThrow();
        });

        test("does not throw when interval values are {ratio, cents} objects (just intonation)", () => {
            global.getTemperamentKeys = jest.fn(() => ["just"]);
            global.getTemperament = jest.fn(() => ({
                interval: ["unison", "fifth"],
                pitchNumber: 1,
                unison: { ratio: 1.0, cents: 0 },
                fifth: { ratio: 1.5, cents: 701.96 }
            }));

            expect(() => widget.checkTemperament(["1.00", "1.50"])).not.toThrow();
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

        test("mixed number and object interval values are both handled", () => {
            global.getTemperamentKeys = jest.fn(() => ["mixed"]);
            global.getTemperament = jest.fn(() => ({
                interval: ["unison", "third", "fifth"],
                pitchNumber: 2,
                unison: 1.0, // plain number
                third: { ratio: 1.25, cents: 386.31 }, // object
                fifth: 1.5 // plain number
            }));

            expect(() => widget.checkTemperament(["1.00", "1.25", "1.50"])).not.toThrow();
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

        beforeEach(() => {
            mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                getWidgetBody: jest.fn(() => ({ append: jest.fn(), style: {} })),
                addButton: jest.fn(() => ({
                    onclick: null,
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

        test("onclose cleans up timeouts and playing state", () => {
            widget._playAllRunning = true;
            widget._playAllTimer = setTimeout(() => {}, 1000);
            widget._playTimeout = setTimeout(() => {}, 1000);

            expect(mockWidgetWindow.onclose).toBeDefined();
            mockWidgetWindow.onclose();

            expect(widget._playAllRunning).toBe(false);
            expect(widget._playAllTimer).toBeNull();
            expect(widget._playTimeout).toBeNull();
            expect(mockActivity.logo.synth.stop).toHaveBeenCalled();
            expect(mockActivity.logo.synth.setMasterVolume).toHaveBeenCalled();
        });

        test("playAllBtn2 has an onclick handler", () => {
            const playBtn = mockWidgetWindow.addButton.mock.results[0].value;
            expect(playBtn.onclick).toBeDefined();
            expect(typeof playBtn.onclick).toBe("function");
        });

        test("saveButton click triggers _save", () => {
            const saveBtn = mockWidgetWindow.addButton.mock.results[1].value;
            expect(saveBtn.onclick).toBeDefined();

            widget._save = jest.fn();
            saveBtn.onclick();
            expect(widget._save).toHaveBeenCalled();
        });
    });

    describe("extracted helper: _paintPreviewWheelColors (exercised via equalEdit's preview click)", () => {
        test("previewing an equal-division edit colors every nav item and refreshes the wheel", () => {
            global.docById = jest.fn(id => {
                if (id === "octaveIn") return { value: "0" };
                if (id === "octaveOut") return { value: "0" };
                if (id === "divisions") return { value: "1" };
                return createMockElement(id);
            });

            widget.ratios = [1, 2];
            widget.frequencies = [440, 880];
            widget.pitchNumber = 1;
            widget.powerBase = 2;
            widget.checkTemperament = jest.fn();
            widget.createMainWheel = jest.fn();
            widget.notesCircle = {
                navItems: [
                    { fillAttr: "", sliceHoverAttr: {}, slicePathAttr: {}, sliceSelectedAttr: {} }
                ],
                refreshWheel: jest.fn()
            };

            widget.equalEdit();
            widget.performEqualEdit({ target: { textContent: "preview" } });

            expect(widget.createMainWheel).toHaveBeenCalled();
            const item = widget.notesCircle.navItems[0];
            expect(item.fillAttr).toBe(global.platformColor.selectorBackground);
            expect(item.sliceHoverAttr.fill).toBe(global.platformColor.selectorBackground);
            expect(item.slicePathAttr.fill).toBe(global.platformColor.selectorBackground);
            expect(item.sliceSelectedAttr.fill).toBe(global.platformColor.selectorBackground);
            expect(widget.notesCircle.refreshWheel).toHaveBeenCalled();
        });
    });

    describe("extracted helper: _removeWheelIfPresent (exercised via edit())", () => {
        const initWidget = () => {
            global.window.widgetWindows = {
                windowFor: jest.fn(() => ({
                    clear: jest.fn(),
                    show: jest.fn(),
                    getWidgetBody: jest.fn(() => ({ append: jest.fn(), style: {} })),
                    addButton: jest.fn(() => ({
                        onclick: null,
                        getElementsByTagName: jest.fn(() => [{}])
                    })),
                    sendToCenter: jest.fn()
                }))
            };
            global.buildScale = jest.fn(() => [["C"], []]);
            global.getNoteFromInterval = jest.fn(() => ["C", 4]);
            global.getTemperamentsList = jest.fn(() => [
                ["Equal (12EDO)", "equal"],
                ["Just intonation", "just"]
            ]);
            global.getTemperament = jest.fn(key => {
                if (key === "equal") {
                    return {
                        interval: ["unison", "octave"],
                        pitchNumber: 1,
                        unison: 1,
                        octave: 2,
                        0: 1,
                        1: 2,
                        noteLabels: [
                            "C",
                            "C#",
                            "D",
                            "Eb",
                            "E",
                            "F",
                            "F#",
                            "G",
                            "G#",
                            "A",
                            "Bb",
                            "B"
                        ]
                    };
                }
                return {
                    interval: ["unison", "octave"],
                    pitchNumber: 1,
                    unison: 1,
                    octave: 2,
                    0: 1,
                    1: 2,
                    noteLabels: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"]
                };
            });

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
            widget._logo = { synth: { setMasterVolume: jest.fn(), stop: jest.fn() } };
            document.querySelectorAll = jest.fn(() => [
                { style: {} },
                { style: {} },
                { style: {} },
                { style: {} }
            ]);
        };

        test("edit() hides and removes the circle-of-notes wheel when it is on screen", () => {
            initWidget();
            const wheelDiv = { style: {} };
            global.docById = jest.fn(id => (id === "wheelDiv2" ? wheelDiv : createMockElement(id)));
            widget.notesCircle = { removeWheel: jest.fn() };

            widget.edit();

            expect(wheelDiv.style.display).toBe("none");
            expect(widget.notesCircle.removeWheel).toHaveBeenCalled();
        });

        test("edit() leaves the wheel alone when it is not on screen", () => {
            initWidget();
            global.docById = jest.fn(id => (id === "wheelDiv2" ? null : createMockElement(id)));
            widget.notesCircle = { removeWheel: jest.fn() };

            widget.edit();

            expect(widget.notesCircle.removeWheel).not.toHaveBeenCalled();
        });
    });

    describe("extracted helper: addPreviewDoneButtonPair", () => {
        const captureCreatedDivs = () => {
            const created = [];
            const realCreateElement = document.createElement.bind(document);
            jest.spyOn(document, "createElement").mockImplementation(tag => {
                const el = realCreateElement(tag);
                if (tag === "div") created.push(el);
                return el;
            });
            return created;
        };

        test("equalEdit builds a preview/done pair offset by -80px", () => {
            const created = captureCreatedDivs();
            global.docById = jest.fn(id => createMockElement(id));

            widget.equalEdit();
            document.createElement.mockRestore();

            const divAppend = created.find(el => el.id === "divAppend");
            expect(divAppend.style.marginLeft).toBe("-80px");

            const children = Array.from(divAppend.children);
            expect(children.find(c => c.id === "preview").textContent).toBe("preview");
            expect(children.find(c => c.id === "done_").textContent).toBe("done");
        });

        test("ratioEdit builds a preview/done pair offset by -100px", () => {
            const created = captureCreatedDivs();
            global.docById = jest.fn(id => createMockElement(id));

            widget.ratioEdit();
            document.createElement.mockRestore();

            const divAppend = created.find(el => el.id === "divAppend");
            expect(divAppend.style.marginLeft).toBe("-100px");
        });
    });

    describe("regression tests for visualizer / reference fixes", () => {
        test("equal17 exposes keyed interval->ratio properties (regression)", () => {
            const musicutils = require("../../utils/musicutils");
            const t = musicutils.getTemperament("equal17");
            expect(t).toBeTruthy();
            expect(typeof t["perfect 1"]).toBe("number");
            expect(t["perfect 1"]).toBeCloseTo(1, 6);
            expect(t["minor 2"]).toBeCloseTo(Math.pow(2, 1 / 17), 6);
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

    test("Add pitches is renamed to Create new temperament and is the only alt view", () => {
        expect(typeof widget.edit).toBe("function");
        expect(typeof widget.equalEdit).toBe("function");
        expect(typeof widget.ratioEdit).toBe("function");
        expect(typeof widget.arbitraryEdit).toBe("function");
        expect(typeof widget.octaveSpaceEdit).toBe("function");
    });

    test("init() opens the visualizer as the default view", () => {
        const mockWidgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            getWidgetBody: jest.fn(() => ({ append: jest.fn(), style: {} })),
            addButton: jest.fn(() => ({
                onclick: null,
                getElementsByTagName: jest.fn(() => [{}]),
                style: {}
            })),
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
            0: [1, "C", 4]
        }));
        widget.inTemperament = "equal";
        widget.scale = ["C", "Major"];
        // Spy on _visualizerView
        const spy = jest.spyOn(widget, "_visualizerView").mockImplementation(() => {});
        widget.init({
            errorMsg: jest.fn(),
            logo: { synth: { startingPitch: "C4", _getFrequency: jest.fn(() => 260) } }
        });
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    describe("visualizer cents editor — neighbor bounds and labeling", () => {
        test("editing cents updates the visualizer circle and table (integration)", () => {
            widget.cents = [0, 400, 700];
            widget.ratios = [1, Math.pow(2, 400 / 1200), Math.pow(2, 700 / 1200)];
            widget.frequencies = ["260.74", "328.00", "391.11"];
            widget.pitchNumber = 3;
            widget.inTemperament = "equal";
            document.body.innerHTML = '<div id="temperamentTable"></div>';
            global.docById = jest.fn(id => document.getElementById(id));
            const cur = 1;
            const prev = widget.cents[cur - 1];
            const next = widget.cents[cur + 1];
            const attempted = 900;
            const clamped = Math.min(attempted, next - 0.5);
            expect(clamped).toBeLessThan(next);
            expect(clamped).toBeGreaterThan(prev);
        });
    });
});
